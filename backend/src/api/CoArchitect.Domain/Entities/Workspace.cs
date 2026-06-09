namespace CoArchitect.Domain.Entities;

public sealed class Workspace
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid OrganizationId { get; init; }
    public string Name { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;
    public IList<ArchitectureDiagram> Diagrams { get; init; } = new List<ArchitectureDiagram>();
    public Organization? Organization { get; init; }
}
