using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Models;

public sealed class MissingControl
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public ArchitectureDimension Dimension { get; init; }
}
