using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Models;

namespace CoArchitect.Infrastructure.Services;

public sealed class CompositeFoundryIqProvider : IFoundryIqProvider
{
    private readonly IFoundryIqKnowledgeProvider _knowledgeProvider;
    private readonly IDiagramRepository _diagramRepository;
    private readonly IAgentAnalysisRunRepository _analysisRunRepository;
    private readonly IDiagramCommentRepository _commentRepository;
    private readonly IAdrRepository _adrRepository;

    public CompositeFoundryIqProvider(
        IFoundryIqKnowledgeProvider knowledgeProvider,
        IDiagramRepository diagramRepository,
        IAgentAnalysisRunRepository analysisRunRepository,
        IDiagramCommentRepository commentRepository,
        IAdrRepository adrRepository)
    {
        _knowledgeProvider = knowledgeProvider;
        _diagramRepository = diagramRepository;
        _analysisRunRepository = analysisRunRepository;
        _commentRepository = commentRepository;
        _adrRepository = adrRepository;
    }

    public async Task<FoundryIqContextBundle> RetrieveContextAsync(FoundryIqQuery query, CancellationToken cancellationToken)
    {
        var bundle = await _knowledgeProvider.RetrieveContextAsync(query, cancellationToken);
        var diagrams = (await _diagramRepository.GetByWorkspaceIdAsync(query.WorkspaceId, cancellationToken)).ToList();

        var previousReviewSummaries = new List<string>();
        var recurringFindings = new List<string>();
        var priorRecommendations = new List<string>();
        var recentComments = new List<string>();
        var adrHistory = new List<string>();

        var workspaceMemoryItems = new List<FoundryIqContextItem>();
        var relatedFindingItems = new List<FoundryIqContextItem>();
        var relatedAdrHistoryItems = new List<FoundryIqContextItem>();

        foreach (var diagram in diagrams)
        {
            var runs = (await _analysisRunRepository.GetByDiagramIdAsync(diagram.Id, cancellationToken))
                .Where(run => run.Result is not null)
                .OrderByDescending(run => run.RequestedAt)
                .Take(3)
                .ToList();

            foreach (var run in runs)
            {
                if (run.Result is null)
                {
                    continue;
                }

                previousReviewSummaries.Add(run.Result.ExecutiveSummary);
                workspaceMemoryItems.Add(new FoundryIqContextItem
                {
                    Id = $"analysis:{run.Id}",
                    Category = "workspace-memory",
                    Title = $"Prior review for {diagram.Name}",
                    Summary = run.Result.ExecutiveSummary,
                    Content = run.Result.ExecutiveSummary,
                    SourceType = "analysis-run",
                    SourceLabel = $"{diagram.Name} analysis",
                    SourceProvider = "WorkspaceMemory",
                    WorkspaceScoped = true,
                    AnalysisRunId = run.Id,
                });

                foreach (var control in run.Result.MissingControls.Take(4))
                {
                    recurringFindings.Add(control.Name);
                    relatedFindingItems.Add(new FoundryIqContextItem
                    {
                        Id = $"finding:{run.Id}:{control.Id}",
                        Category = "related-finding",
                        Title = control.Name,
                        Summary = control.Description,
                        Content = control.Description,
                        SourceType = "analysis-run",
                        SourceLabel = $"{diagram.Name} finding",
                        SourceProvider = "WorkspaceMemory",
                        WorkspaceScoped = true,
                        AnalysisRunId = run.Id,
                    });
                }

                foreach (var recommendation in run.Result.Recommendations.Take(4))
                {
                    priorRecommendations.Add(recommendation.Description);
                }
            }

            var comments = (await _commentRepository.GetByDiagramIdAsync(diagram.Id, cancellationToken))
                .OrderByDescending(comment => comment.CreatedAt)
                .Take(5)
                .ToList();

            foreach (var comment in comments)
            {
                recentComments.Add(comment.Content);
                workspaceMemoryItems.Add(new FoundryIqContextItem
                {
                    Id = $"comment:{comment.Id}",
                    Category = "workspace-comment",
                    Title = $"Comment on {diagram.Name}",
                    Summary = comment.Content,
                    Content = comment.Content,
                    SourceType = "comment",
                    SourceLabel = $"{diagram.Name} comment",
                    SourceProvider = "WorkspaceMemory",
                    WorkspaceScoped = true,
                });
            }

            var adrs = (await _adrRepository.GetByDiagramIdAsync(diagram.Id, cancellationToken)).ToList();
            foreach (var adr in adrs.Take(3))
            {
                var versions = (await _adrRepository.GetVersionsAsync(adr.Id, cancellationToken))
                    .OrderByDescending(version => version.VersionNumber)
                    .Take(2)
                    .ToList();

                foreach (var version in versions)
                {
                    adrHistory.Add(version.Summary);
                    relatedAdrHistoryItems.Add(new FoundryIqContextItem
                    {
                        Id = $"adr:{adr.Id}:v{version.VersionNumber}",
                        Category = "adr-history",
                        Title = version.Title,
                        Summary = version.Summary,
                        Content = version.Markdown,
                        SourceType = "adr-version",
                        SourceLabel = $"{diagram.Name} ADR v{version.VersionNumber}",
                        SourceProvider = "WorkspaceMemory",
                        WorkspaceScoped = true,
                        AdrId = adr.Id,
                    });
                }
            }
        }

        var dedupedFindings = recurringFindings
            .GroupBy(item => item, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => $"{group.Key} ({group.Count()} prior reviews)")
            .ToList();

        return new FoundryIqContextBundle
        {
            RetrievalProvider = bundle.RetrievalProvider,
            FallbackUsed = bundle.FallbackUsed,
            FallbackReason = bundle.FallbackReason,
            FrameworkGuidanceItems = bundle.FrameworkGuidanceItems,
            PrincipleItems = bundle.PrincipleItems,
            TradeoffItems = bundle.TradeoffItems,
            ComplianceItems = bundle.ComplianceItems,
            AdrTemplateItems = bundle.AdrTemplateItems,
            WorkspaceMemoryItems = workspaceMemoryItems,
            RelatedFindingItems = relatedFindingItems,
            RelatedAdrHistoryItems = relatedAdrHistoryItems,
            CitationRefs = bundle.CitationRefs
                .Concat(workspaceMemoryItems.Select(item => item.SourceLabel))
                .Concat(relatedAdrHistoryItems.Select(item => item.SourceLabel))
                .Distinct(StringComparer.Ordinal)
                .ToList(),
            WorkspaceMemory = new WorkspaceMemorySnapshot
            {
                PreviousReviewSummaries = previousReviewSummaries.Distinct(StringComparer.Ordinal).Take(5).ToList(),
                RecurringFindings = dedupedFindings,
                PriorRecommendations = priorRecommendations.Distinct(StringComparer.Ordinal).Take(5).ToList(),
                RecentComments = recentComments.Distinct(StringComparer.Ordinal).Take(5).ToList(),
                AdrHistory = adrHistory.Distinct(StringComparer.Ordinal).Take(5).ToList(),
                ArchitectureEvolutionSummary = BuildEvolutionSummary(previousReviewSummaries.Count, dedupedFindings.Count, adrHistory.Count),
            },
        };
    }

    private static string BuildEvolutionSummary(int reviewCount, int recurringFindingCount, int adrCount)
    {
        if (reviewCount == 0 && recurringFindingCount == 0 && adrCount == 0)
        {
            return "No prior workspace memory was available, so this review relied on framework guidance and the current architecture evidence.";
        }

        return $"Workspace memory included {reviewCount} prior review summaries, {recurringFindingCount} recurring findings, and {adrCount} ADR history signals.";
    }
}
