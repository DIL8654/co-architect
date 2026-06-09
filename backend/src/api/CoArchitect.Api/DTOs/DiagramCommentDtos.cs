namespace CoArchitect.Api.DTOs;

public sealed class DiagramCommentResponse
{
    public Guid Id { get; init; }
    public Guid DiagramId { get; init; }
    public Guid UserId { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public sealed class CreateCommentRequest
{
    public Guid DiagramId { get; init; }
    public string Content { get; init; } = string.Empty;
}
