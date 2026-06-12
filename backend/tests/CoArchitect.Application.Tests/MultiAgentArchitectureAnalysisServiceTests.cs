using CoArchitect.Application.Services;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Services;
using Xunit;

namespace CoArchitect.Application.Tests;

public class MultiAgentArchitectureAnalysisServiceTests
{
    private readonly MultiAgentArchitectureAnalysisService _service =
        new(new MockArchitectureAgentService(), new FrameworkSelectionService(), new ContextEnrichmentAgent(new StubFoundryIqProvider()));

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
        Assert.NotEmpty(result.FoundryIqContext.FrameworkGuidanceItems);
        Assert.Contains(ReviewStandard.Iso27001, result.ResolvedFrameworkSelection.SelectedStandards);
        Assert.Contains(result.AgentTrace, item => item.AgentName == "Context Enrichment Agent");
        Assert.Contains(result.Recommendations, item => item.Grounding.FrameworkRefs.Count > 0);
        Assert.Contains(result.Recommendations, item => item.Grounding.StandardRefs.Count > 0);
    }

    private sealed class StubFoundryIqProvider : IFoundryIqProvider
    {
        public Task<FoundryIqContextBundle> RetrieveContextAsync(FoundryIqQuery query, CancellationToken cancellationToken)
        {
            return Task.FromResult(new FoundryIqContextBundle
            {
                FrameworkGuidanceItems =
                {
                    new FoundryIqContextItem
                    {
                        Id = "framework:azure",
                        Category = "framework",
                        Title = "Azure reliability and security guidance",
                        Summary = "Azure reliability and security guidance",
                        Content = "Azure reliability and security guidance",
                        SourceType = "test",
                        SourceLabel = "Stub framework guidance",
                        Framework = nameof(ReviewFramework.AzureWellArchitected),
                    },
                },
                PrincipleItems =
                {
                    new FoundryIqContextItem
                    {
                        Id = "principle:security",
                        Category = "principle",
                        Title = "Security",
                        Summary = "Security",
                        Content = "Security",
                        SourceType = "test",
                        SourceLabel = "Stub principle guidance",
                        Principle = "Security",
                    },
                },
                TradeoffItems =
                {
                    new FoundryIqContextItem
                    {
                        Id = "tradeoff:simplicity-scalability",
                        Category = "tradeoff",
                        Title = "Simplicity vs scalability",
                        Summary = "Simplicity vs scalability",
                        Content = "Simplicity vs scalability",
                        SourceType = "test",
                        SourceLabel = "Stub tradeoff guidance",
                        TradeoffTag = "Simplicity vs scalability",
                    },
                },
                CitationRefs = { "Stub framework guidance" },
            });
        }
    }
}
