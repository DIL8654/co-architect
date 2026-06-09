namespace CoArchitect.Application.Interfaces;

public interface IDiagramCommentRepository
{
    Task<Domain.Entities.DiagramComment?> GetByIdAsync(Guid commentId, CancellationToken cancellationToken);
    Task<IEnumerable<Domain.Entities.DiagramComment>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken);
    Task<Domain.Entities.DiagramComment> AddAsync(Domain.Entities.DiagramComment comment, CancellationToken cancellationToken);
    Task DeleteAsync(Guid commentId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
