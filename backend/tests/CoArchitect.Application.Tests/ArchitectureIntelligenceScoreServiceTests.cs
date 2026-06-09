using CoArchitect.Application.Services;
using CoArchitect.Domain.Enums;
using Xunit;

namespace CoArchitect.Application.Tests;

public class ArchitectureIntelligenceScoreServiceTests
{
    private readonly ArchitectureIntelligenceScoreService _service = new();

    [Fact]
    public async Task CalculateAsync_ReturnsEnterpriseReady_ForMaximumMaturity()
    {
        var input = Enum.GetValues<ArchitectureDimension>().ToDictionary(d => d, _ => 5);

        var result = await _service.CalculateAsync(input, CancellationToken.None);

        Assert.Equal(100, result.FinalScore);
        Assert.Equal(ScoreBand.EnterpriseReady, result.ScoreBand);
        Assert.Equal(8, result.DimensionBreakdown.Count);
    }

    [Fact]
    public async Task CalculateAsync_ReturnsHighRisk_ForZeroMaturity()
    {
        var input = Enum.GetValues<ArchitectureDimension>().ToDictionary(d => d, _ => 0);

        var result = await _service.CalculateAsync(input, CancellationToken.None);

        Assert.Equal(0, result.FinalScore);
        Assert.Equal(ScoreBand.HighRisk, result.ScoreBand);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(6)]
    public async Task CalculateAsync_ThrowsArgumentOutOfRange_ForInvalidMaturity(int maturity)
    {
        var input = Enum.GetValues<ArchitectureDimension>().ToDictionary(d => d, _ => 5);
        input[ArchitectureDimension.Security] = maturity;

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
            () => _service.CalculateAsync(input, CancellationToken.None));
    }

    [Fact]
    public async Task CalculateAsync_ThrowsArgumentException_WhenDimensionMissing()
    {
        var input = Enum.GetValues<ArchitectureDimension>().ToDictionary(d => d, _ => 4);
        input.Remove(ArchitectureDimension.CostOptimization);

        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CalculateAsync(input, CancellationToken.None));
    }
}
