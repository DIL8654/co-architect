using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Interfaces;

public interface IArchitectureIntelligenceScoreService
{
    Task<ArchitectureScoreResult> CalculateAsync(
        IReadOnlyDictionary<ArchitectureDimension, int> maturityByDimension,
        CancellationToken cancellationToken);
}
