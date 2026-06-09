using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class PostgresDiagramRepository : IDiagramRepository
{
    private const string Kind = "diagram";
    private readonly IObjectStore _store;

    public PostgresDiagramRepository(IObjectStore store)
    {
        _store = store;
    }

    public Task<ArchitectureDiagram?> GetByIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        return _store.GetAsync<ArchitectureDiagram>(Kind, diagramId, cancellationToken);
    }

    public async Task<IEnumerable<ArchitectureDiagram>> GetByWorkspaceIdAsync(Guid workspaceId, CancellationToken cancellationToken)
    {
        return await _store.GetByWorkspaceAsync<ArchitectureDiagram>(Kind, workspaceId, cancellationToken);
    }

    public async Task<IEnumerable<ArchitectureDiagram>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _store.GetAllAsync<ArchitectureDiagram>(Kind, cancellationToken);
    }

    public async Task<ArchitectureDiagram> AddAsync(ArchitectureDiagram diagram, CancellationToken cancellationToken)
    {
        await UpdateAsync(diagram, cancellationToken);
        return diagram;
    }

    public Task UpdateAsync(ArchitectureDiagram diagram, CancellationToken cancellationToken)
    {
        return _store.UpsertAsync(
            Kind,
            diagram.Id,
            diagram,
            null,
            diagram.WorkspaceId,
            diagram.Id,
            cancellationToken);
    }

    public Task DeleteAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        return _store.DeleteAsync(Kind, diagramId, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
