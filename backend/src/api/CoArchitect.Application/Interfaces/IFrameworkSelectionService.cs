using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Interfaces;

public interface IFrameworkSelectionService
{
    FrameworkSelectionResult Select(
        string? architectureDescription,
        ArchitectureReviewContext reviewContext,
        FrameworkSelectionMode mode,
        IEnumerable<ReviewFramework> requestedFrameworks,
        IEnumerable<ReviewStandard> requestedStandards,
        IEnumerable<QualityAttributeWeight> qualityAttributeWeights);

    IReadOnlyList<QualityAttributeWeight> GetDefaultWeights();
}
