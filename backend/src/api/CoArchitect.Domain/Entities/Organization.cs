using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Entities;

public sealed class Organization
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Name { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;
    public IList<OrganizationUser> Members { get; init; } = new List<OrganizationUser>();
    public IList<Workspace> Workspaces { get; init; } = new List<Workspace>();
}
