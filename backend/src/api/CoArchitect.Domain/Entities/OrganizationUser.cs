using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Entities;

public sealed class OrganizationUser
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid OrganizationId { get; init; }
    public Guid UserId { get; init; }
    public Guid AddedByUserId { get; init; }
    public OrganizationRole Role { get; init; }
    public DateTime JoinedAt { get; init; } = DateTime.UtcNow;
    public Organization? Organization { get; init; }
    public User? User { get; init; }
}
