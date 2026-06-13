using System.Text.Json;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Settings;

namespace CoArchitect.Infrastructure.Services;

public sealed class AzureFoundryIqProvider : IFoundryIqProvider, IFoundryIqKnowledgeProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly AzureFoundryInvocationService _invocationService;
    private readonly FoundryIqOptions _options;

    public AzureFoundryIqProvider(AzureFoundryInvocationService invocationService, FoundryIqOptions options)
    {
        _invocationService = invocationService;
        _options = options;
    }

    public async Task<FoundryIqContextBundle> RetrieveContextAsync(FoundryIqQuery query, CancellationToken cancellationToken)
    {
        if (!_options.PreferManagedFoundry || string.IsNullOrWhiteSpace(_options.AgentId))
        {
            return BuildUnavailableBundle("Azure Foundry IQ retrieval is not configured.");
        }

        var invocation = await _invocationService.InvokeAsync(BuildPrompt(query), _options.AgentId!, cancellationToken);
        if (!invocation.Succeeded || string.IsNullOrWhiteSpace(invocation.OutputText))
        {
            return BuildUnavailableBundle(invocation.FailureReason ?? "Azure Foundry IQ returned no output.");
        }

        try
        {
            var payload = AzureFoundryInvocationService.ExtractJsonPayload(invocation.OutputText);
            var parsed = JsonSerializer.Deserialize<FoundryIqAgentResponse>(payload, JsonOptions) ?? new FoundryIqAgentResponse();
            var bundle = new FoundryIqContextBundle
            {
                RetrievalProvider = "AzureFoundryIQ",
                FrameworkGuidanceItems = parsed.FrameworkGuidanceItems.Select(item => item.ToDomainItem("framework-guidance")).ToList(),
                PrincipleItems = parsed.PrincipleItems.Select(item => item.ToDomainItem("architecture-principle")).ToList(),
                TradeoffItems = parsed.TradeoffItems.Select(item => item.ToDomainItem("tradeoff-guidance")).ToList(),
                ComplianceItems = parsed.ComplianceItems.Select(item => item.ToDomainItem("compliance-guidance")).ToList(),
                AdrTemplateItems = parsed.AdrTemplateItems.Select(item => item.ToDomainItem("adr-template")).ToList(),
                CitationRefs = parsed.CitationRefs
                    .Concat(parsed.FrameworkGuidanceItems.Select(item => item.SourceLabel))
                    .Concat(parsed.ComplianceItems.Select(item => item.SourceLabel))
                    .Where(item => !string.IsNullOrWhiteSpace(item))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList(),
            };

            var hasManagedContext =
                bundle.FrameworkGuidanceItems.Count > 0 ||
                bundle.PrincipleItems.Count > 0 ||
                bundle.TradeoffItems.Count > 0 ||
                bundle.ComplianceItems.Count > 0 ||
                bundle.AdrTemplateItems.Count > 0;

            return hasManagedContext
                ? bundle
                : BuildUnavailableBundle("Azure Foundry IQ returned an empty context bundle.");
        }
        catch (JsonException ex)
        {
            return BuildUnavailableBundle($"Azure Foundry IQ response could not be parsed. {ex.Message}");
        }
    }

    private static string BuildPrompt(FoundryIqQuery query)
    {
        var weights = string.Join(", ", query.QualityAttributeWeights.Select(item => $"{item.Label}:{item.Weight}%"));
        return $$"""
        You are CoArchitect AI's Foundry IQ retrieval agent.

        Use the knowledge base connected to this agent to retrieve grounded architecture context for the review below.
        Return only valid JSON with this shape:
        {
          "frameworkGuidanceItems": [{"id":"...","category":"...","title":"...","summary":"...","content":"...","sourceLabel":"...","sourceUri":"...","standardKey":"...","useCaseTags":["..."],"whyItMatters":"...","whenToApply":"...","framework":"...","principle":"...","tradeoffTag":"..."}],
          "principleItems": [...],
          "tradeoffItems": [...],
          "complianceItems": [...],
          "adrTemplateItems": [...],
          "citationRefs": ["..."]
        }

        Requirements:
        - Prefer concise grounded excerpts over long prose.
        - Include framework guidance for selected frameworks when available.
        - Include compliance/governance guidance for selected standards when available.
        - Include principles and trade-offs relevant to the architecture and weighted priorities.
        - Include source labels and citations.

        Review purpose: {{query.AnalysisPurpose}}
        Diagram: {{query.DiagramName}}
        Description: {{query.ArchitectureDescription}}
        Suggested frameworks: {{string.Join(", ", query.SuggestedFrameworks)}}
        Suggested standards: {{string.Join(", ", query.SuggestedStandards)}}
        Quality weights: {{weights}}
        Business domain: {{query.ReviewContext.BusinessDomain}}
        Target users: {{query.ReviewContext.TargetUsers}}
        Expected traffic: {{query.ReviewContext.ExpectedTraffic}}
        Data sensitivity: {{query.ReviewContext.DataSensitivity}}
        Cloud preference: {{query.ReviewContext.CloudProviderPreference}}
        Compliance needs: {{query.ReviewContext.ComplianceNeeds}}
        Current pain points: {{query.ReviewContext.CurrentPainPoints}}
        """;
    }

    private static FoundryIqContextBundle BuildUnavailableBundle(string reason)
    {
        return new FoundryIqContextBundle
        {
            RetrievalProvider = "AzureFoundryIQ",
            FallbackUsed = true,
            FallbackReason = reason,
            CitationRefs = { "Azure Foundry IQ unavailable" },
        };
    }

    private sealed class FoundryIqAgentResponse
    {
        public List<FoundryIqAgentItem> FrameworkGuidanceItems { get; init; } = new();
        public List<FoundryIqAgentItem> PrincipleItems { get; init; } = new();
        public List<FoundryIqAgentItem> TradeoffItems { get; init; } = new();
        public List<FoundryIqAgentItem> ComplianceItems { get; init; } = new();
        public List<FoundryIqAgentItem> AdrTemplateItems { get; init; } = new();
        public List<string> CitationRefs { get; init; } = new();
    }

    private sealed class FoundryIqAgentItem
    {
        public string Id { get; init; } = string.Empty;
        public string Category { get; init; } = string.Empty;
        public string Title { get; init; } = string.Empty;
        public string Summary { get; init; } = string.Empty;
        public string Content { get; init; } = string.Empty;
        public string SourceLabel { get; init; } = "Managed Foundry IQ";
        public string? SourceUri { get; init; }
        public string? StandardKey { get; init; }
        public List<string> UseCaseTags { get; init; } = new();
        public string? WhyItMatters { get; init; }
        public string? WhenToApply { get; init; }
        public string? Framework { get; init; }
        public string? Principle { get; init; }
        public string? TradeoffTag { get; init; }

        public FoundryIqContextItem ToDomainItem(string sourceType)
        {
            return new FoundryIqContextItem
            {
                Id = string.IsNullOrWhiteSpace(Id) ? Guid.NewGuid().ToString("N") : Id,
                Category = string.IsNullOrWhiteSpace(Category) ? "general" : Category,
                Title = Title,
                Summary = Summary,
                Content = string.IsNullOrWhiteSpace(Content) ? Summary : Content,
                SourceType = sourceType,
                SourceLabel = SourceLabel,
                SourceProvider = "AzureFoundryIQ",
                SourceUri = SourceUri,
                StandardKey = StandardKey,
                UseCaseTags = UseCaseTags,
                WhyItMatters = WhyItMatters,
                WhenToApply = WhenToApply,
                Framework = Framework,
                Principle = Principle,
                TradeoffTag = TradeoffTag,
            };
        }
    }
}
