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
        var applicableTradeoffs = ResolveApplicableTradeoffs(bundle, effectiveWeights);
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
        var topWeights = weights
            .OrderByDescending(item => item.Weight)
            .Take(4)
            .Select(item => item.Label)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return bundle.PrincipleItems
            .Select(item => item.Principle ?? item.Title)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Where(item => topWeights.Count == 0 || topWeights.Any(weight => item.Contains(weight, StringComparison.OrdinalIgnoreCase) || weight.Contains(item, StringComparison.OrdinalIgnoreCase)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .DefaultIfEmpty("Fitness for purpose")
            .ToList();
    }

    private static IList<string> ResolveApplicableTradeoffs(
        FoundryIqContextBundle bundle,
        IReadOnlyCollection<QualityAttributeWeight> weights)
    {
        var topLabels = weights
            .OrderByDescending(item => item.Weight)
            .Take(3)
            .Select(item => item.Label)
            .ToList();

        var matches = bundle.TradeoffItems
            .Select(item => item.TradeoffTag ?? item.Title)
            .Where(item => topLabels.Count == 0 || topLabels.Any(label => item.Contains(label, StringComparison.OrdinalIgnoreCase)))
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
        return $"Retrieved {bundle.FrameworkGuidanceItems.Count} framework guidance items, {bundle.PrincipleItems.Count} principle notes, {bundle.TradeoffItems.Count} trade-off notes, and {bundle.WorkspaceMemoryItems.Count} workspace memory signals. Primary principles: {string.Join(", ", principles.Take(3))}. Primary trade-offs: {string.Join(", ", tradeoffs.Take(3))}.";
    }
}
