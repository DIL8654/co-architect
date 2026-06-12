namespace CoArchitect.Domain.Models;

public sealed class FoundryIqQuery
{
    public Guid WorkspaceId { get; init; }
    public Guid DiagramId { get; init; }
    public string DiagramName { get; init; } = string.Empty;
    public string ArchitectureDescription { get; init; } = string.Empty;
    public string AnalysisPurpose { get; init; } = "Architecture review";
    public ArchitectureReviewContext ReviewContext { get; init; } = new();
    public IList<QualityAttributeWeight> QualityAttributeWeights { get; init; } = new List<QualityAttributeWeight>();
    public IList<string> SuggestedFrameworks { get; init; } = new List<string>();
    public IList<string> SuggestedStandards { get; init; } = new List<string>();
}
