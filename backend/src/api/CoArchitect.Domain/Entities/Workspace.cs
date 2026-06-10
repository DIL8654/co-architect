namespace CoArchitect.Domain.Entities;

public sealed class Workspace
{
    private readonly Guid _tenantId;

    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid TenantId
    {
        get => _tenantId;
        init => _tenantId = value;
    }

    [Obsolete("OrganizationId is an internal compatibility alias. Use TenantId instead.")]
    public Guid OrganizationId
    {
        get => _tenantId;
        init => _tenantId = value;
    }

    public string Name { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;
    public IList<ArchitectureDiagram> Diagrams { get; init; } = new List<ArchitectureDiagram>();
    public Organization? Organization { get; init; }
}
