using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Models;

public sealed class AgentAnalysisResult
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ArchitectureDiagramId { get; init; }
    public DateTime RequestedAt { get; init; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; init; }
    public string ExecutiveSummary { get; init; } = string.Empty;
    public FrameworkSelectionResult ResolvedFrameworkSelection { get; init; } = new();
    public IList<QualityAttributeWeight> ResolvedQualityAttributeWeights { get; init; } = new List<QualityAttributeWeight>();
    public IList<string> OpenQuestions { get; init; } = new List<string>();
    public IList<string> CriticNotes { get; init; } = new List<string>();
    public IList<AgentExecutionTrace> AgentTrace { get; init; } = new List<AgentExecutionTrace>();
    public IList<EvidenceItem> Evidence { get; init; } = new List<EvidenceItem>();
    public IList<MissingControl> MissingControls { get; init; } = new List<MissingControl>();
    public IList<Recommendation> Recommendations { get; init; } = new List<Recommendation>();
    public IList<Tradeoff> Tradeoffs { get; init; } = new List<Tradeoff>();
    public IList<DimensionMaturitySuggestion> DimensionMaturitySuggestions { get; init; } = new List<DimensionMaturitySuggestion>();
}
