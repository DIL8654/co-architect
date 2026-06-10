using CoArchitect.Application.Services;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Infrastructure.Services;
using Xunit;

namespace CoArchitect.Application.Tests;

public class MultiAgentArchitectureAnalysisServiceTests
{
    private readonly MultiAgentArchitectureAnalysisService _service =
        new(new MockArchitectureAgentService(), new FrameworkSelectionService());

    [Fact]
    public async Task AnalyzeAsync_ExpandsLegacyDiagramFrameworks_FromAzureAndSecurityCues()
    {
        var diagram = new ArchitectureDiagram
        {
            Id = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            UploadedByUserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Name = "Legacy Diagram",
            OriginalFileName = "legacy.txt",
            Description = "Azure App Service with .NET API, Blob Storage, external users, PII, and no tenant isolation or secrets management.",
            UploadedAt = DateTime.UtcNow,
        };

        var result = await _service.AnalyzeAsync(diagram, CancellationToken.None);

        var frameworkTraces = result.AgentTrace
            .Where(item => !string.IsNullOrWhiteSpace(item.Framework))
            .Select(item => item.Framework)
            .ToList();

        Assert.Contains(nameof(ReviewFramework.AzureWellArchitected), frameworkTraces);
        Assert.Contains(nameof(ReviewFramework.Iso25010), frameworkTraces);
        Assert.Contains(nameof(ReviewFramework.OwaspAsvs), frameworkTraces);
        Assert.Contains(result.AgentTrace, item => string.Equals(item.Framework, nameof(ReviewFramework.OwaspAsvs), StringComparison.Ordinal));
        Assert.Contains(result.DimensionMaturitySuggestions, item => item.Dimension == ArchitectureDimension.DataTenantIsolation);
        Assert.NotEmpty(result.ExecutiveSummary);
    }
}
