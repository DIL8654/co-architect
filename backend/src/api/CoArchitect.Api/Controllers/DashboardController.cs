using CoArchitect.Api.DTOs;
using CoArchitect.Application.Interfaces;
using CoArchitect.Api.Services;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
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
    private readonly ICurrentUserService _currentUserService;
    private readonly IArchitectureIntelligenceScoreService _scoreService;

    public DashboardController(
        IWorkspaceRepository workspaceRepository,
        IDiagramRepository diagramRepository,
        IAgentAnalysisRunRepository analysisRunRepository,
        IAdrRepository adrRepository,
        ICurrentUserService currentUserService,
        IArchitectureIntelligenceScoreService scoreService)
    {
        _workspaceRepository = workspaceRepository;
        _diagramRepository = diagramRepository;
        _analysisRunRepository = analysisRunRepository;
        _adrRepository = adrRepository;
        _currentUserService = currentUserService;
        _scoreService = scoreService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(CancellationToken cancellationToken)
    {
        var currentUser = _currentUserService.GetCurrentUser();
        var workspaces = (await _workspaceRepository.GetByTenantIdAsync(currentUser.TenantId, cancellationToken))
            .OrderByDescending(item => item.UpdatedAt)
            .ToList();
        var workspaceIds = workspaces.Select(item => item.Id).ToHashSet();
        var diagrams = (await _diagramRepository.GetAllAsync(cancellationToken))
            .Where(item => workspaceIds.Contains(item.WorkspaceId))
            .OrderByDescending(item => item.UploadedAt)
            .ToList();
        var diagramsByWorkspace = diagrams
            .GroupBy(item => item.WorkspaceId)
            .ToDictionary(group => group.Key, group => group.ToList());

        var workspaceSummaries = new List<WorkspaceDashboardSummaryResponse>(workspaces.Count);
        var demoJourneys = new List<DemoJourneySummaryResponse>();
        var scoredDiagramCount = 0;
        var needsReviewCount = 0;

        foreach (var workspace in workspaces)
        {
            var workspaceDiagrams = diagramsByWorkspace.TryGetValue(workspace.Id, out var items)
                ? items
                : [];
            var workspaceScoredCount = 0;
            var workspaceNeedsReviewCount = 0;
            var isDemoWorkspace = IsDemoWorkspace(workspace.Name);

            foreach (var diagram in workspaceDiagrams)
            {
                var latestRun = await _analysisRunRepository.GetLatestByDiagramIdAsync(diagram.Id, cancellationToken);
                decimal? finalScore = null;
                if (latestRun?.Result is not null)
                {
                    finalScore = Convert.ToDecimal((await CalculateScoreAsync(latestRun.Result, cancellationToken)).FinalScore);
                }
                if (finalScore.HasValue)
                {
                    workspaceScoredCount++;
                }
                else
                {
                    workspaceNeedsReviewCount++;
                }

                if (!isDemoWorkspace)
                {
                    continue;
                }

                var adrs = await _adrRepository.GetByDiagramIdAsync(diagram.Id, cancellationToken);
                demoJourneys.Add(new DemoJourneySummaryResponse
                {
                    WorkspaceId = workspace.Id,
                    WorkspaceName = workspace.Name,
                    DiagramId = diagram.Id,
                    DiagramName = diagram.Name,
                    Description = diagram.Description ?? string.Empty,
                    ThumbnailUrl = diagram.FileUrl,
                    Score = finalScore.HasValue ? Convert.ToDecimal(finalScore.Value) : null,
                    AnalysisStatus = latestRun?.Status.ToString() ?? "Not run",
                    LatestRunId = latestRun?.Id,
                    AdrCount = adrs.Count(),
                });
            }

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
        }

        return Ok(new DashboardSummaryResponse
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
        });
    }

    private static bool IsDemoWorkspace(string workspaceName) =>
        workspaceName.StartsWith("[Demo] ", StringComparison.OrdinalIgnoreCase);

    private async Task<ArchitectureScoreResult> CalculateScoreAsync(
        AgentAnalysisResult agentResult,
        CancellationToken cancellationToken)
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
}
