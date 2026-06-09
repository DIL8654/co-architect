using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Services;

public sealed class ArchitectureIntelligenceScoreService : IArchitectureIntelligenceScoreService
{
    private static readonly IReadOnlyDictionary<ArchitectureDimension, int> DimensionWeights = new Dictionary<ArchitectureDimension, int>
    {
        [ArchitectureDimension.Security] = 20,
        [ArchitectureDimension.ReliabilityAvailability] = 18,
        [ArchitectureDimension.ScalabilityPerformance] = 15,
        [ArchitectureDimension.OperationalExcellence] = 15,
        [ArchitectureDimension.DataTenantIsolation] = 12,
        [ArchitectureDimension.ComplianceGovernance] = 10,
        [ArchitectureDimension.CostOptimization] = 5,
        [ArchitectureDimension.Maintainability] = 5
    };

    public Task<ArchitectureScoreResult> CalculateAsync(
        IReadOnlyDictionary<ArchitectureDimension, int> maturityByDimension,
        CancellationToken cancellationToken)
    {
        if (maturityByDimension is null)
        {
            throw new ArgumentNullException(nameof(maturityByDimension));
        }

        cancellationToken.ThrowIfCancellationRequested();

        var missingDimensions = DimensionWeights.Keys.Except(maturityByDimension.Keys).ToList();
        if (missingDimensions.Any())
        {
            throw new ArgumentException($"Missing maturity values for dimensions: {string.Join(", ", missingDimensions)}.", nameof(maturityByDimension));
        }

        var breakdown = new List<DimensionScoreBreakdown>(DimensionWeights.Count);
        double finalScore = 0;

        foreach (var (dimension, weight) in DimensionWeights)
        {
            var maturity = maturityByDimension[dimension];
            ValidateMaturity(dimension, maturity);

            var contribution = (maturity / 5.0) * weight;
            finalScore += contribution;

            breakdown.Add(new DimensionScoreBreakdown
            {
                Dimension = dimension,
                Maturity = maturity,
                Weight = weight,
                Contribution = Math.Round(contribution, 2)
            });
        }

        var scoreBand = DetermineScoreBand(finalScore);

        var result = new ArchitectureScoreResult
        {
            FinalScore = Math.Round(finalScore, 2),
            ScoreBand = scoreBand,
            DimensionBreakdown = breakdown
        };

        return Task.FromResult(result);
    }

    private static void ValidateMaturity(ArchitectureDimension dimension, int maturity)
    {
        if (maturity < 0 || maturity > 5)
        {
            throw new ArgumentOutOfRangeException(nameof(maturity), maturity, $"Maturity for {dimension} must be between 0 and 5.");
        }
    }

    private static ScoreBand DetermineScoreBand(double finalScore)
    {
        if (finalScore <= 30)
        {
            return ScoreBand.HighRisk;
        }

        if (finalScore <= 50)
        {
            return ScoreBand.EarlyMvp;
        }

        if (finalScore <= 70)
        {
            return ScoreBand.ProductionCandidate;
        }

        if (finalScore <= 85)
        {
            return ScoreBand.ProductionReady;
        }

        return ScoreBand.EnterpriseReady;
    }
}
