using CoArchitect.Domain.Entities;

namespace CoArchitect.Application.Interfaces;

public interface IAdrRepository
{
    Task<Adr?> GetByIdAsync(Guid adrId, CancellationToken cancellationToken);
    Task<IEnumerable<Adr>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken);
    Task<AdrVersion?> GetLatestVersionAsync(Guid adrId, CancellationToken cancellationToken);
    Task<IEnumerable<AdrVersion>> GetVersionsAsync(Guid adrId, CancellationToken cancellationToken);
    Task<Adr> AddAsync(Adr adr, CancellationToken cancellationToken);
    Task UpdateAsync(Adr adr, CancellationToken cancellationToken);
    Task<AdrVersion> AddVersionAsync(AdrVersion version, CancellationToken cancellationToken);
    Task DeleteAsync(Guid adrId, CancellationToken cancellationToken);
    Task DeleteByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
