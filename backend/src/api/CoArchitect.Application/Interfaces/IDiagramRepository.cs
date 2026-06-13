namespace CoArchitect.Application.Interfaces;

public interface IDiagramRepository
{
    Task<Domain.Entities.ArchitectureDiagram?> GetByIdAsync(Guid diagramId, CancellationToken cancellationToken);
    Task<IEnumerable<Domain.Entities.ArchitectureDiagram>> GetByWorkspaceIdAsync(Guid workspaceId, CancellationToken cancellationToken);
    Task<IEnumerable<Domain.Entities.ArchitectureDiagram>> GetByWorkspaceIdsAsync(IEnumerable<Guid> workspaceIds, CancellationToken cancellationToken);
    Task<IDictionary<Guid, int>> GetDiagramCountsByWorkspaceIdsAsync(IEnumerable<Guid> workspaceIds, CancellationToken cancellationToken);
    Task<IEnumerable<Domain.Entities.ArchitectureDiagram>> GetAllAsync(CancellationToken cancellationToken);
    Task<Domain.Entities.ArchitectureDiagram> AddAsync(Domain.Entities.ArchitectureDiagram diagram, CancellationToken cancellationToken);
    Task UpdateAsync(Domain.Entities.ArchitectureDiagram diagram, CancellationToken cancellationToken);
    Task DeleteAsync(Guid diagramId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
