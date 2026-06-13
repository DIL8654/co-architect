using CoArchitect.Api.DTOs;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;
using Microsoft.Extensions.Logging;

namespace CoArchitect.Api.Services;

public sealed class PerformanceReadModelService
{
    private static readonly string[] DemoWorkspaceOrder =
    [
        "[Demo] Automated Video Analysis Platform",
        "[Demo] Custom Document Processing Platform",
        "[Demo] Enterprise SaaS Platform Baseline",
    ];

    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IDiagramRepository _diagramRepository;
    private readonly IAgentAnalysisRunRepository _analysisRunRepository;
    private readonly IAdrRepository _adrRepository;
    private readonly IArchitectureIntelligenceScoreService _scoreService;
    private readonly PerformanceCacheService _cache;
    private readonly ILogger<PerformanceReadModelService> _logger;

    public PerformanceReadModelService(
        IWorkspaceRepository workspaceRepository,
        IDiagramRepository diagramRepository,
        IAgentAnalysisRunRepository analysisRunRepository,
        IAdrRepository adrRepository,
        IArchitectureIntelligenceScoreService scoreService,
        PerformanceCacheService cache,
        ILogger<PerformanceReadModelService> logger)
    {
        _workspaceRepository = workspaceRepository;
        _diagramRepository = diagramRepository;
        _analysisRunRepository = analysisRunRepository;
        _adrRepository = adrRepository;
        _scoreService = scoreService;
        _cache = cache;
        _logger = logger;
    }

    public async Task<IReadOnlyList<WorkspaceResponse>> GetWorkspaceResponsesAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        return await _cache.GetOrCreateAsync(PerformanceCacheService.Workspaces(tenantId), async _ =>
        {
            var workspaces = (await _workspaceRepository.GetByTenantIdAsync(tenantId, cancellationToken))
                .OrderByDescending(item => item.UpdatedAt)
                .ToList();
            var diagramCounts = await _diagramRepository.GetDiagramCountsByWorkspaceIdsAsync(workspaces.Select(item => item.Id), cancellationToken);

            return workspaces.Select(workspace => new WorkspaceResponse
            {
                Id = workspace.Id,
                Name = workspace.Name,
                CreatedAt = workspace.CreatedAt,
                UpdatedAt = workspace.UpdatedAt,
                DiagramCount = diagramCounts.TryGetValue(workspace.Id, out var count) ? count : 0,
            }).ToList().AsReadOnly();
        });
    }

    public async Task<WorkspaceResponse?> GetWorkspaceResponseAsync(Guid tenantId, Guid workspaceId, CancellationToken cancellationToken)
    {
        return await _cache.GetOrCreateAsync(PerformanceCacheService.Workspace(workspaceId), async _ =>
        {
            var workspace = await _workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
            if (workspace is null || workspace.TenantId != tenantId)
            {
                return null;
            }

            var counts = await _diagramRepository.GetDiagramCountsByWorkspaceIdsAsync([workspace.Id], cancellationToken);
            return new WorkspaceResponse
            {
                Id = workspace.Id,
                Name = workspace.Name,
                CreatedAt = workspace.CreatedAt,
                UpdatedAt = workspace.UpdatedAt,
                DiagramCount = counts.TryGetValue(workspace.Id, out var count) ? count : 0,
            };
        });
    }

    public async Task<IReadOnlyList<ArchitectureDiagramResponse>> GetDiagramResponsesForWorkspaceAsync(Guid tenantId, Guid workspaceId, CancellationToken cancellationToken)
    {
        return await _cache.GetOrCreateAsync(PerformanceCacheService.Diagrams(workspaceId), async _ =>
        {
            var workspace = await _workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
            if (workspace is null || workspace.TenantId != tenantId)
            {
                return Array.Empty<ArchitectureDiagramResponse>();
            }

            var diagrams = (await _diagramRepository.GetByWorkspaceIdAsync(workspaceId, cancellationToken)).ToList();
            return await BuildDiagramResponsesAsync(diagrams, cancellationToken);
        });
    }

    public async Task<ArchitectureDiagramResponse?> GetDiagramResponseAsync(Guid tenantId, Guid diagramId, CancellationToken cancellationToken)
    {
        return await _cache.GetOrCreateAsync(PerformanceCacheService.Diagram(diagramId), async _ =>
        {
            var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
            if (diagram is null)
            {
                return null;
            }

            var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
            if (workspace is null || workspace.TenantId != tenantId)
            {
                return null;
            }

            return (await BuildDiagramResponsesAsync([diagram], cancellationToken)).FirstOrDefault();
        });
    }

    public Task<DashboardSummaryResponse> GetDashboardSummaryAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        return _cache.GetOrCreateAsync(PerformanceCacheService.Dashboard(tenantId), async _ =>
        {
            var startedAt = DateTime.UtcNow;
            var workspaces = (await _workspaceRepository.GetByTenantIdAsync(tenantId, cancellationToken))
                .OrderByDescending(item => item.UpdatedAt)
                .ToList();
            var diagrams = (await _diagramRepository.GetByWorkspaceIdsAsync(workspaces.Select(item => item.Id), cancellationToken))
                .OrderByDescending(item => item.UploadedAt)
                .ToList();

            var latestRuns = await _analysisRunRepository.GetLatestByDiagramIdsAsync(diagrams.Select(item => item.Id), cancellationToken);
            var adrCounts = await _adrRepository.GetCountsByDiagramIdsAsync(
                diagrams.Where(item => IsDemoWorkspace(item.WorkspaceId, workspaces)).Select(item => item.Id),
                cancellationToken);

            var scores = await BuildScoresByDiagramAsync(latestRuns, cancellationToken);
            var workspaceSummaries = new List<WorkspaceDashboardSummaryResponse>(workspaces.Count);
            var demoJourneys = new List<DemoJourneySummaryResponse>();
            var diagramsByWorkspace = diagrams.GroupBy(item => item.WorkspaceId).ToDictionary(group => group.Key, group => group.ToList());
            var scoredDiagramCount = 0;
            var needsReviewCount = 0;

            foreach (var workspace in workspaces)
            {
                var workspaceDiagrams = diagramsByWorkspace.GetValueOrDefault(workspace.Id, []);
                var workspaceScoredCount = workspaceDiagrams.Count(diagram => scores.ContainsKey(diagram.Id));
                var workspaceNeedsReviewCount = workspaceDiagrams.Count - workspaceScoredCount;

                scoredDiagramCount += workspaceScoredCount;
                needsReviewCount += workspaceNeedsReviewCount;

                workspaceSummaries.Add(new WorkspaceDashboardSummaryResponse
                {
                    Id = workspace.Id,
                    Name = workspace.Name,
                    DiagramCount = workspaceDiagrams.Count,
                    ScoredDiagramCount = workspaceScoredCount,
                    NeedsReviewCount = workspaceNeedsReviewCount,
                });

                if (!IsDemoWorkspace(workspace.Name))
                {
                    continue;
                }

                foreach (var diagram in workspaceDiagrams)
                {
                    latestRuns.TryGetValue(diagram.Id, out var latestRun);
                    decimal? score = scores.TryGetValue(diagram.Id, out var resolvedScore) ? resolvedScore : null;

                    demoJourneys.Add(new DemoJourneySummaryResponse
                    {
                        WorkspaceId = workspace.Id,
                        WorkspaceName = workspace.Name,
                        DiagramId = diagram.Id,
                        DiagramName = diagram.Name,
                        Description = diagram.Description ?? string.Empty,
                        ThumbnailUrl = diagram.FileUrl,
                        Score = score,
                        AnalysisStatus = latestRun?.Status.ToString() ?? "Not run",
                        LatestRunId = latestRun?.Id,
                        AdrCount = adrCounts.TryGetValue(diagram.Id, out var adrCount) ? adrCount : 0,
                    });
                }
            }

            _logger.LogInformation(
                "Dashboard summary assembled for tenant {TenantId} in {DurationMs} ms with {WorkspaceCount} workspaces and {DiagramCount} diagrams.",
                tenantId,
                (DateTime.UtcNow - startedAt).TotalMilliseconds,
                workspaces.Count,
                diagrams.Count);

            return new DashboardSummaryResponse
            {
                WorkspaceCount = workspaces.Count,
                DiagramCount = diagrams.Count,
                ScoredDiagramCount = scoredDiagramCount,
                NeedsReviewCount = needsReviewCount,
                WorkspaceSummaries = workspaceSummaries,
                DemoJourneys = demoJourneys
                    .OrderBy(item => Array.IndexOf(DemoWorkspaceOrder, item.WorkspaceName))
                    .ThenBy(item => item.DiagramName, StringComparer.OrdinalIgnoreCase)
                    .Take(3)
                    .ToList(),
            };
        });
    }

    private async Task<IReadOnlyList<ArchitectureDiagramResponse>> BuildDiagramResponsesAsync(
        IReadOnlyCollection<ArchitectureDiagram> diagrams,
        CancellationToken cancellationToken)
    {
        if (diagrams.Count == 0)
        {
            return [];
        }

        var latestRuns = await _analysisRunRepository.GetLatestByDiagramIdsAsync(diagrams.Select(item => item.Id), cancellationToken);
        var scores = await BuildScoresByDiagramAsync(latestRuns, cancellationToken);

        return diagrams
            .Select(diagram =>
            {
                latestRuns.TryGetValue(diagram.Id, out var latestRun);
                scores.TryGetValue(diagram.Id, out var score);

                return new ArchitectureDiagramResponse
                {
                    Id = diagram.Id,
                    WorkspaceId = diagram.WorkspaceId,
                    UploadedByUserId = diagram.UploadedByUserId,
                    Name = diagram.Name,
                    OriginalFileName = diagram.OriginalFileName,
                    FileUrl = diagram.FileUrl,
                    Description = diagram.Description,
                    UploadedAt = diagram.UploadedAt,
                    ArchitectureScore = scores.TryGetValue(diagram.Id, out var resolvedScore) ? resolvedScore : null,
                    LatestRunId = latestRun?.Id,
                    LatestAnalysisStatus = latestRun?.Status.ToString(),
                    LastAnalyzedAt = latestRun?.CompletedAt ?? latestRun?.RequestedAt,
                    ReviewSetup = DiagramReviewSetupMapper.ToResponse(diagram),
                };
            })
            .OrderByDescending(item => item.UploadedAt)
            .ToList()
            .AsReadOnly();
    }

    private async Task<Dictionary<Guid, decimal>> BuildScoresByDiagramAsync(
        IDictionary<Guid, AgentAnalysisRun> latestRuns,
        CancellationToken cancellationToken)
    {
        var scores = new Dictionary<Guid, decimal>();

        foreach (var pair in latestRuns)
        {
            if (pair.Value.Result is null)
            {
                continue;
            }

            var score = await CalculateScoreAsync(pair.Value.Result, cancellationToken);
            scores[pair.Key] = Convert.ToDecimal(score.FinalScore);
        }

        return scores;
    }

    private async Task<ArchitectureScoreResult> CalculateScoreAsync(AgentAnalysisResult agentResult, CancellationToken cancellationToken)
    {
        var maturityByDimension = agentResult.DimensionMaturitySuggestions.ToDictionary(
            suggestion => suggestion.Dimension,
            suggestion => suggestion.SuggestedMaturity);

        foreach (var dimension in Enum.GetValues<ArchitectureDimension>())
        {
            maturityByDimension.TryAdd(dimension, 2);
        }

        return await _scoreService.CalculateAsync(maturityByDimension, cancellationToken);
    }

    private static bool IsDemoWorkspace(string workspaceName) =>
        workspaceName.StartsWith("[Demo] ", StringComparison.OrdinalIgnoreCase);

    private static bool IsDemoWorkspace(Guid workspaceId, IReadOnlyCollection<Workspace> workspaces) =>
        workspaces.FirstOrDefault(item => item.Id == workspaceId) is { Name: var name } && IsDemoWorkspace(name);
}
