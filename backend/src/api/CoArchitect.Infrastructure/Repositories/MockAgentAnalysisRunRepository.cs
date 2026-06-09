namespace CoArchitect.Infrastructure.Repositories;

using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Seeding;

public sealed class MockAgentAnalysisRunRepository : IAgentAnalysisRunRepository
{
    private static readonly Dictionary<Guid, AgentAnalysisRun> _runs = DemoDataGenerator.AnalysisRuns.ToDictionary(run => run.Id);
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

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.CompletedTask;
    }
}
