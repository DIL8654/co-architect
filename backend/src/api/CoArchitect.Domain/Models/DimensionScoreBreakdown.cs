using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Models;

public sealed class DimensionScoreBreakdown
{
    public ArchitectureDimension Dimension { get; init; }
    public int Maturity { get; init; }
    public int Weight { get; init; }
    public double Contribution { get; init; }
}
