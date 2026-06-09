namespace CoArchitect.Application.Interfaces;

public interface IOrganizationRepository
{
    Task<Domain.Entities.Organization?> GetByIdAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<Domain.Entities.Organization?> GetBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<IEnumerable<Domain.Entities.Organization>> GetAllAsync(CancellationToken cancellationToken);
    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken);
    Task<Domain.Entities.Organization> AddAsync(Domain.Entities.Organization organization, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
