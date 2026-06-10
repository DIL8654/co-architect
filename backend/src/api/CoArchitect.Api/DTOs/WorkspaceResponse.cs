namespace CoArchitect.Api.DTOs;

public sealed class WorkspaceResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public int DiagramCount { get; init; }
}
