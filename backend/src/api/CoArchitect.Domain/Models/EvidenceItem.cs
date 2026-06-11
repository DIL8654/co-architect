namespace CoArchitect.Domain.Models;

public sealed class EvidenceItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Summary { get; init; } = string.Empty;
    public string? Details { get; init; }
    public GroundingReferenceSet Grounding { get; init; } = new();
}
