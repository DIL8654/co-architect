using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Interfaces;

public interface IMultiAgentArchitectureAnalysisService
{
    Task<AgentAnalysisResult> AnalyzeAsync(ArchitectureDiagram diagram, CancellationToken cancellationToken);
}
