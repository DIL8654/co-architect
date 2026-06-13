using System.Text;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;
using CoArchitect.Domain.Services;

namespace CoArchitect.Application.Services;

public sealed class MultiAgentArchitectureAnalysisService : IMultiAgentArchitectureAnalysisService
{
    private readonly IArchitectureAgentService _expertAgentService;
    private readonly IFrameworkSelectionService _frameworkSelectionService;
    private readonly IContextEnrichmentAgent _contextEnrichmentAgent;

    public MultiAgentArchitectureAnalysisService(
        IArchitectureAgentService expertAgentService,
        IFrameworkSelectionService frameworkSelectionService,
        IContextEnrichmentAgent contextEnrichmentAgent)
    {
        _expertAgentService = expertAgentService;
        _frameworkSelectionService = frameworkSelectionService;
        _contextEnrichmentAgent = contextEnrichmentAgent;
    }

    public async Task<AgentAnalysisResult> AnalyzeAsync(ArchitectureDiagram diagram, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var analysisStartedAt = DateTime.UtcNow;
        var facts = ArchitectureFacts.Extract(diagram);
        var traces = new List<AgentExecutionTrace>();
        var effectiveWeights = diagram.QualityAttributeWeights.Any()
            ? diagram.QualityAttributeWeights.ToList()
            : _frameworkSelectionService.GetDefaultWeights().ToList();

        var frameworkDecision = ResolveFrameworkDecision(diagram, effectiveWeights);
        var selectedFrameworks = frameworkDecision.SelectedFrameworks.ToList();
        var selectedStandards = frameworkDecision.SelectedStandards.ToList();

        var intakeStartedAt = DateTime.UtcNow;
        traces.Add(CreateTrace(
            "Intake Agent",
            "Normalize architecture input, review setup, and quality priorities.",
            intakeStartedAt,
            BuildIntakeSummary(diagram, effectiveWeights),
            new[]
            {
                $"Diagram: {diagram.Name}",
                $"Context fields present: {CountContextFields(diagram.ReviewContext)}",
                $"Detected technologies: {string.Join(", ", facts.Technologies.DefaultIfEmpty("Unspecified"))}",
                $"Top weighted priorities: {string.Join(", ", GetTopWeights(effectiveWeights).DefaultIfEmpty("Balanced"))}",
            },
            grounding: BuildGrounding(selectedFrameworks.Select(item => item.ToString()), selectedStandards.Select(item => ToStandardLabel(item)), GetTopWeights(effectiveWeights), Array.Empty<string>(), Array.Empty<string>(), Array.Empty<string>())));

        var understandingStartedAt = DateTime.UtcNow;
        traces.Add(CreateTrace(
            "Diagram Understanding Agent",
            "Extract architecture cues, component signals, and missing evidence from the current submission.",
            understandingStartedAt,
            BuildDiagramUnderstandingSummary(facts),
            facts.PositiveSignals.Take(4),
            grounding: BuildGrounding(selectedFrameworks.Select(item => item.ToString()), selectedStandards.Select(item => ToStandardLabel(item)), Array.Empty<string>(), Array.Empty<string>(), Array.Empty<string>(), Array.Empty<string>())));

        var frameworkSelectionStartedAt = DateTime.UtcNow;
        traces.Add(CreateTrace(
            "Framework Selection Agent",
            "Select review frameworks using architecture cues and stored review preferences.",
            frameworkSelectionStartedAt,
            BuildPlannerSummary(diagram, facts, frameworkDecision),
            frameworkDecision.SelectionRationale.Concat(new[] { $"Framework source: {frameworkDecision.Source}" }),
            grounding: BuildGrounding(selectedFrameworks.Select(item => item.ToString()), selectedStandards.Select(item => ToStandardLabel(item)), Array.Empty<string>(), Array.Empty<string>(), Array.Empty<string>(), Array.Empty<string>())));

        var enrichmentStartedAt = DateTime.UtcNow;
        var enrichment = await _contextEnrichmentAgent.EnrichAsync(diagram, selectedFrameworks, selectedStandards, effectiveWeights, cancellationToken);
        traces.Add(CreateTrace(
            "Context Enrichment Agent",
            "Retrieve shared architecture intelligence, principles, trade-offs, and workspace memory before specialist reasoning.",
            enrichmentStartedAt,
            enrichment.Summary,
            enrichment.MissingContextNotes.Concat(new[]
            {
                enrichment.ContextBundle.WorkspaceMemory.ArchitectureEvolutionSummary,
            }),
            grounding: BuildGrounding(
                selectedFrameworks.Select(item => item.ToString()),
                selectedStandards.Select(item => ToStandardLabel(item)),
                enrichment.ApplicablePrinciples,
                enrichment.ApplicableTradeoffs,
                enrichment.ContextBundle.WorkspaceMemory.AdrHistory,
                enrichment.ContextBundle.CitationRefs)));

        var retrievalStartedAt = DateTime.UtcNow;
        traces.Add(CreateTrace(
            "Foundry IQ Retrieval",
            "Assemble framework knowledge, ADR patterns, trade-off guidance, and workspace memory into a shared context bundle.",
            retrievalStartedAt,
            BuildRetrievalSummary(enrichment.ContextBundle),
            enrichment.ContextBundle.CitationRefs.Take(4),
            usedFoundry: true,
            grounding: BuildGrounding(
                selectedFrameworks.Select(item => item.ToString()),
                selectedStandards.Select(item => ToStandardLabel(item)),
                enrichment.ApplicablePrinciples,
                enrichment.ApplicableTradeoffs,
                enrichment.ContextBundle.WorkspaceMemory.PreviousReviewSummaries.Take(2),
                enrichment.ContextBundle.CitationRefs)));

        var expertStartedAt = DateTime.UtcNow;
        var expertBaseline = await _expertAgentService.AnalyzeAsync(
            diagram.Id,
            BuildExpertPrompt(diagram, facts, selectedFrameworks, selectedStandards, effectiveWeights, enrichment),
            cancellationToken);
        if (expertBaseline.AgentTrace.Count > 0)
        {
            traces.AddRange(expertBaseline.AgentTrace);
        }
        else
        {
            traces.Add(CreateTrace(
                "Foundry Expert",
                "Single cost-aware external AI call used as expert context.",
                expertStartedAt,
                "Collected one external expert analysis to ground the orchestration without multiplying token cost.",
                expertBaseline.Evidence.Take(3).Select(item => item.Summary),
                usedFoundry: true,
                grounding: BuildGrounding(
                    selectedFrameworks.Select(item => item.ToString()),
                    selectedStandards.Select(item => ToStandardLabel(item)),
                    enrichment.ApplicablePrinciples,
                    enrichment.ApplicableTradeoffs,
                    enrichment.ContextBundle.WorkspaceMemory.PreviousReviewSummaries.Take(2),
                    enrichment.ContextBundle.CitationRefs)));
        }

        var specialistOutputs = new List<SpecialistOutput>();
        foreach (var framework in selectedFrameworks)
        {
            var specialistStartedAt = DateTime.UtcNow;
            var output = BuildFrameworkSpecialistOutput(framework, facts, diagram, enrichment);
            specialistOutputs.Add(output);
            traces.Add(CreateTrace(
                GetSpecialistName(framework),
                $"Framework specialist for {framework}.",
                specialistStartedAt,
                output.Summary,
                output.Highlights,
                framework.ToString(),
                grounding: BuildGrounding(
                    new[] { framework.ToString() },
                    selectedStandards.Select(item => ToStandardLabel(item)),
                    enrichment.ApplicablePrinciples,
                    enrichment.ApplicableTradeoffs,
                    enrichment.ContextBundle.WorkspaceMemory.RecurringFindings,
                    GetFrameworkCitations(enrichment.ContextBundle, framework))));
        }

        var tradeoffStartedAt = DateTime.UtcNow;
        var tradeoffOutput = BuildTradeoffOutput(diagram, facts, specialistOutputs, expertBaseline, enrichment);
        traces.Add(CreateTrace(
            "Trade-off Balancing Agent",
            "Balance architecture priorities, risks, and delivery constraints.",
            tradeoffStartedAt,
            tradeoffOutput.Summary,
            tradeoffOutput.Highlights,
            grounding: BuildGrounding(
                selectedFrameworks.Select(item => item.ToString()),
                selectedStandards.Select(item => ToStandardLabel(item)),
                enrichment.ApplicablePrinciples,
                enrichment.ApplicableTradeoffs,
                enrichment.ContextBundle.WorkspaceMemory.PriorRecommendations,
                enrichment.ContextBundle.CitationRefs)));

        var combined = CombineResults(diagram.Id, expertBaseline, specialistOutputs, tradeoffOutput, enrichment);

        var scoringStartedAt = DateTime.UtcNow;
        traces.Add(CreateTrace(
            "Architecture Scoring Agent",
            "Suggest maturity shifts while leaving final score calculation to the application scoring engine.",
            scoringStartedAt,
            $"Generated {combined.DimensionMaturitySuggestions.Count} dimension maturity suggestions without computing the final Architecture Intelligence Score.",
            combined.DimensionMaturitySuggestions.Select(item => $"{item.Dimension}: {item.CurrentMaturity}->{item.SuggestedMaturity}").Take(4),
            grounding: BuildGrounding(
                selectedFrameworks.Select(item => item.ToString()),
                selectedStandards.Select(item => ToStandardLabel(item)),
                enrichment.ApplicablePrinciples,
                enrichment.ApplicableTradeoffs,
                enrichment.ContextBundle.WorkspaceMemory.RecurringFindings,
                enrichment.ContextBundle.CitationRefs)));

        var adrStartedAt = DateTime.UtcNow;
        traces.Add(CreateTrace(
            "ADR Generation Agent",
            "Prepare ADR-ready decision context from grounded findings, trade-offs, and prior decision history.",
            adrStartedAt,
            $"Prepared ADR context using {enrichment.ContextBundle.AdrTemplateItems.Count} template sections and {enrichment.ContextBundle.RelatedAdrHistoryItems.Count} prior ADR history items.",
            enrichment.ContextBundle.RelatedAdrHistoryItems.Select(item => item.Title).Take(3),
            grounding: BuildGrounding(
                selectedFrameworks.Select(item => item.ToString()),
                selectedStandards.Select(item => ToStandardLabel(item)),
                enrichment.ApplicablePrinciples,
                enrichment.ApplicableTradeoffs,
                enrichment.ContextBundle.WorkspaceMemory.AdrHistory,
                enrichment.ContextBundle.CitationRefs)));

        var criticStartedAt = DateTime.UtcNow;
        var criticNotes = CriticReview(combined);
        traces.Add(CreateTrace(
            "Critic / Verifier Agent",
            "Verify clarity, grounding, and recommendation completeness before final composition.",
            criticStartedAt,
            "Validated duplicates, recommendation coverage, evidence quality, and grounding coverage before returning the final response.",
            criticNotes.Take(3),
            grounding: BuildGrounding(
                selectedFrameworks.Select(item => item.ToString()),
                selectedStandards.Select(item => ToStandardLabel(item)),
                enrichment.ApplicablePrinciples,
                enrichment.ApplicableTradeoffs,
                enrichment.ContextBundle.WorkspaceMemory.RecurringFindings,
                enrichment.ContextBundle.CitationRefs)));

        var composerStartedAt = DateTime.UtcNow;
        traces.Add(CreateTrace(
            "Recommendation Composer Agent",
            "Compose the final summary, prioritized findings, and explanation lineage for the user-facing report.",
            composerStartedAt,
            "Combined grounded specialist output into a single architecture review with framework, principle, trade-off, and history references.",
            combined.Recommendations.Select(item => item.Description).Take(3),
            grounding: BuildGrounding(
                selectedFrameworks.Select(item => item.ToString()),
                selectedStandards.Select(item => ToStandardLabel(item)),
                enrichment.ApplicablePrinciples,
                enrichment.ApplicableTradeoffs,
                enrichment.ContextBundle.WorkspaceMemory.PriorRecommendations,
                enrichment.ContextBundle.CitationRefs)));

        return new AgentAnalysisResult
        {
            Id = Guid.NewGuid(),
            ArchitectureDiagramId = diagram.Id,
            RequestedAt = analysisStartedAt,
            CompletedAt = DateTime.UtcNow,
            ExecutiveSummary = BuildExecutiveSummary(diagram, combined, selectedFrameworks, selectedStandards),
            ResolvedFrameworkSelection = new FrameworkSelectionResult
            {
                Mode = frameworkDecision.Source == "stored review setup" ? diagram.FrameworkSelection.Mode : FrameworkSelectionMode.AutoDetect,
                DetectedCloudProvider = diagram.FrameworkSelection.DetectedCloudProvider ?? InferDetectedCloudProvider(selectedFrameworks, facts),
                ConfidenceScore = diagram.FrameworkSelection.ConfidenceScore > 0
                    ? diagram.FrameworkSelection.ConfidenceScore
                    : InferConfidence(selectedFrameworks, facts),
                RequestedFrameworks = diagram.FrameworkSelection.RequestedFrameworks.ToList(),
                SelectedFrameworks = selectedFrameworks,
                RequestedStandards = diagram.FrameworkSelection.RequestedStandards.ToList(),
                SelectedStandards = selectedStandards,
                SelectionRationale = frameworkDecision.SelectionRationale.Count > 0
                    ? frameworkDecision.SelectionRationale
                    : new List<string> { $"Frameworks were resolved from {frameworkDecision.Source}." },
            },
            ResolvedQualityAttributeWeights = effectiveWeights.ToList(),
            OpenQuestions = BuildOpenQuestions(diagram, facts).Concat(enrichment.MissingContextNotes).Distinct(StringComparer.OrdinalIgnoreCase).Take(6).ToList(),
            CriticNotes = criticNotes,
            FoundryIqContext = enrichment.ContextBundle,
            AgentTrace = traces,
            Evidence = combined.Evidence,
            MissingControls = combined.MissingControls,
            Recommendations = combined.Recommendations,
            Tradeoffs = combined.Tradeoffs,
            DimensionMaturitySuggestions = combined.DimensionMaturitySuggestions,
        };
    }

    private static string BuildExpertPrompt(
        ArchitectureDiagram diagram,
        ArchitectureFacts facts,
        IReadOnlyCollection<ReviewFramework> frameworks,
        IReadOnlyCollection<ReviewStandard> standards,
        IReadOnlyCollection<QualityAttributeWeight> effectiveWeights,
        ContextEnrichmentResult enrichment)
    {
        var builder = new StringBuilder();

        if (!string.IsNullOrWhiteSpace(diagram.Description))
        {
            builder.AppendLine(diagram.Description.Trim());
        }

        builder.AppendLine();
        builder.AppendLine($"Frameworks: {string.Join(", ", frameworks)}");
        if (standards.Count > 0)
        {
            builder.AppendLine($"Additional standards: {string.Join(", ", standards.Select(ToStandardLabel))}");
        }
        builder.AppendLine($"Technologies: {string.Join(", ", facts.Technologies.DefaultIfEmpty("Unspecified"))}");

        if (!string.IsNullOrWhiteSpace(diagram.ReviewContext.BusinessDomain))
        {
            builder.AppendLine($"Business domain: {diagram.ReviewContext.BusinessDomain}");
        }

        if (effectiveWeights.Any())
        {
            builder.AppendLine("Priority weights:");
            foreach (var weight in effectiveWeights.OrderByDescending(item => item.Weight))
            {
                builder.AppendLine($"- {weight.Label}: {weight.Weight}%");
            }
        }

        if (enrichment.ApplicablePrinciples.Any())
        {
            builder.AppendLine($"Applicable principles: {string.Join(", ", enrichment.ApplicablePrinciples)}");
        }

        if (enrichment.ApplicableTradeoffs.Any())
        {
            builder.AppendLine($"Trade-off focus: {string.Join(", ", enrichment.ApplicableTradeoffs.Take(4))}");
        }

        if (enrichment.ContextBundle.WorkspaceMemory.PreviousReviewSummaries.Any())
        {
            builder.AppendLine("Prior review memory:");
            foreach (var item in enrichment.ContextBundle.WorkspaceMemory.PreviousReviewSummaries.Take(2))
            {
                builder.AppendLine($"- {item}");
            }
        }

        return builder.ToString().Trim();
    }

    private static string BuildIntakeSummary(ArchitectureDiagram diagram, IReadOnlyCollection<QualityAttributeWeight> effectiveWeights)
    {
        var parts = new List<string>
        {
            string.IsNullOrWhiteSpace(diagram.Description)
                ? "The architecture submission relied mostly on uploaded evidence and review setup fields."
                : "The architecture submission included descriptive context that could be normalized for specialist review."
        };

        if (effectiveWeights.Any())
        {
            parts.Add($"Priority weighting emphasized {string.Join(", ", GetTopWeights(effectiveWeights))}.");
        }

        return string.Join(" ", parts);
    }

    private static int CountContextFields(ArchitectureReviewContext context)
    {
        return new[]
        {
            context.BusinessDomain,
            context.TargetUsers,
            context.ExpectedTraffic,
            context.DataSensitivity,
            context.CloudProviderPreference,
            context.ComplianceNeeds,
            context.CurrentPainPoints,
        }.Count(value => !string.IsNullOrWhiteSpace(value));
    }

    private static string BuildDiagramUnderstandingSummary(ArchitectureFacts facts)
    {
        if (facts.Technologies.Count == 0)
        {
            return "The diagram understanding step found limited explicit technology cues, so specialist reasoning will lean more heavily on review context and framework defaults.";
        }

        return $"Detected technologies and control cues included {string.Join(", ", facts.Technologies.Take(5))}. Missing signals will be treated as review questions rather than assumed controls.";
    }

    private static string BuildPlannerSummary(ArchitectureDiagram diagram, ArchitectureFacts facts, FrameworkDecision decision)
    {
        var summaryParts = new List<string>
        {
            $"The planner selected {decision.SelectedFrameworks.Count} specialist agent{(decision.SelectedFrameworks.Count == 1 ? string.Empty : "s")} based on {decision.Source}."
        };

        if (facts.CloudSignals.Count > 0)
        {
            summaryParts.Add($"Cloud signals point to {string.Join(", ", facts.CloudSignals)}.");
        }

        if (decision.SelectionRationale.Count > 0)
        {
            summaryParts.Add(decision.SelectionRationale[0]);
        }

        if (diagram.QualityAttributeWeights.Any())
        {
            summaryParts.Add($"Highest-weight priorities are {string.Join(", ", GetTopWeights(diagram.QualityAttributeWeights))}.");
        }

        return string.Join(" ", summaryParts);
    }

    private static IEnumerable<string> GetTopWeights(IEnumerable<QualityAttributeWeight> weights)
    {
        return weights
            .OrderByDescending(item => item.Weight)
            .Take(3)
            .Select(item => item.Label);
    }

    private static SpecialistOutput BuildFrameworkSpecialistOutput(
        ReviewFramework framework,
        ArchitectureFacts facts,
        ArchitectureDiagram diagram,
        ContextEnrichmentResult enrichment)
    {
        var evidence = new List<EvidenceItem>();
        var missingControls = new List<MissingControl>();
        var recommendations = new List<Recommendation>();
        var maturity = new List<DimensionMaturitySuggestion>();
        var highlights = new List<string>();

        void addControl(string keyword, string name, string description, ArchitectureDimension dimension, SuggestionSeverity severity)
        {
            if (facts.Contains(keyword))
            {
                return;
            }

            missingControls.Add(new MissingControl
            {
                Name = name,
                Description = description,
                Dimension = dimension,
                Grounding = BuildGrounding(
                    new[] { framework.ToString() },
                    enrichment.ConfirmedStandards.Select(ToStandardLabel),
                    enrichment.ApplicablePrinciples,
                    enrichment.ApplicableTradeoffs,
                    enrichment.ContextBundle.WorkspaceMemory.RecurringFindings,
                    GetFrameworkCitations(enrichment.ContextBundle, framework)),
            });

            recommendations.Add(new Recommendation
            {
                Description = description,
                Severity = severity,
                Grounding = BuildGrounding(
                    new[] { framework.ToString() },
                    enrichment.ConfirmedStandards.Select(ToStandardLabel),
                    enrichment.ApplicablePrinciples,
                    enrichment.ApplicableTradeoffs,
                    enrichment.ContextBundle.WorkspaceMemory.PriorRecommendations,
                    GetFrameworkCitations(enrichment.ContextBundle, framework)),
            });

            highlights.Add(name);
        }

        switch (framework)
        {
            case ReviewFramework.AzureWellArchitected:
                evidence.Add(new EvidenceItem
                {
                    Summary = "Azure-focused review considered operational, security, performance, and resilience posture.",
                    Details = "The Azure specialist looked for managed identity, observability, disaster recovery, autoscale, and governance controls.",
                    Grounding = BuildGrounding(
                        new[] { framework.ToString() },
                        enrichment.ConfirmedStandards.Select(ToStandardLabel),
                        enrichment.ApplicablePrinciples,
                        enrichment.ApplicableTradeoffs,
                        enrichment.ContextBundle.WorkspaceMemory.PreviousReviewSummaries.Take(2),
                        GetFrameworkCitations(enrichment.ContextBundle, framework)),
                });
                addControl("monitor", "Monitoring and alerting", "Add Azure Monitor, distributed tracing, and actionable alerts for the API, jobs, and storage integrations.", ArchitectureDimension.OperationalExcellence, SuggestionSeverity.High);
                addControl("disaster recovery", "Disaster recovery drill", "Define RPO/RTO targets, backup restore validation, and regional recovery steps for critical workloads.", ArchitectureDimension.ReliabilityAvailability, SuggestionSeverity.High);
                addControl("secret", "Managed secrets and identity", "Use managed identity and Azure Key Vault for service credentials, storage access, and database connections.", ArchitectureDimension.Security, SuggestionSeverity.High);
                addControl("autoscale", "Autoscaling policy", "Define autoscaling signals for burst traffic, background work, and data access bottlenecks.", ArchitectureDimension.ScalabilityPerformance, SuggestionSeverity.Medium);
                maturity.Add(CreateMaturity(ArchitectureDimension.OperationalExcellence, facts.Contains("monitor") ? 3 : 2, 3, "Observability is a primary Azure reliability and operations lever."));
                maturity.Add(CreateMaturity(ArchitectureDimension.Security, facts.Contains("secret") ? 3 : 2, 3, "Managed identity and secret handling shape the Azure security baseline."));
                break;

            case ReviewFramework.AwsWellArchitected:
                evidence.Add(new EvidenceItem
                {
                    Summary = "AWS-oriented review compared platform choices, operational overhead, and resilience trade-offs.",
                    Details = "The AWS specialist looked for explicit operational excellence, reliability, and cost signals even when the deployment target is not final.",
                    Grounding = BuildGrounding(
                        new[] { framework.ToString() },
                        enrichment.ConfirmedStandards.Select(ToStandardLabel),
                        enrichment.ApplicablePrinciples,
                        enrichment.ApplicableTradeoffs,
                        enrichment.ContextBundle.WorkspaceMemory.PreviousReviewSummaries.Take(2),
                        GetFrameworkCitations(enrichment.ContextBundle, framework)),
                });
                addControl("api gateway", "API gateway boundary", "Add a gateway layer for routing, rate limiting, API policies, and service-level observability.", ArchitectureDimension.Security, SuggestionSeverity.Medium);
                addControl("queue", "Asynchronous workload buffering", "Introduce queue-based decoupling for long-running or burst-sensitive workflows.", ArchitectureDimension.ScalabilityPerformance, SuggestionSeverity.Medium);
                maturity.Add(CreateMaturity(ArchitectureDimension.CostOptimization, 2, 3, "The architecture should make cost and operational trade-offs explicit before scaling."));
                break;

            case ReviewFramework.Iso25010:
                evidence.Add(new EvidenceItem
                {
                    Summary = "ISO/IEC 25010 review focused on maintainability, reliability, usability, and performance fitness.",
                    Details = "The quality specialist reviewed whether the architecture exposes enough signals for maintainability, portability, and supportability.",
                    Grounding = BuildGrounding(
                        new[] { framework.ToString() },
                        enrichment.ConfirmedStandards.Select(ToStandardLabel),
                        enrichment.ApplicablePrinciples,
                        enrichment.ApplicableTradeoffs,
                        enrichment.ContextBundle.WorkspaceMemory.PreviousReviewSummaries.Take(2),
                        GetFrameworkCitations(enrichment.ContextBundle, framework)),
                });
                addControl("audit", "Audit logging", "Add audit logging for privileged actions, tenant-sensitive workflows, and decision-changing operations.", ArchitectureDimension.ComplianceGovernance, SuggestionSeverity.Medium);
                addControl("runbook", "Operational runbooks", "Document repeatable recovery, deployment, and support procedures for the main user journeys.", ArchitectureDimension.Maintainability, SuggestionSeverity.Medium);
                maturity.Add(CreateMaturity(ArchitectureDimension.Maintainability, 2, 3, "Clear operating guidance and change management improve long-term system quality."));
                break;

            case ReviewFramework.OwaspAsvs:
                evidence.Add(new EvidenceItem
                {
                    Summary = "OWASP ASVS review focused on API protection, data sensitivity, and boundary hardening.",
                    Details = "The security specialist looked for authentication boundaries, secrets handling, logging, and tenant-protection signals.",
                    Grounding = BuildGrounding(
                        new[] { framework.ToString() },
                        enrichment.ConfirmedStandards.Select(ToStandardLabel),
                        enrichment.ApplicablePrinciples,
                        enrichment.ApplicableTradeoffs,
                        enrichment.ContextBundle.WorkspaceMemory.PreviousReviewSummaries.Take(2),
                        GetFrameworkCitations(enrichment.ContextBundle, framework)),
                });
                addControl("tenant isolation", "Tenant isolation", "Define tenant boundaries in identity, storage, authorization, and support tooling.", ArchitectureDimension.DataTenantIsolation, SuggestionSeverity.High);
                addControl("waf", "Application protection boundary", "Add API protection controls such as gateway policy, request validation, and abuse protection.", ArchitectureDimension.Security, SuggestionSeverity.Medium);
                maturity.Add(CreateMaturity(ArchitectureDimension.DataTenantIsolation, facts.Contains("tenant isolation") ? 3 : 1, 2, "External users and shared data flows make tenant isolation a first-class control."));
                break;
        }

        if (!facts.PositiveSignals.Any())
        {
            evidence.Add(new EvidenceItem
            {
                Summary = $"The {framework} specialist found limited explicit operational detail in the provided architecture evidence.",
                Details = "The review still produced recommendations, but several findings remain assumption-driven until more evidence is added.",
                Grounding = BuildGrounding(
                    new[] { framework.ToString() },
                    enrichment.ConfirmedStandards.Select(ToStandardLabel),
                    enrichment.ApplicablePrinciples,
                    enrichment.ApplicableTradeoffs,
                    enrichment.ContextBundle.WorkspaceMemory.PreviousReviewSummaries.Take(2),
                    GetFrameworkCitations(enrichment.ContextBundle, framework)),
            });
        }

        return new SpecialistOutput(
            framework,
            $"The {framework} specialist identified {missingControls.Count} key gaps and {recommendations.Count} action items.",
            highlights.Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList(),
            evidence,
            missingControls,
            recommendations,
            maturity);
    }

    private static TradeoffOutput BuildTradeoffOutput(
        ArchitectureDiagram diagram,
        ArchitectureFacts facts,
        IReadOnlyCollection<SpecialistOutput> specialistOutputs,
        AgentAnalysisResult expertBaseline,
        ContextEnrichmentResult enrichment)
    {
        var highlights = new List<string>();
        var tradeoffs = expertBaseline.Tradeoffs
            .Select(item => new Tradeoff
            {
                Id = item.Id,
                Summary = item.Summary,
                Pros = item.Pros,
                Cons = item.Cons,
                Grounding = item.Grounding.FrameworkRefs.Count > 0
                    ? item.Grounding
                    : BuildGrounding(
                        diagram.FrameworkSelection.SelectedFrameworks.Select(item => item.ToString()),
                        diagram.FrameworkSelection.SelectedStandards.Select(ToStandardLabel),
                        enrichment.ApplicablePrinciples,
                        enrichment.ApplicableTradeoffs,
                        enrichment.ContextBundle.WorkspaceMemory.PriorRecommendations,
                        enrichment.ContextBundle.CitationRefs),
            })
            .ToList();

        var topWeights = diagram.QualityAttributeWeights
            .OrderByDescending(item => item.Weight)
            .Take(3)
            .ToList();

        if (topWeights.Any(item => item.Key.Equals("security", StringComparison.OrdinalIgnoreCase)))
        {
            tradeoffs.Add(new Tradeoff
            {
                Summary = "Security controls versus delivery speed",
                Pros = new[] { "Managed identity and audited access reduce security exposure.", "Governed secrets handling improves incident readiness." },
                Cons = new[] { "More upfront platform wiring is required.", "Teams may need to adjust local development practices." },
                Grounding = BuildGrounding(
                    specialistOutputs.Select(item => item.Framework.ToString()),
                    enrichment.ConfirmedStandards.Select(ToStandardLabel),
                    enrichment.ApplicablePrinciples,
                    new[] { "Security vs usability", "Speed of delivery vs governance" },
                    enrichment.ContextBundle.WorkspaceMemory.PriorRecommendations,
                    enrichment.ContextBundle.CitationRefs),
            });
            highlights.Add("Security vs delivery speed");
        }

        if (topWeights.Any(item => item.Key.Equals("scalability", StringComparison.OrdinalIgnoreCase) || item.Key.Equals("availability", StringComparison.OrdinalIgnoreCase)))
        {
            tradeoffs.Add(new Tradeoff
            {
                Summary = "Simplicity versus scalability",
                Pros = new[] { "Queues, autoscaling, and background workers improve burst handling.", "Clear reliability boundaries reduce operational risk." },
                Cons = new[] { "The runtime becomes harder to trace end-to-end.", "Additional platform components increase setup effort." },
                Grounding = BuildGrounding(
                    specialistOutputs.Select(item => item.Framework.ToString()),
                    enrichment.ConfirmedStandards.Select(ToStandardLabel),
                    enrichment.ApplicablePrinciples,
                    new[] { "Simplicity vs scalability" },
                    enrichment.ContextBundle.WorkspaceMemory.RecurringFindings,
                    enrichment.ContextBundle.CitationRefs),
            });
            highlights.Add("Simplicity vs scalability");
        }

        if (facts.CloudSignals.Count > 1 || specialistOutputs.Any(item => item.Framework is ReviewFramework.AzureWellArchitected or ReviewFramework.AwsWellArchitected))
        {
            tradeoffs.Add(new Tradeoff
            {
                Summary = "Cloud neutrality versus platform leverage",
                Pros = new[] { "Provider-specific managed services improve delivery speed and operational quality.", "Platform-native observability and security can reduce custom code." },
                Cons = new[] { "Deeper provider coupling can increase migration cost.", "Cross-cloud comparisons become more complex." },
                Grounding = BuildGrounding(
                    specialistOutputs.Select(item => item.Framework.ToString()),
                    enrichment.ConfirmedStandards.Select(ToStandardLabel),
                    enrichment.ApplicablePrinciples,
                    new[] { "Vendor lock-in vs platform leverage" },
                    enrichment.ContextBundle.WorkspaceMemory.AdrHistory,
                    enrichment.ContextBundle.CitationRefs),
            });
            highlights.Add("Cloud neutrality vs leverage");
        }

        return new TradeoffOutput(
            "Trade-off balancing prioritized the highest-weight quality attributes and compared them against delivery effort and platform complexity.",
            highlights,
            tradeoffs.DistinctBy(item => item.Summary, StringComparer.OrdinalIgnoreCase).ToList());
    }

    private static CombinedResult CombineResults(
        Guid diagramId,
        AgentAnalysisResult expertBaseline,
        IReadOnlyCollection<SpecialistOutput> specialistOutputs,
        TradeoffOutput tradeoffOutput,
        ContextEnrichmentResult enrichment)
    {
        var expertGrounding = BuildGrounding(
            expertBaseline.ResolvedFrameworkSelection.SelectedFrameworks.Select(item => item.ToString()),
            expertBaseline.ResolvedFrameworkSelection.SelectedStandards.Select(ToStandardLabel),
            enrichment.ApplicablePrinciples,
            enrichment.ApplicableTradeoffs,
            enrichment.ContextBundle.WorkspaceMemory.PreviousReviewSummaries.Take(2),
            enrichment.ContextBundle.CitationRefs);

        var evidence = expertBaseline.Evidence
            .Select(item => item.Grounding.FrameworkRefs.Count > 0
                ? item
                : new EvidenceItem
                {
                    Id = item.Id,
                    Summary = item.Summary,
                    Details = item.Details,
                    Grounding = expertGrounding,
                })
            .ToList();
        var missingControls = expertBaseline.MissingControls
            .Select(item => item.Grounding.FrameworkRefs.Count > 0
                ? item
                : new MissingControl
                {
                    Id = item.Id,
                    Name = item.Name,
                    Description = item.Description,
                    Dimension = item.Dimension,
                    Grounding = expertGrounding,
                })
            .ToList();
        var recommendations = expertBaseline.Recommendations
            .Select(item => item.Grounding.FrameworkRefs.Count > 0
                ? item
                : new Recommendation
                {
                    Id = item.Id,
                    Description = item.Description,
                    Severity = item.Severity,
                    Grounding = expertGrounding,
                })
            .ToList();
        var tradeoffs = new List<Tradeoff>(tradeoffOutput.Tradeoffs);
        var maturityByDimension = expertBaseline.DimensionMaturitySuggestions
            .GroupBy(item => item.Dimension)
            .ToDictionary(group => group.Key, group => group.OrderByDescending(item => item.SuggestedMaturity).First());

        foreach (var output in specialistOutputs)
        {
            evidence.AddRange(output.Evidence);
            missingControls.AddRange(output.MissingControls);
            recommendations.AddRange(output.Recommendations);

            foreach (var suggestion in output.MaturitySuggestions)
            {
                if (!maturityByDimension.TryGetValue(suggestion.Dimension, out var current) ||
                    suggestion.SuggestedMaturity > current.SuggestedMaturity)
                {
                    maturityByDimension[suggestion.Dimension] = suggestion;
                }
            }
        }

        var dedupedControls = missingControls
            .GroupBy(item => item.Name, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToList();

        var dedupedRecommendations = recommendations
            .GroupBy(item => item.Description, StringComparer.OrdinalIgnoreCase)
            .Select(group => group
                .OrderByDescending(item => item.Severity)
                .First())
            .ToList();

        return new CombinedResult(
            evidence
                .GroupBy(item => item.Summary, StringComparer.OrdinalIgnoreCase)
                .Select(group => group.First())
                .ToList(),
            dedupedControls,
            dedupedRecommendations,
            tradeoffs.GroupBy(item => item.Summary, StringComparer.OrdinalIgnoreCase).Select(group => group.First()).ToList(),
            maturityByDimension.Values
                .OrderBy(item => item.Dimension)
                .ToList());
    }

    private static List<string> CriticReview(CombinedResult combined)
    {
        var notes = new List<string>();

        if (!combined.Evidence.Any())
        {
            notes.Add("No evidence items were produced, so a generic validation note was added.");
        }

        var controlsWithoutRecommendations = combined.MissingControls
            .Where(control => combined.Recommendations.All(recommendation =>
                !recommendation.Description.Contains(control.Name, StringComparison.OrdinalIgnoreCase) &&
                !control.Description.Contains(recommendation.Description, StringComparison.OrdinalIgnoreCase)))
            .Select(control => control.Name)
            .ToList();

        if (controlsWithoutRecommendations.Any())
        {
            notes.Add($"Some missing controls required manual recommendation coverage checks: {string.Join(", ", controlsWithoutRecommendations)}.");
        }

        if (!combined.Tradeoffs.Any())
        {
            notes.Add("At least one explicit trade-off should be present in every completed analysis.");
        }

        if (combined.Recommendations.Any(item => item.Grounding.FrameworkRefs.Count == 0 && item.Grounding.CitationRefs.Count == 0))
        {
            notes.Add("Some recommendations were missing grounding references and were downgraded for follow-up review.");
        }

        notes.Add("Final score calculation remains in the application scoring engine and was not delegated to AI.");
        return notes;
    }

    private static string BuildExecutiveSummary(
        ArchitectureDiagram diagram,
        CombinedResult combined,
        IReadOnlyCollection<ReviewFramework> frameworks,
        IReadOnlyCollection<ReviewStandard> standards)
    {
        var topControls = combined.MissingControls.Take(3).Select(item => item.Name).ToList();
        var frameworkText = string.Join(", ", frameworks);
        var summary = $"Reviewed the architecture with {frameworkText}.";
        if (standards.Count > 0)
        {
            summary += $" Additional grounding used {string.Join(", ", standards.Select(ToStandardLabel))}.";
        }

        if (topControls.Any())
        {
            summary += $" The highest-priority gaps are {string.Join(", ", topControls)}.";
        }

        if (diagram.QualityAttributeWeights.Any())
        {
            summary += $" Priority weighting favored {string.Join(", ", GetTopWeights(diagram.QualityAttributeWeights))}.";
        }

        return summary;
    }

    private static List<string> BuildOpenQuestions(ArchitectureDiagram diagram, ArchitectureFacts facts)
    {
        var questions = new List<string>();

        if (string.IsNullOrWhiteSpace(diagram.ReviewContext.ExpectedTraffic))
        {
            questions.Add("What peak traffic or concurrency targets should the architecture support?");
        }

        if (string.IsNullOrWhiteSpace(diagram.ReviewContext.DataSensitivity))
        {
            questions.Add("What data sensitivity level or PII scope applies to this system?");
        }

        if (!facts.Contains("monitor"))
        {
            questions.Add("What monitoring, alerting, and incident response tooling is expected in production?");
        }

        if (!facts.Contains("disaster recovery"))
        {
            questions.Add("What recovery objectives and backup expectations should the design meet?");
        }

        return questions.Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList();
    }

    private static AgentExecutionTrace CreateTrace(
        string agentName,
        string role,
        DateTime startedAt,
        string summary,
        IEnumerable<string> highlights,
        string? framework = null,
        bool usedFoundry = false,
        GroundingReferenceSet? grounding = null)
    {
        return new AgentExecutionTrace
        {
            AgentName = agentName,
            Role = role,
            Framework = framework,
            Status = "Completed",
            Summary = summary,
            Highlights = highlights.Where(item => !string.IsNullOrWhiteSpace(item)).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            Grounding = grounding ?? new GroundingReferenceSet(),
            UsedFoundry = usedFoundry,
            StartedAt = startedAt,
            CompletedAt = DateTime.UtcNow,
        };
    }

    private static GroundingReferenceSet BuildGrounding(
        IEnumerable<string> frameworks,
        IEnumerable<string> standards,
        IEnumerable<string> principles,
        IEnumerable<string> tradeoffs,
        IEnumerable<string> historyRefs,
        IEnumerable<string> citations)
    {
        return new GroundingReferenceSet
        {
            FrameworkRefs = frameworks.Where(item => !string.IsNullOrWhiteSpace(item)).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            StandardRefs = standards.Where(item => !string.IsNullOrWhiteSpace(item)).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            PrincipleRefs = principles.Where(item => !string.IsNullOrWhiteSpace(item)).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            TradeoffRefs = tradeoffs.Where(item => !string.IsNullOrWhiteSpace(item)).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            HistoryRefs = historyRefs.Where(item => !string.IsNullOrWhiteSpace(item)).Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList(),
            CitationRefs = citations.Where(item => !string.IsNullOrWhiteSpace(item)).Distinct(StringComparer.OrdinalIgnoreCase).Take(5).ToList(),
        };
    }

    private static IEnumerable<string> GetFrameworkCitations(FoundryIqContextBundle bundle, ReviewFramework framework)
    {
        return bundle.FrameworkGuidanceItems
            .Where(item => string.Equals(item.Framework, framework.ToString(), StringComparison.OrdinalIgnoreCase))
            .Select(item => string.IsNullOrWhiteSpace(item.SourceUri) ? item.SourceLabel : $"{item.SourceLabel} ({item.SourceUri})")
            .Take(4);
    }

    private static DimensionMaturitySuggestion CreateMaturity(
        ArchitectureDimension dimension,
        int current,
        int suggested,
        string reason)
    {
        return new DimensionMaturitySuggestion
        {
            Dimension = dimension,
            CurrentMaturity = Math.Clamp(current, 1, 5),
            SuggestedMaturity = Math.Clamp(Math.Max(current, suggested), 1, 5),
            Reason = reason,
        };
    }

    private sealed record SpecialistOutput(
        ReviewFramework Framework,
        string Summary,
        IList<string> Highlights,
        IList<EvidenceItem> Evidence,
        IList<MissingControl> MissingControls,
        IList<Recommendation> Recommendations,
        IList<DimensionMaturitySuggestion> MaturitySuggestions);

    private sealed record TradeoffOutput(
        string Summary,
        IList<string> Highlights,
        IList<Tradeoff> Tradeoffs);

    private sealed record CombinedResult(
        IList<EvidenceItem> Evidence,
        IList<MissingControl> MissingControls,
        IList<Recommendation> Recommendations,
        IList<Tradeoff> Tradeoffs,
        IList<DimensionMaturitySuggestion> DimensionMaturitySuggestions);

    private sealed class ArchitectureFacts
    {
        private readonly string _normalizedText;

        private ArchitectureFacts(string normalizedText)
        {
            _normalizedText = normalizedText;
        }

        public IList<string> Technologies { get; } = new List<string>();
        public IList<string> CloudSignals { get; } = new List<string>();
        public IList<string> PositiveSignals { get; } = new List<string>();

        public bool Contains(string fragment) => _normalizedText.Contains(fragment, StringComparison.OrdinalIgnoreCase);

        public static ArchitectureFacts Extract(ArchitectureDiagram diagram)
        {
            var parts = new[]
            {
                diagram.Description,
                diagram.ReviewContext.BusinessDomain,
                diagram.ReviewContext.TargetUsers,
                diagram.ReviewContext.ExpectedTraffic,
                diagram.ReviewContext.DataSensitivity,
                diagram.ReviewContext.CloudProviderPreference,
                diagram.ReviewContext.ComplianceNeeds,
                diagram.ReviewContext.CurrentPainPoints,
            };

            var text = string.Join(' ', parts.Where(part => !string.IsNullOrWhiteSpace(part)));
            var facts = new ArchitectureFacts(text.ToLowerInvariant());

            facts.AddSignal("react", "React frontend");
            facts.AddSignal(".net", ".NET API");
            facts.AddSignal("postgres", "PostgreSQL");
            facts.AddSignal("tidb", "TiDB");
            facts.AddSignal("blob", "Blob storage");
            facts.AddSignal("queue", "Queue-based processing");
            facts.AddSignal("cache", "Caching");
            facts.AddSignal("monitor", "Monitoring");
            facts.AddSignal("api gateway", "API gateway");
            facts.AddSignal("audit", "Audit logging");
            facts.AddSignal("tenant isolation", "Tenant isolation");
            facts.AddSignal("disaster recovery", "Disaster recovery");
            facts.AddSignal("secret", "Secrets management");
            facts.AddSignal("key vault", "Key Vault");
            facts.AddSignal("managed identity", "Managed identity");
            facts.AddCloudSignal("azure");
            facts.AddCloudSignal("aws");

            return facts;
        }

        private void AddSignal(string fragment, string label)
        {
            if (_normalizedText.Contains(fragment, StringComparison.OrdinalIgnoreCase))
            {
                Technologies.Add(label);
                PositiveSignals.Add(label);
            }
        }

        private void AddCloudSignal(string fragment)
        {
            if (_normalizedText.Contains(fragment, StringComparison.OrdinalIgnoreCase))
            {
                CloudSignals.Add(fragment.ToUpperInvariant());
            }
        }
    }

    private static string GetSpecialistName(ReviewFramework framework)
    {
        return framework switch
        {
            ReviewFramework.AzureWellArchitected => "Azure Specialist",
            ReviewFramework.AwsWellArchitected => "AWS Specialist",
            ReviewFramework.Iso25010 => "Quality Specialist",
            ReviewFramework.OwaspAsvs => "Security Specialist",
            _ => "Framework Specialist",
        };
    }

    private static string InferDetectedCloudProvider(IReadOnlyCollection<ReviewFramework> frameworks, ArchitectureFacts facts)
    {
        if (facts.CloudSignals.Contains("AZURE", StringComparer.OrdinalIgnoreCase) || frameworks.Contains(ReviewFramework.AzureWellArchitected))
        {
            return "Azure";
        }

        if (facts.CloudSignals.Contains("AWS", StringComparer.OrdinalIgnoreCase) || frameworks.Contains(ReviewFramework.AwsWellArchitected))
        {
            return "AWS";
        }

        return "Cloud-neutral";
    }

    private static double InferConfidence(IReadOnlyCollection<ReviewFramework> frameworks, ArchitectureFacts facts)
    {
        if (frameworks.Count >= 3)
        {
            return 0.9;
        }

        if (facts.CloudSignals.Count > 0)
        {
            return 0.82;
        }

        return 0.7;
    }

    private static string ToStandardLabel(ReviewStandard standard)
    {
        return ReviewStandardCatalog.ToDisplayLabel(standard);
    }

    private static string BuildRetrievalSummary(FoundryIqContextBundle bundle)
    {
        var provider = string.IsNullOrWhiteSpace(bundle.RetrievalProvider) ? "Foundry IQ" : bundle.RetrievalProvider;
        var fallbackSuffix = bundle.FallbackUsed && !string.IsNullOrWhiteSpace(bundle.FallbackReason)
            ? $" Local fallback reason: {bundle.FallbackReason}"
            : string.Empty;

        return $"Retrieved {bundle.FrameworkGuidanceItems.Count} framework and governance items, {bundle.ComplianceItems.Count} compliance items, {bundle.PrincipleItems.Count} principles, {bundle.TradeoffItems.Count} trade-offs, and {bundle.WorkspaceMemoryItems.Count} workspace signals via {provider}.{fallbackSuffix}";
    }

    private FrameworkDecision ResolveFrameworkDecision(
        ArchitectureDiagram diagram,
        IReadOnlyCollection<QualityAttributeWeight> effectiveWeights)
    {
        var existing = diagram.FrameworkSelection.SelectedFrameworks.Distinct().ToList();
        var existingStandards = diagram.FrameworkSelection.SelectedStandards.Distinct().ToList();
        var shouldExpandLegacyFrameworks =
            existing.Count == 0 ||
            (diagram.FrameworkSelection.Mode == FrameworkSelectionMode.AutoDetect &&
             diagram.FrameworkSelection.SelectionRationale.Count == 0);

        if (!shouldExpandLegacyFrameworks)
        {
            return new FrameworkDecision(
                existing,
                existingStandards,
                "stored review setup",
                diagram.FrameworkSelection.SelectionRationale.ToList());
        }

        var inferred = _frameworkSelectionService.Select(
            diagram.Description,
            diagram.ReviewContext,
            FrameworkSelectionMode.AutoDetect,
            Array.Empty<ReviewFramework>(),
            Array.Empty<ReviewStandard>(),
            effectiveWeights);

        var expanded = existing
            .Concat(inferred.SelectedFrameworks)
            .Distinct()
            .ToList();
        var expandedStandards = existingStandards
            .Concat(inferred.SelectedStandards)
            .Distinct()
            .ToList();

        if (expanded.Count == 0)
        {
            expanded.Add(ReviewFramework.Iso25010);
        }

        var source = existing.Count == 0
            ? "legacy architecture cues in the diagram description"
            : "stored review setup plus legacy architecture cues";

        return new FrameworkDecision(expanded, expandedStandards, source, inferred.SelectionRationale.ToList());
    }

    private sealed record FrameworkDecision(
        IList<ReviewFramework> SelectedFrameworks,
        IList<ReviewStandard> SelectedStandards,
        string Source,
        IList<string> SelectionRationale);
}
