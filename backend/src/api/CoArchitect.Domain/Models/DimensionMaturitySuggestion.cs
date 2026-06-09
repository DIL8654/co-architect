using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Models;

public sealed class DimensionMaturitySuggestion
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public ArchitectureDimension Dimension { get; init; }
    public int CurrentMaturity { get; init; }
    public int SuggestedMaturity { get; init; }
    public string Reason { get; init; } = string.Empty;
}
