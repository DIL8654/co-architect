namespace CoArchitect.Api.DTOs;

public sealed class ArchitectureDiagramResponse
{
    public Guid Id { get; init; }
    public Guid WorkspaceId { get; init; }
    public Guid UploadedByUserId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string OriginalFileName { get; init; } = string.Empty;
    public string? FileUrl { get; init; }
    public string? Description { get; init; }
    public DateTime UploadedAt { get; init; }
    public decimal? ArchitectureScore { get; init; }
    public DiagramReviewSetupResponse ReviewSetup { get; init; } = new();
}
