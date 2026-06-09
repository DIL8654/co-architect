namespace CoArchitect.Infrastructure.Repositories;

using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Seeding;

public sealed class MockOrganizationRepository : IOrganizationRepository
{
    private static readonly Dictionary<Guid, Organization> _organizations = DemoDataGenerator.Organizations.ToDictionary(organization => organization.Id);
    private static readonly object _lock = new();

    public Task<Organization?> GetByIdAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        lock (_lock)
        {
            _organizations.TryGetValue(organizationId, out var org);
            return Task.FromResult(org);
        }
    }

    public Task<Organization?> GetBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        lock (_lock)
        {
            var org = _organizations.Values.FirstOrDefault(o => o.Name.ToLower() == slug.ToLower());
            return Task.FromResult(org);
        }
    }

    public Task<IEnumerable<Organization>> GetAllAsync(CancellationToken cancellationToken)
    {
        lock (_lock)
        {
            return Task.FromResult(_organizations.Values.AsEnumerable());
        }
    }

    public Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken)
    {
        lock (_lock)
        {
            return Task.FromResult(_organizations.Values.Any(o => o.Name.ToLower() == slug.ToLower()));
        }
    }

    public Task<Organization> AddAsync(Organization organization, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _organizations[organization.Id] = organization;
            return Task.FromResult(organization);
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.CompletedTask;
    }
}
