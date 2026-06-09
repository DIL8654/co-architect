namespace CoArchitect.Infrastructure.Repositories;

using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Seeding;

public sealed class MockWorkspaceRepository : IWorkspaceRepository
{
    private static readonly Dictionary<Guid, Workspace> _workspaces = DemoDataGenerator.Workspaces.ToDictionary(workspace => workspace.Id);
    private static readonly object _lock = new();

    public Task<Workspace?> GetByIdAsync(Guid workspaceId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _workspaces.TryGetValue(workspaceId, out var workspace);
            return Task.FromResult(workspace);
        }
    }

    public Task<IEnumerable<Workspace>> GetByOrganizationIdAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            var workspaces = _workspaces.Values.Where(w => w.OrganizationId == organizationId).ToList();
            return Task.FromResult(workspaces.AsEnumerable());
        }
    }

    public Task<IEnumerable<Workspace>> GetAllAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            return Task.FromResult(_workspaces.Values.AsEnumerable());
        }
    }

    public Task<Workspace> AddAsync(Workspace workspace, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _workspaces[workspace.Id] = workspace;
            return Task.FromResult(workspace);
        }
    }

    public Task UpdateAsync(Workspace workspace, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _workspaces[workspace.Id] = workspace;
            return Task.CompletedTask;
        }
    }

    public Task DeleteAsync(Guid workspaceId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _workspaces.Remove(workspaceId);
            return Task.CompletedTask;
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.CompletedTask;
    }
}
