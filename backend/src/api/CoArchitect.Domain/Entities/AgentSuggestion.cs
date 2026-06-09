using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Entities;

public sealed class AgentSuggestion
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AnalysisRunId { get; init; }
    public ArchitectureDimension Dimension { get; init; }
    public SuggestionSeverity Severity { get; init; } = SuggestionSeverity.Medium;
    public string Message { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public AgentAnalysisRun? AnalysisRun { get; init; }
}
