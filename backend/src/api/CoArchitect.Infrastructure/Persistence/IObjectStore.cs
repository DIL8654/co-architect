namespace CoArchitect.Infrastructure.Persistence;

public interface IObjectStore
{
    Task<T?> GetAsync<T>(string kind, Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<T>> GetAllAsync<T>(string kind, CancellationToken cancellationToken);
    Task<IReadOnlyList<T>> GetByOrganizationAsync<T>(string kind, Guid organizationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<T>> GetByWorkspaceAsync<T>(string kind, Guid workspaceId, CancellationToken cancellationToken);
    Task<IReadOnlyList<T>> GetByDiagramAsync<T>(string kind, Guid diagramId, CancellationToken cancellationToken);
    Task UpsertAsync<T>(string kind, Guid id, T value, Guid? organizationId, Guid? workspaceId, Guid? diagramId, CancellationToken cancellationToken);
    Task DeleteAsync(string kind, Guid id, CancellationToken cancellationToken);
}
