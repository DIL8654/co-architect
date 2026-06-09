namespace CoArchitect.Api.DTOs;

public sealed class CreateOrganizationRequest
{
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
}
