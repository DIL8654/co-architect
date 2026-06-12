using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;

namespace CoArchitect.Infrastructure.Seeding;

public sealed class HackathonDemoSeeder
{
    public const string DemoDataPrefix = "[Demo]";
    public static readonly Guid LocalTenantId = Guid.Parse("00000000-0000-0000-0000-000000000101");
    public static readonly Guid LocalUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    private static readonly DateTime SeedStart = new(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);

    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IDiagramRepository _diagramRepository;
    private readonly IAgentAnalysisRunRepository _analysisRunRepository;
    private readonly IAdrRepository _adrRepository;

    public HackathonDemoSeeder(
        IWorkspaceRepository workspaceRepository,
        IDiagramRepository diagramRepository,
        IAgentAnalysisRunRepository analysisRunRepository,
        IAdrRepository adrRepository)
    {
        _workspaceRepository = workspaceRepository;
        _diagramRepository = diagramRepository;
        _analysisRunRepository = analysisRunRepository;
        _adrRepository = adrRepository;
    }

    public async Task EnsureSeededAsync(CancellationToken cancellationToken)
    {
        foreach (var scenario in Scenarios())
        {
            await SeedScenarioAsync(scenario, cancellationToken);
        }
    }

    private async Task SeedScenarioAsync(DemoScenario scenario, CancellationToken cancellationToken)
    {
        var workspace = new Workspace
        {
            Id = scenario.WorkspaceId,
            TenantId = LocalTenantId,
            Name = scenario.WorkspaceName,
            CreatedAt = scenario.CreatedAt,
            UpdatedAt = scenario.UpdatedAt,
        };
        await _workspaceRepository.UpdateAsync(workspace, cancellationToken);

        var diagram = new ArchitectureDiagram
        {
            Id = scenario.DiagramId,
            WorkspaceId = scenario.WorkspaceId,
            UploadedByUserId = LocalUserId,
            Name = scenario.DiagramName,
            OriginalFileName = scenario.FileName,
            FileUrl = scenario.FileUrl,
            Description = scenario.Description,
            ReviewContext = scenario.ReviewContext,
            FrameworkSelection = scenario.FrameworkSelection,
            QualityAttributeWeights = DefaultWeights(),
            UploadedAt = scenario.CreatedAt.AddHours(1),
        };
        await _diagramRepository.UpdateAsync(diagram, cancellationToken);

        var result = BuildAnalysisResult(scenario);
        var run = new AgentAnalysisRun
        {
            Id = scenario.AnalysisRunId,
            WorkspaceId = scenario.WorkspaceId,
            ArchitectureDiagramId = scenario.DiagramId,
            Status = AnalysisRunStatus.Completed,
            RequestedAt = scenario.CreatedAt.AddHours(2),
            StartedAt = scenario.CreatedAt.AddHours(2),
            CompletedAt = scenario.CreatedAt.AddHours(2).AddMinutes(7),
            Result = result,
        };
        await _analysisRunRepository.UpdateAsync(run, cancellationToken);

        foreach (var adrSpec in scenario.Adrs)
        {
            var adr = new Adr
            {
                Id = adrSpec.Id,
                WorkspaceId = scenario.WorkspaceId,
                ArchitectureDiagramId = scenario.DiagramId,
                Title = adrSpec.Title,
                Status = "Accepted",
                LatestVersionNumber = adrSpec.Versions.Count,
                CreatedByUserId = LocalUserId,
                CreatedAt = scenario.CreatedAt.AddDays(1),
                UpdatedAt = scenario.CreatedAt.AddDays(3),
            };
            await _adrRepository.UpdateAsync(adr, cancellationToken);

            for (var index = 0; index < adrSpec.Versions.Count; index++)
            {
                var versionSpec = adrSpec.Versions[index];
                var versionNumber = index + 1;
                var draft = BuildAdrDocument(scenario, adrSpec, versionSpec, versionNumber);
                await _adrRepository.AddVersionAsync(new AdrVersion
                {
                    Id = DeterministicVersionId(adrSpec.Id, versionNumber),
                    AdrId = adrSpec.Id,
                    VersionNumber = versionNumber,
                    Title = versionSpec.Title,
                    Status = versionNumber == adrSpec.Versions.Count ? "Accepted" : "Superseded",
                    Frameworks = scenario.FrameworkSelection.SelectedFrameworks.Select(item => item.ToString()).ToList(),
                    Draft = draft,
                    Markdown = ToMarkdown(draft),
                    Html = ToHtml(draft),
                    Summary = versionSpec.Summary,
                    CreatedByUserId = LocalUserId,
                    CreatedAt = scenario.CreatedAt.AddDays(versionNumber),
                }, cancellationToken);
            }
        }

        await _workspaceRepository.SaveChangesAsync(cancellationToken);
        await _diagramRepository.SaveChangesAsync(cancellationToken);
        await _analysisRunRepository.SaveChangesAsync(cancellationToken);
        await _adrRepository.SaveChangesAsync(cancellationToken);
    }

    private static AgentAnalysisResult BuildAnalysisResult(DemoScenario scenario)
    {
        return new AgentAnalysisResult
        {
            Id = scenario.ResultId,
            ArchitectureDiagramId = scenario.DiagramId,
            RequestedAt = scenario.CreatedAt.AddHours(2),
            CompletedAt = scenario.CreatedAt.AddHours(2).AddMinutes(7),
            ExecutiveSummary = scenario.ExecutiveSummary,
            ResolvedFrameworkSelection = scenario.FrameworkSelection,
            ResolvedQualityAttributeWeights = DefaultWeights(),
            OpenQuestions = scenario.OpenQuestions.ToList(),
            CriticNotes = scenario.CriticNotes.ToList(),
            FoundryIqContext = BuildFoundryIqContext(scenario),
            AgentTrace = BuildAgentTrace(scenario),
            Evidence = scenario.Evidence.Select((item, index) => new EvidenceItem
            {
                Id = GuidFrom($"{scenario.Key}-evidence-{index}"),
                Summary = item,
                Details = $"{item} This was grounded in the selected frameworks and the demo architecture diagram.",
                Grounding = Grounding(scenario),
            }).ToList(),
            MissingControls = scenario.Findings.Select((item, index) => new MissingControl
            {
                Id = GuidFrom($"{scenario.Key}-missing-{index}"),
                Name = item.Name,
                Description = item.Impact,
                Dimension = item.Dimension,
                Grounding = Grounding(scenario, item.Framework)
            }).ToList(),
            Recommendations = scenario.Recommendations.Select((item, index) => new Recommendation
            {
                Id = GuidFrom($"{scenario.Key}-recommendation-{index}"),
                Description = item,
                Severity = index < 2 ? SuggestionSeverity.High : SuggestionSeverity.Medium,
                Grounding = Grounding(scenario),
            }).ToList(),
            Tradeoffs = scenario.Tradeoffs.Select((item, index) => new Tradeoff
            {
                Id = GuidFrom($"{scenario.Key}-tradeoff-{index}"),
                Summary = item.Summary,
                Pros = item.Pros.ToList(),
                Cons = item.Cons.ToList(),
                Grounding = Grounding(scenario, tradeoff: item.Summary),
            }).ToList(),
            DimensionMaturitySuggestions = scenario.Maturity.Select((item, index) => new DimensionMaturitySuggestion
            {
                Id = GuidFrom($"{scenario.Key}-maturity-{index}"),
                Dimension = item.Key,
                CurrentMaturity = item.Value,
                SuggestedMaturity = Math.Min(5, item.Value + 1),
                Reason = $"Demo analysis rated {item.Key} maturity at {item.Value}/5 based on diagram evidence, findings, and Foundry IQ context.",
            }).ToList(),
        };
    }

    private static FoundryIqContextBundle BuildFoundryIqContext(DemoScenario scenario)
    {
        return new FoundryIqContextBundle
        {
            FrameworkGuidanceItems = scenario.FrameworkSelection.SelectedFrameworks.Select(framework => ContextItem(
                scenario,
                $"framework-{framework}",
                "framework-guidance",
                $"{DisplayFramework(framework)} summary",
                $"{DisplayFramework(framework)} was selected because {scenario.FrameworkSelection.SelectionRationale.FirstOrDefault() ?? "the architecture needs standards-backed review."}",
                "knowledge-base",
                $"docs/knowledge-base/{FrameworkSource(framework)}",
                framework: framework.ToString())).ToList(),
            PrincipleItems =
            [
                ContextItem(scenario, "principle-reliability", "architecture-principle", "Reliability", "Used to evaluate retry, backup, recovery, and workload isolation decisions.", "knowledge-base", "Architecture principles", principle: "Reliability"),
                ContextItem(scenario, "principle-security", "architecture-principle", "Security", "Used to evaluate uploaded content protection, isolation, auditability, and secrets management.", "knowledge-base", "Architecture principles", principle: "Security"),
                ContextItem(scenario, "principle-cost", "architecture-principle", "Cost Optimization", "Used to balance processing scale, storage lifecycle, and managed service costs.", "knowledge-base", "Architecture principles", principle: "Cost Optimization"),
            ],
            TradeoffItems = scenario.Tradeoffs.Select(item => ContextItem(
                scenario,
                $"tradeoff-{item.Summary}",
                "tradeoff-guidance",
                item.Summary,
                "Used to explain competing architecture choices and why the recommendation is balanced.",
                "knowledge-base",
                "docs/knowledge-base/architecture-tradeoff-principles.md",
                tradeoffTag: item.Summary)).ToList(),
            AdrTemplateItems =
            [
                ContextItem(scenario, "adr-template", "adr-template", "ADR template", "Used to structure context, decision, alternatives, trade-offs, consequences, risks, and history.", "knowledge-base", "docs/knowledge-base/adr-template.md")
            ],
            WorkspaceMemoryItems =
            [
                ContextItem(scenario, "workspace-memory", "workspace-memory", "Demo workspace memory", "Seeded analysis and ADR history make this workspace immediately reviewable without an Azure Foundry call.", "analysis-run", $"{scenario.DiagramName} seeded analysis", workspaceScoped: true)
            ],
            RelatedFindingItems = scenario.Findings.Take(4).Select(item => ContextItem(scenario, $"finding-{item.Name}", "related-finding", item.Name, item.Impact, "analysis-run", $"{scenario.DiagramName} finding", workspaceScoped: true)).ToList(),
            RelatedAdrHistoryItems = scenario.Adrs.Select(adr => ContextItem(scenario, $"adr-{adr.Id}", "adr-history", adr.Title, $"Latest version {adr.Versions.Count}: {adr.Versions.Last().Summary}", "adr-version", $"{adr.Title} v{adr.Versions.Count}", workspaceScoped: true, adrId: adr.Id)).ToList(),
            CitationRefs =
            [
                "Azure Well-Architected summary",
                "AWS Well-Architected summary",
                "ISO/IEC 25010 summary",
                "OWASP ASVS summary",
                "Architecture trade-off principles",
                "ADR template",
                "Synthetic architecture examples",
            ],
            WorkspaceMemory = new WorkspaceMemorySnapshot
            {
                PreviousReviewSummaries = [scenario.ExecutiveSummary],
                RecurringFindings = scenario.Findings.Take(4).Select(item => item.Name).ToList(),
                PriorRecommendations = scenario.Recommendations.Take(4).ToList(),
                RecentComments = ["Demo data is synthetic and ready for evaluator walkthrough."],
                AdrHistory = scenario.Adrs.Select(adr => $"{adr.Title}: {adr.Versions.Last().Summary}").ToList(),
                ArchitectureEvolutionSummary = $"Demo workspace memory includes one completed review, {scenario.Findings.Count} findings, and {scenario.Adrs.Count} ADRs with version history.",
            },
        };
    }

    private static IList<AgentExecutionTrace> BuildAgentTrace(DemoScenario scenario)
    {
        (string AgentName, string Role, string Summary, bool UsedFoundry, string? Framework)[] steps =
        {
            ("Intake Agent", "Normalize architecture evidence and review priorities.", "Captured scenario context, target users, sensitivity, and weighted quality attributes.", false, null),
            ("Diagram Understanding Agent", "Extract components, flows, and missing evidence from the diagram.", $"Identified {scenario.Themes[0]}, {scenario.Themes[1]}, and critical control gaps.", false, null),
            ("Framework Selection Agent", "Choose review frameworks and explain why they apply.", string.Join(" ", scenario.FrameworkSelection.SelectionRationale), false, null),
            ("Context Enrichment Agent", "Gather relevant Foundry IQ context before specialist reasoning.", "Retrieved framework summaries, ADR template, trade-off principles, and demo workspace memory.", false, null),
            ("Foundry IQ Retrieval", "Assemble grounded knowledge sources for all agents.", "Loaded Azure, AWS, ISO 25010, OWASP ASVS, trade-off, ADR, and synthetic example context.", true, null),
            ("Azure Well-Architected Agent", "Review Azure-aligned reliability, security, operations, performance, and cost.", "Highlighted managed ingress, monitoring, storage policy, and operational controls.", false, ReviewFramework.AzureWellArchitected.ToString()),
            ("AWS Well-Architected Agent", "Provide cloud comparison signals using AWS Well-Architected pillars.", "Compared queue isolation, resilience, sustainability, and storage lifecycle patterns.", false, ReviewFramework.AwsWellArchitected.ToString()),
            ("ISO 25010 Quality Agent", "Review product quality attributes and maintainability.", "Mapped findings to reliability, security, maintainability, and operational quality.", false, ReviewFramework.Iso25010.ToString()),
            ("OWASP ASVS Agent", "Review web/API security and sensitive content handling.", "Flagged upload protection, access control, auditability, and data protection requirements.", false, ReviewFramework.OwaspAsvs.ToString()),
            ("Trade-off Balancing Agent", "Compare competing options using weighted priorities.", scenario.Tradeoffs.First().Summary, false, null),
            ("Architecture Scoring Agent", "Suggest maturity levels without calculating final score.", "Provided dimension maturity suggestions; application code calculates the final score.", false, null),
            ("ADR Generation Agent", "Prepare decision records from review output.", $"Linked review findings to {scenario.Adrs.Count} ADRs with version history.", false, null),
            ("Critic / Verifier Agent", "Validate grounding, unsupported claims, and recommendation consistency.", scenario.CriticNotes.First(), false, null),
            ("Recommendation Composer Agent", "Compose the final user-facing report.", "Produced prioritized findings, recommendations, trade-offs, and ADR-ready decisions.", false, null),
        };

        return steps.Select((step, index) => new AgentExecutionTrace
        {
            AgentName = step.Item1,
            Role = step.Item2,
            Framework = step.Item5,
            Status = "Completed",
            Summary = step.Item3,
            Highlights = scenario.Recommendations.Skip(index % scenario.Recommendations.Count).Take(2).ToList(),
            Grounding = Grounding(scenario, step.Item5, step.Item1.Contains("Trade-off", StringComparison.OrdinalIgnoreCase) ? scenario.Tradeoffs.First().Summary : null),
            UsedFoundry = step.Item4,
            StartedAt = scenario.CreatedAt.AddHours(2).AddMinutes(index),
            CompletedAt = scenario.CreatedAt.AddHours(2).AddMinutes(index).AddSeconds(35),
        }).ToList();
    }

    private static GroundingReferenceSet Grounding(DemoScenario scenario, string? framework = null, string? tradeoff = null)
    {
        return new GroundingReferenceSet
        {
            FrameworkRefs = string.IsNullOrWhiteSpace(framework)
                ? scenario.FrameworkSelection.SelectedFrameworks.Select(item => item.ToString()).ToList()
                : [framework],
            PrincipleRefs = ["Security", "Reliability", "Cost Optimization", "Operational Excellence"],
            TradeoffRefs = string.IsNullOrWhiteSpace(tradeoff) ? scenario.Tradeoffs.Select(item => item.Summary).Take(2).ToList() : [tradeoff],
            HistoryRefs = scenario.Adrs.Select(item => item.Title).Take(2).ToList(),
            CitationRefs = ["Azure Well-Architected summary", "OWASP ASVS summary", "ISO/IEC 25010 summary", "Architecture trade-off principles", "ADR template"],
        };
    }

    private static FoundryIqContextItem ContextItem(
        DemoScenario scenario,
        string id,
        string category,
        string title,
        string summary,
        string sourceType,
        string sourceLabel,
        bool workspaceScoped = false,
        string? framework = null,
        string? principle = null,
        string? tradeoffTag = null,
        Guid? adrId = null)
    {
        return new FoundryIqContextItem
        {
            Id = $"{scenario.Key}:{id}".ToLowerInvariant().Replace(' ', '-'),
            Category = category,
            Title = title,
            Summary = summary,
            Content = summary,
            SourceType = sourceType,
            SourceLabel = sourceLabel,
            SourceUri = sourceLabel.StartsWith("docs/", StringComparison.OrdinalIgnoreCase) ? sourceLabel : null,
            WorkspaceScoped = workspaceScoped,
            Framework = framework,
            Principle = principle,
            TradeoffTag = tradeoffTag,
            AdrId = adrId,
            AnalysisRunId = scenario.AnalysisRunId,
        };
    }

    private static AdrDocument BuildAdrDocument(DemoScenario scenario, AdrSpec adr, AdrVersionSpec version, int versionNumber)
    {
        return new AdrDocument
        {
            Title = version.Title,
            Status = versionNumber == adr.Versions.Count ? "Accepted" : "Superseded",
            Date = scenario.CreatedAt.AddDays(versionNumber).ToString("yyyy-MM-dd"),
            Context =
            [
                scenario.Description,
                $"Generated from completed demo analysis {scenario.AnalysisRunId}.",
                $"Related findings: {string.Join(", ", scenario.Findings.Take(3).Select(item => item.Name))}.",
            ],
            Decision = [version.Decision],
            Alternatives = version.Alternatives.ToList(),
            Tradeoffs = scenario.Tradeoffs.Take(2).Select(item => $"{item.Summary}: pros {string.Join(", ", item.Pros)}; cons {string.Join(", ", item.Cons)}.").ToList(),
            Consequences = version.Consequences.ToList(),
            Risks = version.Risks.ToList(),
            Frameworks = scenario.FrameworkSelection.SelectedFrameworks.Select(item => item.ToString()).ToList(),
            History = adr.Versions.Take(versionNumber).Select((item, index) => $"v{index + 1}: {item.Summary}").ToList(),
        };
    }

    private static string ToMarkdown(AdrDocument draft)
    {
        return $"""
        # {draft.Title}

        Status: {draft.Status}
        Date: {draft.Date}

        ## Context
        {Bullets(draft.Context)}

        ## Decision
        {Bullets(draft.Decision)}

        ## Alternatives Considered
        {Bullets(draft.Alternatives)}

        ## Trade-offs
        {Bullets(draft.Tradeoffs)}

        ## Consequences
        {Bullets(draft.Consequences)}

        ## Risks
        {Bullets(draft.Risks)}

        ## Review Frameworks Used
        {Bullets(draft.Frameworks)}

        ## History
        {Bullets(draft.History)}
        """;
    }

    private static string ToHtml(AdrDocument draft)
    {
        return $"""
        <article class="adr-document">
          <h1>{Escape(draft.Title)}</h1>
          <p><strong>Status:</strong> {Escape(draft.Status)} | <strong>Date:</strong> {Escape(draft.Date)}</p>
          {HtmlSection("Context", draft.Context)}
          {HtmlSection("Decision", draft.Decision)}
          {HtmlSection("Alternatives Considered", draft.Alternatives)}
          {HtmlSection("Trade-offs", draft.Tradeoffs)}
          {HtmlSection("Consequences", draft.Consequences)}
          {HtmlSection("Risks", draft.Risks)}
          {HtmlSection("Review Frameworks Used", draft.Frameworks)}
          {HtmlSection("History", draft.History)}
        </article>
        """;
    }

    private static string HtmlSection(string title, IEnumerable<string> items) =>
        $"<section><h2>{Escape(title)}</h2><ul>{string.Join("", items.Select(item => $"<li>{Escape(item)}</li>"))}</ul></section>";

    private static string Bullets(IEnumerable<string> items) => string.Join(Environment.NewLine, items.Select(item => $"- {item}"));
    private static string Escape(string value) => value.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");

    private static Guid DeterministicVersionId(Guid adrId, int version) => GuidFrom($"{adrId}:v{version}");
    private static Guid GuidFrom(string input) => Guid.Parse(System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes(input)).Aggregate("", (current, value) => current + value.ToString("x2")).Insert(8, "-").Insert(13, "-").Insert(18, "-").Insert(23, "-"));

    private static IList<QualityAttributeWeight> DefaultWeights() =>
    [
        new() { Key = "security", Label = "Security", Weight = 25 },
        new() { Key = "availability", Label = "Availability", Weight = 20 },
        new() { Key = "scalability", Label = "Scalability", Weight = 15 },
        new() { Key = "cost", Label = "Cost", Weight = 10 },
        new() { Key = "maintainability", Label = "Maintainability", Weight = 10 },
        new() { Key = "compliance", Label = "Compliance", Weight = 10 },
        new() { Key = "deliverySpeed", Label = "Delivery Speed", Weight = 10 },
    ];

    private static string DisplayFramework(ReviewFramework framework) => framework switch
    {
        ReviewFramework.AzureWellArchitected => "Azure Well-Architected",
        ReviewFramework.AwsWellArchitected => "AWS Well-Architected",
        ReviewFramework.Iso25010 => "ISO/IEC 25010",
        ReviewFramework.OwaspAsvs => "OWASP ASVS",
        _ => framework.ToString(),
    };

    private static string FrameworkSource(ReviewFramework framework) => framework switch
    {
        ReviewFramework.AzureWellArchitected => "azure-well-architected-summary.md",
        ReviewFramework.AwsWellArchitected => "aws-well-architected-summary.md",
        ReviewFramework.Iso25010 => "iso-25010-summary.md",
        ReviewFramework.OwaspAsvs => "owasp-asvs-summary.md",
        _ => "reasoning-agent-rubric.md",
    };

    private static IReadOnlyList<DemoScenario> Scenarios() =>
    [
        VideoScenario(),
        DocumentScenario(),
        SaasScenario(),
    ];

    private static DemoScenario VideoScenario()
    {
        var workspaceId = Guid.Parse("10000000-0000-0000-0000-000000000001");
        var diagramId = Guid.Parse("10000000-0000-0000-0000-000000000101");
        return new DemoScenario(
            "video-analysis",
            workspaceId,
            diagramId,
            Guid.Parse("10000000-0000-0000-0000-000000000201"),
            Guid.Parse("10000000-0000-0000-0000-000000000301"),
            $"{DemoDataPrefix} Automated Video Analysis Platform",
            "Automate Video Analysis Architecture",
            "automate-video-analysis-architecture.png",
            "/automate-video-analysis-architecture.png",
            "A media intelligence platform that ingests uploaded videos, stores raw assets, extracts frames, runs AI-based video analysis, stores metadata, and exposes results through APIs and dashboards.",
            new ArchitectureReviewContext
            {
                BusinessDomain = "Media intelligence",
                TargetUsers = "Media operations teams, analysts, and API consumers",
                ExpectedTraffic = "Large file uploads with bursty processing workloads",
                DataSensitivity = "Uploaded videos, metadata, and derived AI insights",
                CloudProviderPreference = "Azure",
                ComplianceNeeds = "Content access control, retention, auditability, and regional resilience",
                CurrentPainPoints = "Unclear API gateway, missing queue isolation, missing retry/dead-letter policy, limited observability, unclear lifecycle policy",
            },
            FrameworkSelection("Azure media workload with APIs, uploaded content, and processing pipeline cues.", ReviewStandard.Iso27001, ReviewStandard.Soc2),
            "The video analysis platform is a promising event-driven media pipeline, but it needs stronger ingress control, workload isolation, lifecycle management, observability, and recovery controls before it is production ready.",
            ["Detected upload APIs, blob storage, queue-driven processing, AI analysis, metadata storage, and dashboard/API consumption.", "Processing large media files introduces cost, retry, lifecycle, and observability pressure."],
            [
                new FindingSpec("API gateway is missing or unclear", "External upload and result APIs need centralized ingress, throttling, authentication, and policy enforcement.", ArchitectureDimension.Security, ReviewFramework.OwaspAsvs.ToString()),
                new FindingSpec("Queue-based workload isolation needs strengthening", "Video processing should isolate ingestion from expensive AI processing and support backpressure.", ArchitectureDimension.ScalabilityPerformance, ReviewFramework.AzureWellArchitected.ToString()),
                new FindingSpec("Retry and dead-letter strategy is missing", "Failed frame extraction or AI analysis jobs need safe retry, poison message handling, and operator visibility.", ArchitectureDimension.ReliabilityAvailability, ReviewFramework.AzureWellArchitected.ToString()),
                new FindingSpec("Storage lifecycle policy is missing", "Raw videos and derived assets need retention, tiering, and deletion policies to control cost.", ArchitectureDimension.CostOptimization, ReviewFramework.AwsWellArchitected.ToString()),
                new FindingSpec("Observability across pipeline stages is incomplete", "The pipeline needs correlation IDs, distributed tracing, metrics, and alerting across upload, queue, processing, and metadata writes.", ArchitectureDimension.OperationalExcellence, ReviewFramework.Iso25010.ToString()),
                new FindingSpec("DR and backup plan for metadata is unclear", "Metadata and processing state need backup, restore, and regional recovery objectives.", ArchitectureDimension.ReliabilityAvailability, ReviewFramework.AzureWellArchitected.ToString()),
            ],
            [
                "Introduce an API gateway in front of upload and result APIs with throttling, authentication policy, and request validation.",
                "Use queue-based workload isolation with retry, dead-letter queues, and idempotent processing handlers.",
                "Add storage lifecycle policies for raw videos, extracted frames, and derived metadata.",
                "Instrument every processing stage with correlation IDs, metrics, logs, and distributed tracing.",
                "Define backup and disaster recovery objectives for metadata and processing state.",
            ],
            [
                new TradeoffSpec("Cost vs reliability for video processing", ["Queue isolation reduces overload risk", "Dead-letter handling improves operations"], ["More queues and monitoring increase platform complexity", "Retries can increase processing cost"]),
                new TradeoffSpec("Storage retention vs compliance", ["Lifecycle policies reduce long-term storage cost", "Retention classes clarify ownership"], ["Aggressive deletion can affect audit and reprocessing needs", "Tiering may increase retrieval latency"]),
                new TradeoffSpec("Managed service vs self-hosted processing", ["Managed services reduce operational burden", "Autoscaling improves burst handling"], ["Platform leverage can increase provider coupling", "Cost controls must be explicit"]),
            ],
            new Dictionary<ArchitectureDimension, int>
            {
                [ArchitectureDimension.Security] = 2,
                [ArchitectureDimension.ReliabilityAvailability] = 2,
                [ArchitectureDimension.ScalabilityPerformance] = 3,
                [ArchitectureDimension.OperationalExcellence] = 2,
                [ArchitectureDimension.DataTenantIsolation] = 3,
                [ArchitectureDimension.ComplianceGovernance] = 2,
                [ArchitectureDimension.CostOptimization] = 2,
                [ArchitectureDimension.Maintainability] = 3,
            },
            ["What are the target RPO/RTO values for metadata and processing state?", "Are uploaded videos tenant-isolated and encrypted with separate access policies?"],
            ["Recommendations are grounded in visible diagram components and synthetic demo context.", "No unsupported production compliance claims were made."],
            ["video ingestion", "blob/object storage", "queue-based processing", "AI analysis pipeline"],
            [
                new AdrSpec(Guid.Parse("10000000-0000-0000-0000-000000000401"), "Use Queue-Based Processing for Video Analysis",
                [
                    new AdrVersionSpec("Use Queue-Based Processing for Video Analysis", "Adopt queue-based asynchronous processing between upload and AI analysis.", "Queue-based processing separates upload latency from expensive video analysis.", ["Run processing synchronously after upload", "Use scheduled batch processing only"], ["Improves scalability and resilience", "Requires idempotent workers and queue monitoring"], ["Queue depth and processing lag must be monitored."]),
                    new AdrVersionSpec("Use Queue-Based Processing With Retry and Dead-Letter Handling", "Add retry policies and dead-letter queues for failed video analysis jobs.", "Dead-letter handling prevents failed media jobs from silently blocking the pipeline.", ["Manual retry only", "Drop failed jobs after timeout"], ["Improves recoverability and operator visibility", "Requires failure triage workflow"], ["Retries may increase cost for large media files."]),
                    new AdrVersionSpec("Use Queue-Based Processing With Observability and Cost Controls", "Add distributed tracing, cost limits, and workload metrics across processing stages.", "Pipeline operations need correlation IDs, cost visibility, and alerting.", ["Add logging only", "Rely on cloud provider billing dashboards"], ["Improves production readiness and cost governance", "Adds telemetry implementation work"], ["Telemetry volume must be controlled."]),
                ]),
                new AdrSpec(Guid.Parse("10000000-0000-0000-0000-000000000402"), "Store Raw Videos in Blob/Object Storage With Lifecycle Policies",
                [
                    new AdrVersionSpec("Store Raw Videos in Blob/Object Storage", "Store uploaded raw videos in durable object storage.", "Object storage is the right fit for large media files and processing fan-out.", ["Store videos in relational database", "Keep videos only on processing nodes"], ["Improves durability and processing decoupling", "Requires access control design"], ["Misconfigured access policies can expose sensitive media."]),
                    new AdrVersionSpec("Add Lifecycle Retention Policy for Raw Videos", "Apply retention and tiering policies to raw videos and extracted frames.", "Lifecycle policy controls cost and retention obligations.", ["Keep all media indefinitely", "Delete immediately after processing"], ["Reduces long-term cost", "Clarifies retention posture"], ["Retention policy must align with customer contracts."]),
                    new AdrVersionSpec("Add Access Control and Encryption Notes", "Require private access, encryption, and least-privilege access to video storage.", "Uploaded media requires strong data protection controls.", ["Shared container access", "Application-managed encryption only"], ["Improves security posture", "Supports compliance evidence"], ["Key and SAS rotation must be operationalized."]),
                ]),
            ],
            SeedStart);
    }

    private static DemoScenario DocumentScenario()
    {
        var workspaceId = Guid.Parse("20000000-0000-0000-0000-000000000001");
        var diagramId = Guid.Parse("20000000-0000-0000-0000-000000000101");
        return new DemoScenario(
            "document-processing",
            workspaceId,
            diagramId,
            Guid.Parse("20000000-0000-0000-0000-000000000201"),
            Guid.Parse("20000000-0000-0000-0000-000000000301"),
            $"{DemoDataPrefix} Custom Document Processing Platform",
            "Custom Document Processing Architecture",
            "custom-document-processing-architecture.png",
            "/custom-document-processing-architecture.png",
            "A document intelligence platform that accepts uploaded documents, classifies them, extracts structured fields, performs custom processing, stores extracted data, and exposes review workflows for business users.",
            new ArchitectureReviewContext
            {
                BusinessDomain = "Document intelligence",
                TargetUsers = "Business users, reviewers, and integration consumers",
                ExpectedTraffic = "Steady uploads with periodic batch bursts",
                DataSensitivity = "PII, customer documents, extracted structured fields",
                CloudProviderPreference = "Azure",
                ComplianceNeeds = "PII protection, retention, audit logging, model validation, reviewer traceability",
                CurrentPainPoints = "Unclear classification boundary, missing PII controls, weak audit logging, unclear tenant isolation and reprocessing strategy",
            },
            FrameworkSelection("Document upload, sensitive extraction, human review, and external users require security and quality review.", ReviewStandard.Iso27001, ReviewStandard.Gdpr, ReviewStandard.Soc2),
            "The document processing platform has a strong AI workflow, but it needs clearer classification boundaries, PII controls, auditability, tenant isolation, model validation, and reprocessing behavior to become enterprise ready.",
            ["Detected upload, classification, extraction, custom processing, storage, review workflow, and integration APIs.", "Sensitive documents and model outputs require validation, auditability, and retention controls."],
            [
                new FindingSpec("Document classification boundaries are unclear", "The architecture should separate intake, classification, extraction, and review trust boundaries.", ArchitectureDimension.Security, ReviewFramework.OwaspAsvs.ToString()),
                new FindingSpec("PII and data protection controls are incomplete", "Uploaded documents and extracted fields need encryption, redaction, access policy, and retention controls.", ArchitectureDimension.ComplianceGovernance, ReviewFramework.OwaspAsvs.ToString()),
                new FindingSpec("Audit logging is missing", "Reviewer actions, model output changes, and export events need immutable audit records.", ArchitectureDimension.OperationalExcellence, ReviewFramework.Iso25010.ToString()),
                new FindingSpec("Human review traceability needs strengthening", "Low-confidence extraction results need reviewer assignment, decision history, and accountability.", ArchitectureDimension.Maintainability, ReviewFramework.Iso25010.ToString()),
                new FindingSpec("Tenant isolation strategy is missing", "Document stores, extracted fields, and review queues should enforce tenant boundaries.", ArchitectureDimension.DataTenantIsolation, ReviewFramework.AzureWellArchitected.ToString()),
                new FindingSpec("Error handling and reprocessing strategy is unclear", "Failed classification or extraction jobs need retry, dead-letter handling, and controlled reprocessing.", ArchitectureDimension.ReliabilityAvailability, ReviewFramework.AzureWellArchitected.ToString()),
            ],
            [
                "Define explicit trust boundaries for document upload, classification, extraction, review, and export.",
                "Add PII protection, retention, deletion, and least-privilege access controls for documents and extracted fields.",
                "Introduce reviewer workflow traceability with confidence thresholds and audit logging.",
                "Add tenant isolation controls across storage, queueing, extracted data, and APIs.",
                "Create a reprocessing strategy for failed or corrected extraction outputs.",
            ],
            [
                new TradeoffSpec("Automation speed vs human accountability", ["Automated extraction reduces manual work", "Human review improves accuracy for low-confidence outputs"], ["Review queues add operational workflow", "Manual review can increase latency"]),
                new TradeoffSpec("Retention evidence vs privacy minimization", ["Retention supports audit and dispute resolution", "Deletion workflows reduce privacy exposure"], ["Short retention can limit reprocessing", "Long retention increases compliance risk"]),
                new TradeoffSpec("Security vs usability in review workflows", ["Strong access policies protect sensitive documents", "Traceability supports compliance"], ["More controls can slow reviewer productivity", "Role design must stay understandable"]),
            ],
            new Dictionary<ArchitectureDimension, int>
            {
                [ArchitectureDimension.Security] = 2,
                [ArchitectureDimension.ReliabilityAvailability] = 3,
                [ArchitectureDimension.ScalabilityPerformance] = 3,
                [ArchitectureDimension.OperationalExcellence] = 2,
                [ArchitectureDimension.DataTenantIsolation] = 1,
                [ArchitectureDimension.ComplianceGovernance] = 2,
                [ArchitectureDimension.CostOptimization] = 3,
                [ArchitectureDimension.Maintainability] = 3,
            },
            ["Which document types contain regulated data?", "What confidence threshold should trigger human review?"],
            ["PII and audit recommendations were grounded in OWASP ASVS and ISO 25010 context.", "The critic found no unsupported claims beyond the provided synthetic architecture evidence."],
            ["document upload", "document processing pipeline", "human review", "structured data store"],
            [
                new AdrSpec(Guid.Parse("20000000-0000-0000-0000-000000000401"), "Add Human Review for Low-Confidence Document Extraction",
                [
                    new AdrVersionSpec("Add Human Review for Low-Confidence Document Extraction", "Route low-confidence extraction results to human reviewers.", "Human review improves quality where model confidence is insufficient.", ["Accept all model output automatically", "Reject low-confidence documents"], ["Improves extraction correctness", "Adds review workflow operations"], ["Reviewer backlog can become a bottleneck."]),
                    new AdrVersionSpec("Add Confidence Thresholds for Review Routing", "Define confidence thresholds for automatic approval, review, and rejection.", "Thresholds make model output handling explainable and auditable.", ["Manual review for all documents", "Single global threshold only"], ["Improves consistency", "Supports operations metrics"], ["Threshold tuning requires monitoring."]),
                    new AdrVersionSpec("Add Audit Trail and Reviewer Accountability", "Record reviewer decisions, edits, timestamps, and rationale.", "Audit trail supports compliance and model quality feedback.", ["Keep only latest extracted values", "Store reviewer comments outside the product"], ["Improves accountability", "Creates training feedback data"], ["Audit records must be protected and retained appropriately."]),
                ]),
                new AdrSpec(Guid.Parse("20000000-0000-0000-0000-000000000402"), "Apply PII Protection and Retention Controls to Uploaded Documents",
                [
                    new AdrVersionSpec("Apply Basic PII Protection", "Encrypt documents and restrict access to reviewers and service principals.", "Documents contain sensitive information and require default protection.", ["Rely on storage account defaults only", "Process all documents in a shared open store"], ["Improves confidentiality", "Creates a baseline for compliance"], ["Access policies must be reviewed regularly."]),
                    new AdrVersionSpec("Add Retention and Deletion Workflow", "Define retention periods and support deletion of uploaded documents and extracted fields.", "Privacy obligations require lifecycle governance.", ["Retain all documents indefinitely", "Delete source documents immediately"], ["Reduces privacy exposure", "Improves lifecycle clarity"], ["Deletion must preserve required audit evidence."]),
                    new AdrVersionSpec("Add Compliance and Audit Notes", "Link PII controls to audit logging, reviewer actions, and export events.", "Compliance evidence should connect data controls with workflow traceability.", ["Separate privacy controls from review workflow", "Document policy outside the product only"], ["Improves audit readiness", "Clarifies accountability"], ["Audit storage needs its own retention and access policy."]),
                ]),
            ],
            SeedStart.AddDays(1));
    }

    private static DemoScenario SaasScenario()
    {
        var workspaceId = Guid.Parse("30000000-0000-0000-0000-000000000001");
        var diagramId = Guid.Parse("30000000-0000-0000-0000-000000000101");
        return new DemoScenario(
            "enterprise-saas",
            workspaceId,
            diagramId,
            Guid.Parse("30000000-0000-0000-0000-000000000201"),
            Guid.Parse("30000000-0000-0000-0000-000000000301"),
            $"{DemoDataPrefix} Enterprise SaaS Platform Baseline",
            "Enterprise SaaS Platform Baseline",
            "architecture-description.txt",
            null,
            "A B2B SaaS platform with React frontend, .NET backend APIs, PostgreSQL/TiDB database, blob storage, background jobs, and enterprise customers in Europe. It currently has no API gateway, no tenant isolation strategy, no audit logging, no disaster recovery plan, limited monitoring, and unclear secrets management.",
            new ArchitectureReviewContext
            {
                BusinessDomain = "B2B SaaS",
                TargetUsers = "Enterprise customers in Europe",
                ExpectedTraffic = "Moderate traffic with enterprise onboarding spikes",
                DataSensitivity = "PII and tenant business data",
                CloudProviderPreference = "Cloud-neutral",
                ComplianceNeeds = "GDPR, auditability, tenant isolation, disaster recovery",
                CurrentPainPoints = "No API gateway, no tenant isolation, no audit logging, no disaster recovery plan, limited monitoring, unclear secrets management",
            },
            FrameworkSelection("Cloud-neutral SaaS with APIs, PII, external users, and multi-tenancy concerns requires broad framework coverage.", ReviewStandard.Iso27001, ReviewStandard.Gdpr, ReviewStandard.Togaf),
            "The baseline SaaS architecture demonstrates the core product value loop: it has enough application structure to review, while missing several enterprise readiness capabilities around isolation, auditability, observability, recovery, and secrets management.",
            ["Detected React frontend, .NET APIs, relational database, blob storage, background jobs, external enterprise users, and European data sensitivity.", "The absence of tenant isolation, audit logging, DR, monitoring, and secrets controls creates clear maturity gaps."],
            [
                new FindingSpec("Tenant isolation strategy is missing", "Data access, storage paths, and background processing need tenant-aware controls.", ArchitectureDimension.DataTenantIsolation, ReviewFramework.OwaspAsvs.ToString()),
                new FindingSpec("Observability is missing", "APIs and jobs need metrics, logs, tracing, alerting, and operational dashboards.", ArchitectureDimension.OperationalExcellence, ReviewFramework.Iso25010.ToString()),
                new FindingSpec("API gateway is missing", "External API traffic needs centralized ingress, throttling, authentication, and policy enforcement.", ArchitectureDimension.Security, ReviewFramework.AzureWellArchitected.ToString()),
                new FindingSpec("Audit logging is missing", "Administrative and tenant-impacting actions need immutable audit logs.", ArchitectureDimension.ComplianceGovernance, ReviewFramework.OwaspAsvs.ToString()),
                new FindingSpec("Disaster recovery plan is missing", "Database, blob storage, and job state need backup, restore, and RTO/RPO targets.", ArchitectureDimension.ReliabilityAvailability, ReviewFramework.AzureWellArchitected.ToString()),
                new FindingSpec("Secrets management is unclear", "API keys and connection strings should move to managed secrets with rotation.", ArchitectureDimension.Security, ReviewFramework.AzureWellArchitected.ToString()),
            ],
            [
                "Define tenant isolation at data, API, storage, and background-job boundaries.",
                "Add API gateway controls for ingress, throttling, authentication policy, and request validation.",
                "Implement audit logging for administrative and tenant-impacting actions.",
                "Create disaster recovery objectives and validate restore procedures.",
                "Move secrets to managed secrets storage with rotation and least-privilege access.",
            ],
            [
                new TradeoffSpec("Speed of delivery vs governance", ["Core product can ship faster", "Governance can focus on highest-risk controls first"], ["Delayed controls become expensive later", "Enterprise buyers expect audit and isolation evidence"]),
                new TradeoffSpec("Security vs usability", ["Centralized ingress and secrets controls reduce risk", "Clear policies help operators"], ["More controls can add setup friction", "Access design must be simple for teams"]),
            ],
            new Dictionary<ArchitectureDimension, int>
            {
                [ArchitectureDimension.Security] = 2,
                [ArchitectureDimension.ReliabilityAvailability] = 2,
                [ArchitectureDimension.ScalabilityPerformance] = 3,
                [ArchitectureDimension.OperationalExcellence] = 1,
                [ArchitectureDimension.DataTenantIsolation] = 1,
                [ArchitectureDimension.ComplianceGovernance] = 2,
                [ArchitectureDimension.CostOptimization] = 3,
                [ArchitectureDimension.Maintainability] = 3,
            },
            ["Which tenant isolation model is expected by enterprise customers?", "What are the initial RTO/RPO objectives?"],
            ["This synthetic baseline intentionally includes common enterprise-readiness gaps.", "The scoring service, not the AI provider, calculates the final Architecture Intelligence Score."],
            ["React frontend", ".NET APIs", "TiDB database", "background jobs"],
            [
                new AdrSpec(Guid.Parse("30000000-0000-0000-0000-000000000401"), "Adopt Tenant-Aware Data and API Boundaries",
                [
                    new AdrVersionSpec("Adopt Tenant-Aware Data Boundaries", "Introduce tenant identifiers across application data and storage paths.", "Tenant-aware records create the minimum boundary needed for enterprise SaaS readiness.", ["Keep shared tables without tenant metadata", "Create one database per customer immediately"], ["Creates a clear isolation foundation", "Keeps the MVP operationally simple"], ["Query filters and migrations must be tested carefully."]),
                    new AdrVersionSpec("Extend Tenant Boundaries to APIs and Jobs", "Propagate tenant context through API handlers, background jobs, and storage operations.", "Tenant safety must cover asynchronous processing, not only request-time queries.", ["Scope only HTTP requests", "Defer background job isolation"], ["Reduces cross-tenant processing risk", "Improves auditability"], ["Job retries must preserve tenant context."]),
                    new AdrVersionSpec("Add Isolation Evidence and Audit Notes", "Document tenant isolation behavior and connect it to audit logging and review evidence.", "Enterprise buyers need explainable isolation and audit evidence.", ["Leave isolation implicit in code", "Document only after production launch"], ["Improves governance readiness", "Supports future security reviews"], ["Evidence must stay current as schema evolves."]),
                ]),
                new AdrSpec(Guid.Parse("30000000-0000-0000-0000-000000000402"), "Introduce Managed Secrets and Disaster Recovery Baseline",
                [
                    new AdrVersionSpec("Introduce Managed Secrets", "Move connection strings and API keys to managed secrets storage with least-privilege access.", "Managed secrets reduce accidental exposure and support rotation.", ["Keep secrets in local configuration only", "Store secrets directly in database records"], ["Improves security posture", "Prepares for production deployment"], ["Secret rotation needs operational ownership."]),
                    new AdrVersionSpec("Define Disaster Recovery Baseline", "Set initial RTO/RPO targets and validate database and blob restore procedures.", "DR objectives make reliability expectations measurable.", ["Rely only on provider durability", "Wait for customer escalation before DR planning"], ["Improves recovery confidence", "Clarifies backup scope"], ["Restore drills require scheduled effort."]),
                    new AdrVersionSpec("Connect Secrets, DR, and Observability", "Add monitoring for secret access, backup health, restore readiness, and failure signals.", "Operational controls must show whether the platform can recover safely.", ["Monitor only uptime", "Keep DR checks manual"], ["Improves production safety", "Creates demoable operational evidence"], ["More alerts require tuning."]),
                ]),
            ],
            SeedStart.AddDays(2));
    }

    private static FrameworkSelectionResult FrameworkSelection(string rationale, params ReviewStandard[] standards)
    {
        return new FrameworkSelectionResult
        {
            Mode = FrameworkSelectionMode.AutoDetect,
            DetectedCloudProvider = "Azure",
            ConfidenceScore = 0.92,
            RequestedFrameworks = [],
            SelectedFrameworks = [ReviewFramework.AzureWellArchitected, ReviewFramework.AwsWellArchitected, ReviewFramework.Iso25010, ReviewFramework.OwaspAsvs],
            RequestedStandards = [],
            SelectedStandards = standards.ToList(),
            SelectionRationale =
            [
                rationale,
                "OWASP ASVS applies because the scenario exposes APIs and handles sensitive uploaded content.",
                "ISO/IEC 25010 applies because the review needs reliability, maintainability, security, and quality attribute reasoning.",
            ],
        };
    }

    private sealed record DemoScenario(
        string Key,
        Guid WorkspaceId,
        Guid DiagramId,
        Guid AnalysisRunId,
        Guid ResultId,
        string WorkspaceName,
        string DiagramName,
        string FileName,
        string? FileUrl,
        string Description,
        ArchitectureReviewContext ReviewContext,
        FrameworkSelectionResult FrameworkSelection,
        string ExecutiveSummary,
        IReadOnlyList<string> Evidence,
        IReadOnlyList<FindingSpec> Findings,
        IReadOnlyList<string> Recommendations,
        IReadOnlyList<TradeoffSpec> Tradeoffs,
        IReadOnlyDictionary<ArchitectureDimension, int> Maturity,
        IReadOnlyList<string> OpenQuestions,
        IReadOnlyList<string> CriticNotes,
        IReadOnlyList<string> Themes,
        IReadOnlyList<AdrSpec> Adrs,
        DateTime CreatedAt)
    {
        public DateTime UpdatedAt => CreatedAt.AddDays(4);
    }

    private sealed record FindingSpec(string Name, string Impact, ArchitectureDimension Dimension, string Framework);
    private sealed record TradeoffSpec(string Summary, IReadOnlyList<string> Pros, IReadOnlyList<string> Cons);
    private sealed record AdrSpec(Guid Id, string Title, IReadOnlyList<AdrVersionSpec> Versions);
    private sealed record AdrVersionSpec(string Title, string Decision, string Summary, IReadOnlyList<string> Alternatives, IReadOnlyList<string> Consequences, IReadOnlyList<string> Risks);
}
