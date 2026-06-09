using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Interfaces;

public interface IArchitectureAnalyzer
{
    // Intentionally minimal: business implementation will be added later.
    Task<IEnumerable<ArchitecturalComponent>> AnalyzeAsync(CancellationToken cancellationToken);
}
