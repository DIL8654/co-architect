using System.Text.Json;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Settings;

namespace CoArchitect.Infrastructure.Services;

public sealed class AzureFoundryArchitectureAgentService : IArchitectureAgentService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly AzureFoundryInvocationService _invocationService;
    private readonly AzureFoundryAgentExperimentOptions _experimentOptions;

    public AzureFoundryArchitectureAgentService(
        AzureFoundryInvocationService invocationService,
        AzureFoundryAgentExperimentOptions experimentOptions)
    {
        _invocationService = invocationService ?? throw new ArgumentNullException(nameof(invocationService));
        _experimentOptions = experimentOptions ?? throw new ArgumentNullException(nameof(experimentOptions));
    }

    public async Task<AgentAnalysisResult> AnalyzeAsync(Guid architectureDiagramId, string diagramContent, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (_experimentOptions.UseHybridPromptAgents)
        {
            var multiAgentResult = await TryAnalyzeWithPromptAgentsAsync(architectureDiagramId, diagramContent, cancellationToken);
            if (multiAgentResult is not null)
            {
                return multiAgentResult;
            }
        }

        return await AnalyzeWithSingleExpertAsync(architectureDiagramId, diagramContent, cancellationToken);
    }

    private async Task<AgentAnalysisResult> AnalyzeWithSingleExpertAsync(Guid architectureDiagramId, string diagramContent, CancellationToken cancellationToken)
    {
        var effectiveOptions = await _invocationService.GetEffectiveOptionsAsync(cancellationToken);
        if (!effectiveOptions.IsConfigured)
        {
            return CreateFallbackResult(architectureDiagramId, diagramContent, "Azure AI Foundry configuration is incomplete.");
        }

        var invocation = await _invocationService.InvokeAsync(BuildPrompt(diagramContent), effectiveOptions.AgentId!, cancellationToken);
        if (!invocation.Succeeded || string.IsNullOrWhiteSpace(invocation.OutputText))
        {
            return CreateFallbackResult(
                architectureDiagramId,
                diagramContent,
                invocation.FailureReason ?? "Azure Foundry returned no text output.");
        }

        try
        {
            return ParseStructuredResult(invocation.OutputText, architectureDiagramId)
                ?? CreateFallbackResult(architectureDiagramId, diagramContent, "Azure Foundry output could not be parsed as structured JSON.");
        }
        catch (JsonException ex)
        {
            return CreateFallbackResult(architectureDiagramId, diagramContent, $"Azure Foundry output could not be parsed as structured JSON. {ex.Message}");
        }
    }

    private async Task<AgentAnalysisResult?> TryAnalyzeWithPromptAgentsAsync(Guid architectureDiagramId, string diagramContent, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_experimentOptions.PlannerAgentId) ||
            string.IsNullOrWhiteSpace(_experimentOptions.ReviewerAgentId) ||
            string.IsNullOrWhiteSpace(_experimentOptions.CriticComposerAgentId))
        {
            return null;
        }

        var traces = new List<AgentExecutionTrace>();
        try
        {
            var plannerStartedAt = DateTime.UtcNow;
            var plannerResponse = await _invocationService.InvokeAsync(
                BuildPlannerPrompt(diagramContent),
                _experimentOptions.PlannerAgentId!,
                cancellationToken);

            if (!plannerResponse.Succeeded || string.IsNullOrWhiteSpace(plannerResponse.OutputText))
            {
                return null;
            }

            var plannerText = plannerResponse.OutputText.Trim();
            traces.Add(CreateFoundryTrace(
                "Foundry Intake and Context Planner",
                "Managed Foundry prompt agent that extracts architecture cues and review focus areas.",
                plannerStartedAt,
                "Prepared architecture cues, risk focus, and suggested review emphasis before the main standards review.",
                plannerText));

            var reviewerStartedAt = DateTime.UtcNow;
            var reviewerResponse = await _invocationService.InvokeAsync(
                BuildReviewerPrompt(diagramContent, plannerText),
                _experimentOptions.ReviewerAgentId!,
                cancellationToken);

            if (!reviewerResponse.Succeeded || string.IsNullOrWhiteSpace(reviewerResponse.OutputText))
            {
                return null;
            }

            var reviewerText = reviewerResponse.OutputText.Trim();
            traces.Add(CreateFoundryTrace(
                "Foundry Standards and Framework Reviewer",
                "Managed Foundry prompt agent that runs the structured standards review.",
                reviewerStartedAt,
                "Generated the first structured grounded review across frameworks and selected standards.",
                reviewerText));

            var criticStartedAt = DateTime.UtcNow;
            var criticResponse = await _invocationService.InvokeAsync(
                BuildCriticPrompt(diagramContent, plannerText, reviewerText),
                _experimentOptions.CriticComposerAgentId!,
                cancellationToken);

            var finalText = criticResponse.Succeeded && !string.IsNullOrWhiteSpace(criticResponse.OutputText)
                ? criticResponse.OutputText.Trim()
                : reviewerText;

            traces.Add(CreateFoundryTrace(
                "Foundry Critic and ADR Composer",
                "Managed Foundry prompt agent that validates the review and sharpens decision-oriented output.",
                criticStartedAt,
                criticResponse.Succeeded
                    ? "Validated the structured review and returned a polished final result."
                    : "Critic step was unavailable, so the review fell back to the standards reviewer output.",
                finalText));

            var parsed = ParseStructuredResult(finalText, architectureDiagramId);
            if (parsed is null)
            {
                return null;
            }

            return parsed.WithTrace(traces);
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static string BuildPrompt(string diagramContent)
    {
        var content = string.IsNullOrWhiteSpace(diagramContent)
            ? "No architecture text was provided. Analyze based on the uploaded diagram metadata and state assumptions clearly."
            : diagramContent;

        return $$"""
        You are CoArchitect AI, an architecture review agent.

        Analyze this architecture as an enterprise architecture review and return only valid JSON with this shape:
        {
          "evidence": [{"summary": "...", "details": "..."}],
          "missingControls": [{"name": "...", "description": "...", "dimension": "Security"}],
          "recommendations": [{"description": "...", "severity": "High"}],
          "tradeoffs": [{"summary": "...", "pros": ["..."], "cons": ["..."]}],
          "dimensionMaturitySuggestions": [{"dimension": "Security", "currentMaturity": 2, "suggestedMaturity": 4, "reason": "..."}]
        }

        Allowed dimensions:
        Security, ReliabilityAvailability, ScalabilityPerformance, OperationalExcellence,
        DataTenantIsolation, ComplianceGovernance, CostOptimization, Maintainability.

        Allowed severities:
        Critical, High, Medium, Low.

        Architecture:
        {{content}}
        """;
    }

    private static string BuildPlannerPrompt(string diagramContent)
    {
        return $$"""
        You are CoArchitect AI's intake and context planner.

        Read the architecture review request below and return a short plain-text planning brief with:
        - key architecture cues
        - likely risk areas
        - likely frameworks and standards to emphasize
        - any missing evidence that should be called out

        Keep it concise and decision-oriented.

        Architecture review request:
        {{diagramContent}}
        """;
    }

    private static string BuildReviewerPrompt(string diagramContent, string plannerNotes)
    {
        return $$"""
        You are CoArchitect AI's standards and framework reviewer.

        Use these planner notes:
        {{plannerNotes}}

        Analyze the architecture and return only valid JSON with this shape:
        {
          "evidence": [{"summary": "...", "details": "..."}],
          "missingControls": [{"name": "...", "description": "...", "dimension": "Security"}],
          "recommendations": [{"description": "...", "severity": "High"}],
          "tradeoffs": [{"summary": "...", "pros": ["..."], "cons": ["..."]}],
          "dimensionMaturitySuggestions": [{"dimension": "Security", "currentMaturity": 2, "suggestedMaturity": 4, "reason": "..."}]
        }

        Architecture:
        {{diagramContent}}
        """;
    }

    private static string BuildCriticPrompt(string diagramContent, string plannerNotes, string reviewerJson)
    {
        return $$"""
        You are CoArchitect AI's critic and ADR composer.

        Review the planner notes and structured review below. Correct weak or unsupported recommendations, keep the response grounded in the architecture evidence, and return only valid JSON in the same schema.

        Planner notes:
        {{plannerNotes}}

        Current review JSON:
        {{reviewerJson}}

        Architecture:
        {{diagramContent}}
        """;
    }

    private static AgentExecutionTrace CreateFoundryTrace(string agentName, string role, DateTime startedAt, string summary, string rawOutput)
    {
        return new AgentExecutionTrace
        {
            AgentName = agentName,
            Role = role,
            Status = "Completed",
            Summary = summary,
            Highlights = rawOutput
                .ReplaceLineEndings("\n")
                .Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Take(4)
                .ToList(),
            UsedFoundry = true,
            StartedAt = startedAt,
            CompletedAt = DateTime.UtcNow,
        };
    }

    private static AgentAnalysisResult? ParseStructuredResult(string outputText, Guid diagramId)
    {
        var json = AzureFoundryInvocationService.ExtractJsonPayload(outputText);
        var parsed = JsonSerializer.Deserialize<FoundryStructuredResult>(json, JsonOptions);
        return parsed?.ToAgentAnalysisResult(diagramId);
    }

    private static AgentAnalysisResult CreateFallbackResult(Guid architectureDiagramId, string diagramContent, string reason)
    {
        var lower = diagramContent.ToLowerInvariant();
        var missing = new List<MissingControl>();

        AddIfMissing(lower, missing, "api gateway", "API Gateway", "Add a managed API gateway for routing, throttling, versioning, and policy enforcement.", ArchitectureDimension.Security);
        AddIfMissing(lower, missing, "monitor", "Monitoring", "Add observability with logs, metrics, traces, dashboards, and alerts.", ArchitectureDimension.OperationalExcellence);
        AddIfMissing(lower, missing, "tenant isolation", "Tenant Isolation", "Define tenant boundaries in identity, data access, storage, and operational workflows.", ArchitectureDimension.DataTenantIsolation);
        AddIfMissing(lower, missing, "audit", "Audit Logging", "Capture audit trails for security-relevant and tenant-relevant actions.", ArchitectureDimension.ComplianceGovernance);
        AddIfMissing(lower, missing, "disaster recovery", "Disaster Recovery", "Define RPO/RTO, backup restore testing, and regional recovery procedures.", ArchitectureDimension.ReliabilityAvailability);
        AddIfMissing(lower, missing, "secret", "Secrets Management", "Use a managed vault and managed identity for secrets and connection strings.", ArchitectureDimension.Security);

        if (missing.Count == 0)
        {
            missing.Add(new MissingControl
            {
                Name = "Architecture Evidence",
                Description = "Add explicit evidence for security, operations, resilience, tenant isolation, and cost controls.",
                Dimension = ArchitectureDimension.OperationalExcellence
            });
        }

        var recommendations = missing
            .Select(control => new Recommendation
            {
                Description = control.Description,
                Severity = control.Dimension is ArchitectureDimension.Security or ArchitectureDimension.ReliabilityAvailability
                    ? SuggestionSeverity.High
                    : SuggestionSeverity.Medium
            })
            .ToList();

        return new AgentAnalysisResult
        {
            ArchitectureDiagramId = architectureDiagramId,
            RequestedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
            Evidence =
            {
                new EvidenceItem
                {
                    Summary = "Architecture analysis completed with local fallback.",
                    Details = reason
                }
            },
            MissingControls = missing,
            Recommendations = recommendations,
            Tradeoffs =
            {
                new Tradeoff
                {
                    Summary = "Managed Azure services reduce delivery risk but require explicit cost and access governance.",
                    Pros = { "Faster delivery", "Less infrastructure to operate", "Clear path to production hardening" },
                    Cons = { "Cloud cost must be monitored", "SAS URLs should be replaced with identity-based access later" }
                }
            },
            DimensionMaturitySuggestions =
            {
                CreateMaturity(ArchitectureDimension.Security, lower.Contains("secret") ? 3 : 2, 4, "Strengthen identity, secrets, ingress controls, and auditability."),
                CreateMaturity(ArchitectureDimension.ReliabilityAvailability, lower.Contains("disaster recovery") ? 3 : 2, 4, "Define backup, restore, failover, and recovery objectives."),
                CreateMaturity(ArchitectureDimension.OperationalExcellence, lower.Contains("monitor") ? 3 : 2, 4, "Add monitoring, alerting, and operational runbooks."),
                CreateMaturity(ArchitectureDimension.DataTenantIsolation, lower.Contains("tenant isolation") ? 3 : 2, 4, "Make tenant boundaries explicit in data and authorization flows."),
                CreateMaturity(ArchitectureDimension.CostOptimization, 3, 4, "Add budgets, alerts, and right-sized resources for the workload.")
            }
        };
    }

    private static void AddIfMissing(string content, IList<MissingControl> controls, string probe, string name, string description, ArchitectureDimension dimension)
    {
        var isMissing =
            !content.Contains(probe, StringComparison.OrdinalIgnoreCase) ||
            content.Contains($"no {probe}", StringComparison.OrdinalIgnoreCase) ||
            content.Contains($"without {probe}", StringComparison.OrdinalIgnoreCase) ||
            content.Contains($"lacks {probe}", StringComparison.OrdinalIgnoreCase) ||
            content.Contains($"missing {probe}", StringComparison.OrdinalIgnoreCase);

        if (isMissing)
        {
            controls.Add(new MissingControl
            {
                Name = name,
                Description = description,
                Dimension = dimension
            });
        }
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
            CurrentMaturity = current,
            SuggestedMaturity = suggested,
            Reason = reason
        };
    }

    private sealed class FoundryStructuredResult
    {
        public List<FoundryEvidence> Evidence { get; init; } = new();
        public List<FoundryMissingControl> MissingControls { get; init; } = new();
        public List<FoundryRecommendation> Recommendations { get; init; } = new();
        public List<FoundryTradeoff> Tradeoffs { get; init; } = new();
        public List<FoundryMaturitySuggestion> DimensionMaturitySuggestions { get; init; } = new();

        public AgentAnalysisResult ToAgentAnalysisResult(Guid diagramId)
        {
            return new AgentAnalysisResult
            {
                ArchitectureDiagramId = diagramId,
                RequestedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
                Evidence = Evidence.Select(item => new EvidenceItem
                {
                    Summary = item.Summary,
                    Details = item.Details
                }).ToList(),
                MissingControls = MissingControls.Select(item => new MissingControl
                {
                    Name = item.Name,
                    Description = item.Description,
                    Dimension = ParseEnum(item.Dimension, ArchitectureDimension.OperationalExcellence)
                }).ToList(),
                Recommendations = Recommendations.Select(item => new Recommendation
                {
                    Description = item.Description,
                    Severity = ParseEnum(item.Severity, SuggestionSeverity.Medium)
                }).ToList(),
                Tradeoffs = Tradeoffs.Select(item => new Tradeoff
                {
                    Summary = item.Summary,
                    Pros = item.Pros,
                    Cons = item.Cons
                }).ToList(),
                DimensionMaturitySuggestions = DimensionMaturitySuggestions.Select(item => new DimensionMaturitySuggestion
                {
                    Dimension = ParseEnum(item.Dimension, ArchitectureDimension.OperationalExcellence),
                    CurrentMaturity = Math.Clamp(item.CurrentMaturity, 1, 5),
                    SuggestedMaturity = Math.Clamp(item.SuggestedMaturity, 1, 5),
                    Reason = item.Reason
                }).ToList()
            };
        }
    }

    private sealed class FoundryEvidence
    {
        public string Summary { get; init; } = string.Empty;
        public string? Details { get; init; }
    }

    private sealed class FoundryMissingControl
    {
        public string Name { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public string Dimension { get; init; } = nameof(ArchitectureDimension.OperationalExcellence);
    }

    private sealed class FoundryRecommendation
    {
        public string Description { get; init; } = string.Empty;
        public string Severity { get; init; } = nameof(SuggestionSeverity.Medium);
    }

    private sealed class FoundryTradeoff
    {
        public string Summary { get; init; } = string.Empty;
        public List<string> Pros { get; init; } = new();
        public List<string> Cons { get; init; } = new();
    }

    private sealed class FoundryMaturitySuggestion
    {
        public string Dimension { get; init; } = nameof(ArchitectureDimension.OperationalExcellence);
        public int CurrentMaturity { get; init; } = 2;
        public int SuggestedMaturity { get; init; } = 4;
        public string Reason { get; init; } = string.Empty;
    }

    private static TEnum ParseEnum<TEnum>(string value, TEnum fallback)
        where TEnum : struct
    {
        return Enum.TryParse<TEnum>(value, ignoreCase: true, out var parsed) ? parsed : fallback;
    }
}

file static class AgentAnalysisResultExtensions
{
    public static AgentAnalysisResult WithTrace(this AgentAnalysisResult result, IList<AgentExecutionTrace> traces)
    {
        return new AgentAnalysisResult
        {
            Id = result.Id,
            ArchitectureDiagramId = result.ArchitectureDiagramId,
            RequestedAt = result.RequestedAt,
            CompletedAt = result.CompletedAt,
            ExecutiveSummary = result.ExecutiveSummary,
            ResolvedFrameworkSelection = result.ResolvedFrameworkSelection,
            ResolvedQualityAttributeWeights = result.ResolvedQualityAttributeWeights,
            OpenQuestions = result.OpenQuestions,
            CriticNotes = result.CriticNotes,
            FoundryIqContext = result.FoundryIqContext,
            AgentTrace = traces.ToList(),
            Evidence = result.Evidence,
            MissingControls = result.MissingControls,
            Recommendations = result.Recommendations,
            Tradeoffs = result.Tradeoffs,
            DimensionMaturitySuggestions = result.DimensionMaturitySuggestions,
        };
    }
}
