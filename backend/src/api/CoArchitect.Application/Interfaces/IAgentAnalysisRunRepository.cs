namespace CoArchitect.Application.Interfaces;

public interface IAgentAnalysisRunRepository
{
    Task<Domain.Entities.AgentAnalysisRun?> GetByIdAsync(Guid runId, CancellationToken cancellationToken);
    Task<Domain.Entities.AgentAnalysisRun?> GetLatestByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken);
    Task<IDictionary<Guid, Domain.Entities.AgentAnalysisRun>> GetLatestByDiagramIdsAsync(IEnumerable<Guid> diagramIds, CancellationToken cancellationToken);
    Task<IEnumerable<Domain.Entities.AgentAnalysisRun>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken);
    Task<Domain.Entities.AgentAnalysisRun> AddAsync(Domain.Entities.AgentAnalysisRun run, CancellationToken cancellationToken);
    Task UpdateAsync(Domain.Entities.AgentAnalysisRun run, CancellationToken cancellationToken);
    Task DeleteByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
