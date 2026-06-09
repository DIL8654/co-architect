using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class PostgresDiagramCommentRepository : IDiagramCommentRepository
{
    private const string Kind = "diagram-comment";
    private readonly IObjectStore _store;

    public PostgresDiagramCommentRepository(IObjectStore store)
    {
        _store = store;
    }

    public Task<DiagramComment?> GetByIdAsync(Guid commentId, CancellationToken cancellationToken)
    {
        return _store.GetAsync<DiagramComment>(Kind, commentId, cancellationToken);
    }

    public async Task<IEnumerable<DiagramComment>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        return await _store.GetByDiagramAsync<DiagramComment>(Kind, diagramId, cancellationToken);
    }

    public async Task<DiagramComment> AddAsync(DiagramComment comment, CancellationToken cancellationToken)
    {
        await _store.UpsertAsync(
            Kind,
            comment.Id,
            comment,
            null,
            null,
            comment.ArchitectureDiagramId,
            cancellationToken);

        return comment;
    }

    public Task DeleteAsync(Guid commentId, CancellationToken cancellationToken)
    {
        return _store.DeleteAsync(Kind, commentId, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
