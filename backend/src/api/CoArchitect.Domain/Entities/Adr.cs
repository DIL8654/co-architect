namespace CoArchitect.Domain.Entities;

public sealed class Adr
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid WorkspaceId { get; init; }
    public Guid ArchitectureDiagramId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Status { get; init; } = "Draft";
    public int LatestVersionNumber { get; init; }
    public Guid CreatedByUserId { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;
}
