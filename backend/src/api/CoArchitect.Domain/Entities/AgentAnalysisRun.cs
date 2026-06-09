using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Entities;

public sealed class AgentAnalysisRun
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid WorkspaceId { get; init; }
    public Guid ArchitectureDiagramId { get; init; }
    public AnalysisRunStatus Status { get; init; } = AnalysisRunStatus.Pending;
    public DateTime RequestedAt { get; init; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? ReportPath { get; init; }
    public IList<AgentSuggestion> Suggestions { get; init; } = new List<AgentSuggestion>();
    public Workspace? Workspace { get; init; }
    public ArchitectureDiagram? ArchitectureDiagram { get; init; }
}
