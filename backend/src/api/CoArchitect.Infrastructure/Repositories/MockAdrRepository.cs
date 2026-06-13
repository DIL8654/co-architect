using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class MockAdrRepository : IAdrRepository
{
    private static readonly Dictionary<Guid, Adr> _adrs = new();
    private static readonly Dictionary<Guid, List<AdrVersion>> _versions = new();
    private static readonly object _lock = new();

    public Task<Adr?> GetByIdAsync(Guid adrId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            _adrs.TryGetValue(adrId, out var adr);
            return Task.FromResult(adr);
        }
    }

    public Task<IEnumerable<Adr>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            return Task.FromResult(_adrs.Values.Where(item => item.ArchitectureDiagramId == diagramId).OrderByDescending(item => item.UpdatedAt).AsEnumerable());
        }
    }

    public Task<IDictionary<Guid, int>> GetCountsByDiagramIdsAsync(IEnumerable<Guid> diagramIds, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var diagramIdSet = diagramIds.ToHashSet();

        lock (_lock)
        {
            IDictionary<Guid, int> counts = _adrs.Values
                .Where(item => diagramIdSet.Contains(item.ArchitectureDiagramId))
                .GroupBy(item => item.ArchitectureDiagramId)
                .ToDictionary(group => group.Key, group => group.Count());

            return Task.FromResult(counts);
        }
    }

    public Task<AdrVersion?> GetLatestVersionAsync(Guid adrId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            _versions.TryGetValue(adrId, out var versions);
            return Task.FromResult(versions?.OrderByDescending(item => item.VersionNumber).FirstOrDefault());
        }
    }

    public Task<IEnumerable<AdrVersion>> GetVersionsAsync(Guid adrId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            _versions.TryGetValue(adrId, out var versions);
            return Task.FromResult((versions ?? []).OrderByDescending(item => item.VersionNumber).AsEnumerable());
        }
    }

    public Task<Adr> AddAsync(Adr adr, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            _adrs[adr.Id] = adr;
            return Task.FromResult(adr);
        }
    }

    public Task UpdateAsync(Adr adr, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            _adrs[adr.Id] = adr;
            return Task.CompletedTask;
        }
    }

    public Task<AdrVersion> AddVersionAsync(AdrVersion version, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            if (!_versions.TryGetValue(version.AdrId, out var versions))
            {
                versions = [];
                _versions[version.AdrId] = versions;
            }

            versions.RemoveAll(item => item.Id == version.Id);
            versions.Add(version);
            return Task.FromResult(version);
        }
    }

    public Task DeleteAsync(Guid adrId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            _adrs.Remove(adrId);
            _versions.Remove(adrId);
            return Task.CompletedTask;
        }
    }

    public Task DeleteByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_lock)
        {
            var ids = _adrs.Values.Where(item => item.ArchitectureDiagramId == diagramId).Select(item => item.Id).ToList();
            foreach (var id in ids)
            {
                _adrs.Remove(id);
                _versions.Remove(id);
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
