using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Models;

public sealed class AgentAnalysisResult
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ArchitectureDiagramId { get; init; }
    public DateTime RequestedAt { get; init; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; init; }
    public IList<EvidenceItem> Evidence { get; init; } = new List<EvidenceItem>();
    public IList<MissingControl> MissingControls { get; init; } = new List<MissingControl>();
    public IList<Recommendation> Recommendations { get; init; } = new List<Recommendation>();
    public IList<Tradeoff> Tradeoffs { get; init; } = new List<Tradeoff>();
    public IList<DimensionMaturitySuggestion> DimensionMaturitySuggestions { get; init; } = new List<DimensionMaturitySuggestion>();
}
