namespace CoArchitect.Domain.Entities;

public sealed class ArchitectureDiagram
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid WorkspaceId { get; init; }
    public Guid UploadedByUserId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string OriginalFileName { get; init; } = string.Empty;
    public string? FileUrl { get; init; }
    public string? Description { get; init; }
    public DateTime UploadedAt { get; init; } = DateTime.UtcNow;
    public IList<DiagramComment> Comments { get; init; } = new List<DiagramComment>();
    public IList<AgentAnalysisRun> AnalysisRuns { get; init; } = new List<AgentAnalysisRun>();
    public Workspace? Workspace { get; init; }
}
