using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class PostgresAgentAnalysisRunRepository : IAgentAnalysisRunRepository
{
    private const string Kind = "analysis-run";
    private readonly IObjectStore _store;

    public PostgresAgentAnalysisRunRepository(IObjectStore store)
    {
        _store = store;
    }

    public Task<AgentAnalysisRun?> GetByIdAsync(Guid runId, CancellationToken cancellationToken)
    {
        return _store.GetAsync<AgentAnalysisRun>(Kind, runId, cancellationToken);
    }

    public async Task<AgentAnalysisRun?> GetLatestByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        var runs = await GetByDiagramIdAsync(diagramId, cancellationToken);
        return runs.OrderByDescending(run => run.RequestedAt).FirstOrDefault();
    }

    public async Task<IEnumerable<AgentAnalysisRun>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        return await _store.GetByDiagramAsync<AgentAnalysisRun>(Kind, diagramId, cancellationToken);
    }

    public async Task<AgentAnalysisRun> AddAsync(AgentAnalysisRun run, CancellationToken cancellationToken)
    {
        await UpdateAsync(run, cancellationToken);
        return run;
    }

    public Task UpdateAsync(AgentAnalysisRun run, CancellationToken cancellationToken)
    {
        return _store.UpsertAsync(
            Kind,
            run.Id,
            run,
            null,
            run.WorkspaceId,
            run.ArchitectureDiagramId,
            cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
