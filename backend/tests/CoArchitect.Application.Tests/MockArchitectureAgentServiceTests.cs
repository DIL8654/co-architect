using CoArchitect.Infrastructure.Services;
using Xunit;

namespace CoArchitect.Application.Tests;

public class MockArchitectureAgentServiceTests
{
    private readonly MockArchitectureAgentService _service = new();

    [Fact]
    public async Task AnalyzeAsync_ReturnsResult_ForAnyDiagram()
    {
        var diagramId = Guid.NewGuid();
        var content = "Simple web app with load balancer, two app servers, and a database";

        var result = await _service.AnalyzeAsync(diagramId, content, CancellationToken.None);

        Assert.NotNull(result);
        Assert.NotNull(result.DimensionMaturitySuggestions);
        Assert.NotEmpty(result.DimensionMaturitySuggestions);
    }

    [Fact]
    public async Task AnalyzeAsync_ReturnsDeterministicResult_ForSameDiagram()
    {
        var diagramId = Guid.NewGuid();
        var content = "Microservices architecture";

        var result1 = await _service.AnalyzeAsync(diagramId, content, CancellationToken.None);
        var result2 = await _service.AnalyzeAsync(diagramId, content, CancellationToken.None);

        Assert.Equal(result1.DimensionMaturitySuggestions.Count, result2.DimensionMaturitySuggestions.Count);
    }

    [Fact]
    public async Task AnalyzeAsync_ThrowsOnCancellation()
    {
        var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => _service.AnalyzeAsync(Guid.NewGuid(), "test", cts.Token));
    }
}
