using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Services;

public sealed class ContextEnrichmentAgent : IContextEnrichmentAgent
{
    private readonly IFoundryIqProvider _foundryIqProvider;

    public ContextEnrichmentAgent(IFoundryIqProvider foundryIqProvider)
    {
        _foundryIqProvider = foundryIqProvider;
    }

    public async Task<ContextEnrichmentResult> EnrichAsync(
        ArchitectureDiagram diagram,
        IReadOnlyCollection<ReviewFramework> selectedFrameworks,
        IReadOnlyCollection<QualityAttributeWeight> effectiveWeights,
        CancellationToken cancellationToken)
    {
        var query = new FoundryIqQuery
        {
            WorkspaceId = diagram.WorkspaceId,
            DiagramId = diagram.Id,
            DiagramName = diagram.Name,
            ArchitectureDescription = diagram.Description ?? string.Empty,
            AnalysisPurpose = "Architecture review and recommendation generation",
            ReviewContext = diagram.ReviewContext,
            QualityAttributeWeights = effectiveWeights.ToList(),
            SuggestedFrameworks = selectedFrameworks.Select(item => item.ToString()).ToList(),
        };

        var bundle = await _foundryIqProvider.RetrieveContextAsync(query, cancellationToken);
        var applicablePrinciples = ResolveApplicablePrinciples(bundle, effectiveWeights);
        var applicableTradeoffs = ResolveApplicableTradeoffs(diagram, bundle, effectiveWeights);
        var missingNotes = BuildMissingContextNotes(diagram, bundle);

        return new ContextEnrichmentResult
        {
            ContextBundle = bundle,
            ConfirmedFrameworks = selectedFrameworks.ToList(),
            ApplicablePrinciples = applicablePrinciples,
            ApplicableTradeoffs = applicableTradeoffs,
            MissingContextNotes = missingNotes,
            Summary = BuildSummary(bundle, applicablePrinciples, applicableTradeoffs),
        };
    }

    private static IList<string> ResolveApplicablePrinciples(
        FoundryIqContextBundle bundle,
        IReadOnlyCollection<QualityAttributeWeight> weights)
    {
        var topCategories = MapWeightCategories(weights);

        return bundle.PrincipleItems
            .Where(item => topCategories.Contains(item.Category))
            .Select(item => item.Principle ?? item.Title)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .DefaultIfEmpty("Fitness for purpose")
            .ToList();
    }

    private static IList<string> ResolveApplicableTradeoffs(
        ArchitectureDiagram diagram,
        FoundryIqContextBundle bundle,
        IReadOnlyCollection<QualityAttributeWeight> weights)
    {
        var topCategories = MapWeightCategories(weights);
        var normalizedText = BuildNormalizedText(diagram);
        var matches = bundle.TradeoffItems
            .Where(item =>
                topCategories.Contains(item.Category) ||
                item.UseCaseTags.Any(tag => normalizedText.Contains(tag.Replace('-', ' '), StringComparison.OrdinalIgnoreCase) || normalizedText.Contains(tag, StringComparison.OrdinalIgnoreCase)))
            .Select(item => item.TradeoffTag ?? item.Title)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return matches.Count > 0
            ? matches
            : bundle.TradeoffItems.Select(item => item.TradeoffTag ?? item.Title).Distinct(StringComparer.OrdinalIgnoreCase).Take(3).ToList();
    }

    private static IList<string> BuildMissingContextNotes(ArchitectureDiagram diagram, FoundryIqContextBundle bundle)
    {
        var notes = new List<string>();

        if (string.IsNullOrWhiteSpace(diagram.ReviewContext.BusinessDomain))
        {
            notes.Add("Business domain was not supplied, so principle weighting relied on architecture cues only.");
        }

        if (bundle.ComplianceItems.Count == 0 && RequiresComplianceContext(diagram))
        {
            notes.Add("Compliance-sensitive cues were present, but limited compliance guidance matched the current review context.");
        }

        if (bundle.WorkspaceMemory.PreviousReviewSummaries.Count == 0)
        {
            notes.Add("No prior review history was available for workspace memory grounding.");
        }

        if (bundle.RelatedAdrHistoryItems.Count == 0)
        {
            notes.Add("No prior ADR history was available to influence recommendation continuity.");
        }

        return notes;
    }

    private static string BuildSummary(FoundryIqContextBundle bundle, IList<string> principles, IList<string> tradeoffs)
    {
        return $"Retrieved {bundle.FrameworkGuidanceItems.Count} framework guidance items, {bundle.PrincipleItems.Count} principle notes, {bundle.TradeoffItems.Count} trade-off notes, {bundle.ComplianceItems.Count} compliance notes, and {bundle.WorkspaceMemoryItems.Count} workspace memory signals. Primary principles: {string.Join(", ", principles.Take(3))}. Primary trade-offs: {string.Join(", ", tradeoffs.Take(3))}.";
    }

    private static HashSet<string> MapWeightCategories(IReadOnlyCollection<QualityAttributeWeight> weights)
    {
        var categories = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var weight in weights
            .OrderByDescending(item => item.Weight)
            .Take(4))
        {
            switch (weight.Key.ToLowerInvariant())
            {
                case "security":
                    categories.Add("security");
                    categories.Add("compliance");
                    break;
                case "availability":
                    categories.Add("reliability");
                    categories.Add("operations");
                    break;
                case "scalability":
                    categories.Add("scalability");
                    break;
                case "cost":
                    categories.Add("cost");
                    break;
                case "maintainability":
                    categories.Add("maintainability");
                    break;
                case "compliance":
                    categories.Add("compliance");
                    break;
                case "deliveryspeed":
                    categories.Add("operations");
                    categories.Add("governance");
                    break;
            }
        }

        if (categories.Count == 0)
        {
            categories.UnionWith(["security", "reliability", "operations"]);
        }

        return categories;
    }

    private static string BuildNormalizedText(ArchitectureDiagram diagram)
    {
        return string.Join(
                ' ',
                diagram.Name,
                diagram.Description,
                diagram.ReviewContext.BusinessDomain,
                diagram.ReviewContext.TargetUsers,
                diagram.ReviewContext.ExpectedTraffic,
                diagram.ReviewContext.DataSensitivity,
                diagram.ReviewContext.CloudProviderPreference,
                diagram.ReviewContext.ComplianceNeeds,
                diagram.ReviewContext.CurrentPainPoints)
            .ToLowerInvariant();
    }

    private static bool RequiresComplianceContext(ArchitectureDiagram diagram)
    {
        var normalizedText = BuildNormalizedText(diagram);
        return !string.IsNullOrWhiteSpace(diagram.ReviewContext.ComplianceNeeds)
            || !string.IsNullOrWhiteSpace(diagram.ReviewContext.DataSensitivity)
            || normalizedText.Contains("pii", StringComparison.OrdinalIgnoreCase)
            || normalizedText.Contains("personal data", StringComparison.OrdinalIgnoreCase)
            || normalizedText.Contains("audit", StringComparison.OrdinalIgnoreCase)
            || normalizedText.Contains("gdpr", StringComparison.OrdinalIgnoreCase);
    }
}
