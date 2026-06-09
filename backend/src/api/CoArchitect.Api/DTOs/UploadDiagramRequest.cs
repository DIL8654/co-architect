namespace CoArchitect.Api.DTOs;

public sealed class UploadDiagramRequest
{
    public Guid WorkspaceId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public IFormFile? File { get; init; }
}
