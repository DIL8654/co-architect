using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Interfaces;

public interface IArchitectureAgentService
{
    Task<AgentAnalysisResult> AnalyzeAsync(
        Guid architectureDiagramId,
        string diagramContent,
        CancellationToken cancellationToken);
}
