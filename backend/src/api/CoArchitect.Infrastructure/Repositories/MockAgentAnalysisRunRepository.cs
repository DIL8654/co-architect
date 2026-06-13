namespace CoArchitect.Infrastructure.Repositories;

using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;

public sealed class MockAgentAnalysisRunRepository : IAgentAnalysisRunRepository
{
    private static readonly Dictionary<Guid, AgentAnalysisRun> _runs = new();
    private static readonly object _lock = new();

    public Task<AgentAnalysisRun?> GetByIdAsync(Guid runId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _runs.TryGetValue(runId, out var run);
            return Task.FromResult(run);
        }
    }

    public Task<AgentAnalysisRun?> GetLatestByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            var run = _runs.Values
                .Where(r => r.ArchitectureDiagramId == diagramId)
                .OrderByDescending(r => r.RequestedAt)
                .FirstOrDefault();
            return Task.FromResult(run);
        }
    }

    public Task<IDictionary<Guid, AgentAnalysisRun>> GetLatestByDiagramIdsAsync(IEnumerable<Guid> diagramIds, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var diagramIdSet = diagramIds.ToHashSet();

        lock (_lock)
        {
            IDictionary<Guid, AgentAnalysisRun> runs = _runs.Values
                .Where(r => diagramIdSet.Contains(r.ArchitectureDiagramId))
                .GroupBy(r => r.ArchitectureDiagramId)
                .ToDictionary(
                    group => group.Key,
                    group => group.OrderByDescending(run => run.RequestedAt).First());

            return Task.FromResult(runs);
        }
    }

    public Task<IEnumerable<AgentAnalysisRun>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            var runs = _runs.Values.Where(r => r.ArchitectureDiagramId == diagramId).OrderByDescending(r => r.RequestedAt).ToList();
            return Task.FromResult(runs.AsEnumerable());
        }
    }

    public Task<AgentAnalysisRun> AddAsync(AgentAnalysisRun run, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _runs[run.Id] = run;
            return Task.FromResult(run);
        }
    }

    public Task UpdateAsync(AgentAnalysisRun run, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            _runs[run.Id] = run;
            return Task.CompletedTask;
        }
    }

    public Task DeleteByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_lock)
        {
            var ids = _runs.Values
                .Where(run => run.ArchitectureDiagramId == diagramId)
                .Select(run => run.Id)
                .ToList();

            foreach (var id in ids)
            {
                _runs.Remove(id);
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
