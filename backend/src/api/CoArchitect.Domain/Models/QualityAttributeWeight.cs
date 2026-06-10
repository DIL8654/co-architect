namespace CoArchitect.Domain.Models;

public sealed class QualityAttributeWeight
{
    public string Key { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public int Weight { get; init; }
}
