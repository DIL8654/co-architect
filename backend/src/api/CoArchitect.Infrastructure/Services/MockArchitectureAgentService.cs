using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Seeding;

namespace CoArchitect.Infrastructure.Services;

public sealed class MockArchitectureAgentService : IArchitectureAnalyzer, IArchitectureAgentService
{
    public Task<IEnumerable<ArchitecturalComponent>> AnalyzeAsync(CancellationToken cancellationToken)
    {
        // Placeholder implementation for local development. Real AI integration will be added later.
        var list = new List<ArchitecturalComponent>();
        return Task.FromResult<IEnumerable<ArchitecturalComponent>>(list);
    }

    public Task<AgentAnalysisResult> AnalyzeAsync(Guid architectureDiagramId, string diagramContent, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var result = DemoDataGenerator.CreateAnalysisResult(architectureDiagramId, diagramContent);
        return Task.FromResult(result);
    }
}
