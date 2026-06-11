using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Interfaces;

public interface IContextEnrichmentAgent
{
    Task<ContextEnrichmentResult> EnrichAsync(
        ArchitectureDiagram diagram,
        IReadOnlyCollection<ReviewFramework> selectedFrameworks,
        IReadOnlyCollection<QualityAttributeWeight> effectiveWeights,
        CancellationToken cancellationToken);
}
