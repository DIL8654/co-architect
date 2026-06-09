using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Models;

public sealed class ArchitectureScoreResult
{
    public double FinalScore { get; init; }
    public ScoreBand ScoreBand { get; init; }
    public IReadOnlyList<DimensionScoreBreakdown> DimensionBreakdown { get; init; } = Array.Empty<DimensionScoreBreakdown>();
}
