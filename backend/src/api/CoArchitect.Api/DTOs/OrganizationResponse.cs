namespace CoArchitect.Api.DTOs;

public sealed class OrganizationResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public int MemberCount { get; init; }
}
