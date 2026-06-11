namespace CoArchitect.Domain.Models;

public sealed class WorkspaceMemorySnapshot
{
    public IList<string> PreviousReviewSummaries { get; init; } = new List<string>();
    public IList<string> RecurringFindings { get; init; } = new List<string>();
    public IList<string> PriorRecommendations { get; init; } = new List<string>();
    public IList<string> RecentComments { get; init; } = new List<string>();
    public IList<string> AdrHistory { get; init; } = new List<string>();
    public string ArchitectureEvolutionSummary { get; init; } = string.Empty;
}
