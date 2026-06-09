namespace CoArchitect.Domain.Entities;

public sealed class DiagramComment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ArchitectureDiagramId { get; init; }
    public Guid UserId { get; init; }
    public string Content { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;
    public ArchitectureDiagram? ArchitectureDiagram { get; init; }
}
