namespace CoArchitect.Api.DTOs;

public sealed class CreateWorkspaceRequest
{
    public Guid OrganizationId { get; init; }
    public string Name { get; init; } = string.Empty;
}
