using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class PostgresOrganizationRepository : IOrganizationRepository
{
    private const string Kind = "organization";
    private readonly IObjectStore _store;

    public PostgresOrganizationRepository(IObjectStore store)
    {
        _store = store;
    }

    public Task<Organization?> GetByIdAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        return _store.GetAsync<Organization>(Kind, organizationId, cancellationToken);
    }

    public async Task<Organization?> GetBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        var organizations = await GetAllAsync(cancellationToken);
        return organizations.FirstOrDefault(organization =>
            string.Equals(organization.Name, slug, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<IEnumerable<Organization>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _store.GetAllAsync<Organization>(Kind, cancellationToken);
    }

    public async Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken)
    {
        var organization = await GetBySlugAsync(slug, cancellationToken);
        return organization is not null;
    }

    public async Task<Organization> AddAsync(Organization organization, CancellationToken cancellationToken)
    {
        await _store.UpsertAsync(
            Kind,
            organization.Id,
            organization,
            organization.Id,
            null,
            null,
            cancellationToken);

        return organization;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
