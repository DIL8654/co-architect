namespace CoArchitect.Infrastructure.Repositories;

using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Seeding;

public sealed class MockDiagramRepository : IDiagramRepository
{
    private static readonly Dictionary<Guid, ArchitectureDiagram> _diagrams = DemoDataGenerator.Diagrams.ToDictionary(diagram => diagram.Id);
    private static readonly object _lock = new();

    public Task<ArchitectureDiagram?> GetByIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _diagrams.TryGetValue(diagramId, out var diagram);
            return Task.FromResult(diagram);
        }
    }

    public Task<IEnumerable<ArchitectureDiagram>> GetByWorkspaceIdAsync(Guid workspaceId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            var diagrams = _diagrams.Values.Where(d => d.WorkspaceId == workspaceId).ToList();
            return Task.FromResult(diagrams.AsEnumerable());
        }
    }

    public Task<IEnumerable<ArchitectureDiagram>> GetAllAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            return Task.FromResult(_diagrams.Values.AsEnumerable());
        }
    }

    public Task<ArchitectureDiagram> AddAsync(ArchitectureDiagram diagram, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _diagrams[diagram.Id] = diagram;
            return Task.FromResult(diagram);
        }
    }

    public Task UpdateAsync(ArchitectureDiagram diagram, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _diagrams[diagram.Id] = diagram;
            return Task.CompletedTask;
        }
    }

    public Task DeleteAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _diagrams.Remove(diagramId);
            return Task.CompletedTask;
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.CompletedTask;
    }
}
