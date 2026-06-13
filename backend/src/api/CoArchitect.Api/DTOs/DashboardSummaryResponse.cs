namespace CoArchitect.Api.DTOs;

public sealed class DashboardSummaryResponse
{
    public int WorkspaceCount { get; init; }
    public int DiagramCount { get; init; }
    public int ScoredDiagramCount { get; init; }
    public int NeedsReviewCount { get; init; }
    public List<WorkspaceDashboardSummaryResponse> WorkspaceSummaries { get; init; } = new();
    public List<DemoJourneySummaryResponse> DemoJourneys { get; init; } = new();
}

public sealed class WorkspaceDashboardSummaryResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public int DiagramCount { get; init; }
    public int ScoredDiagramCount { get; init; }
    public int NeedsReviewCount { get; init; }
}

public sealed class DemoJourneySummaryResponse
{
    public Guid WorkspaceId { get; init; }
    public string WorkspaceName { get; init; } = string.Empty;
    public Guid DiagramId { get; init; }
    public string DiagramName { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string? ThumbnailUrl { get; init; }
    public decimal? Score { get; init; }
    public string AnalysisStatus { get; init; } = "Not run";
    public Guid? LatestRunId { get; init; }
    public int AdrCount { get; init; }
}
