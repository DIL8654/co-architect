using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class PostgresWorkspaceRepository : IWorkspaceRepository
{
    private const string Kind = "workspace";
    private readonly IObjectStore _store;

    public PostgresWorkspaceRepository(IObjectStore store)
    {
        _store = store;
    }

    public Task<Workspace?> GetByIdAsync(Guid workspaceId, CancellationToken cancellationToken)
    {
        return _store.GetAsync<Workspace>(Kind, workspaceId, cancellationToken);
    }

    public async Task<IEnumerable<Workspace>> GetByOrganizationIdAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        return await _store.GetByOrganizationAsync<Workspace>(Kind, organizationId, cancellationToken);
    }

    public async Task<IEnumerable<Workspace>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _store.GetAllAsync<Workspace>(Kind, cancellationToken);
    }

    public async Task<Workspace> AddAsync(Workspace workspace, CancellationToken cancellationToken)
    {
        await UpdateAsync(workspace, cancellationToken);
        return workspace;
    }

    public Task UpdateAsync(Workspace workspace, CancellationToken cancellationToken)
    {
        return _store.UpsertAsync(
            Kind,
            workspace.Id,
            workspace,
            workspace.OrganizationId,
            workspace.Id,
            null,
            cancellationToken);
    }

    public Task DeleteAsync(Guid workspaceId, CancellationToken cancellationToken)
    {
        return _store.DeleteAsync(Kind, workspaceId, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
