namespace CoArchitect.Infrastructure.Repositories;

using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;

public sealed class MockDiagramCommentRepository : IDiagramCommentRepository
{
    private static readonly Dictionary<Guid, DiagramComment> _comments = new();
    private static readonly object _lock = new();

    public Task<DiagramComment?> GetByIdAsync(Guid commentId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _comments.TryGetValue(commentId, out var comment);
            return Task.FromResult(comment);
        }
    }

    public Task<IEnumerable<DiagramComment>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            var comments = _comments.Values.Where(c => c.ArchitectureDiagramId == diagramId).OrderByDescending(c => c.CreatedAt).ToList();
            return Task.FromResult(comments.AsEnumerable());
        }
    }

    public Task<DiagramComment> AddAsync(DiagramComment comment, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _comments[comment.Id] = comment;
            return Task.FromResult(comment);
        }
    }

    public Task DeleteAsync(Guid commentId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _comments.Remove(commentId);
            return Task.CompletedTask;
        }
    }

    public Task DeleteByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            var ids = _comments.Values
                .Where(comment => comment.ArchitectureDiagramId == diagramId)
                .Select(comment => comment.Id)
                .ToList();

            foreach (var id in ids)
            {
                _comments.Remove(id);
            }

            return Task.CompletedTask;
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.CompletedTask;
    }
}
