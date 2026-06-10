using CoArchitect.Domain.Entities;

namespace CoArchitect.Application.Interfaces;

public interface IAdrGenerationService
{
    Task<AdrVersion> GenerateAsync(
        Guid adrId,
        int versionNumber,
        ArchitectureDiagram diagram,
        AgentAnalysisRun? analysis,
        IEnumerable<DiagramComment> comments,
        Guid createdByUserId,
        CancellationToken cancellationToken);
}
