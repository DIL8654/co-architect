namespace CoArchitect.Application.Interfaces;

public interface IWorkspaceRepository
{
    Task<Domain.Entities.Workspace?> GetByIdAsync(Guid workspaceId, CancellationToken cancellationToken);
    Task<IEnumerable<Domain.Entities.Workspace>> GetByOrganizationIdAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<IEnumerable<Domain.Entities.Workspace>> GetAllAsync(CancellationToken cancellationToken);
    Task<Domain.Entities.Workspace> AddAsync(Domain.Entities.Workspace workspace, CancellationToken cancellationToken);
    Task UpdateAsync(Domain.Entities.Workspace workspace, CancellationToken cancellationToken);
    Task DeleteAsync(Guid workspaceId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
