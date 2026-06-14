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

    [Fact]
    public async Task AnalyzeAsync_RemovesAzureLeakage_WhenReviewIsAwsOnly()
    {
        var service = new MultiAgentArchitectureAnalysisService(
            new LeakyArchitectureAgentService(),
            new FrameworkSelectionService(),
            new ContextEnrichmentAgent(new MixedCloudFoundryIqProvider()));

        var diagram = new ArchitectureDiagram
        {
            Id = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            UploadedByUserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Name = "AWS Workload",
            OriginalFileName = "aws.txt",
            Description = "AWS Lambda, S3, and RDS for external users. Historical notes mention Azure Blob migration, but the selected target cloud is AWS.",
            UploadedAt = DateTime.UtcNow,
            ReviewContext = new ArchitectureReviewContext
            {
                CloudProviderPreference = "AWS",
                DataSensitivity = "Confidential",
            },
            FrameworkSelection = new FrameworkSelectionResult
            {
                Mode = FrameworkSelectionMode.Manual,
                SelectedFrameworks = [ReviewFramework.AwsWellArchitected, ReviewFramework.Iso25010],
                SelectionRationale = ["Manual AWS review"],
            },
        };

        var result = await service.AnalyzeAsync(diagram, CancellationToken.None);

        Assert.DoesNotContain(ReviewFramework.AzureWellArchitected, result.ResolvedFrameworkSelection.SelectedFrameworks);
        Assert.DoesNotContain(result.FoundryIqContext.FrameworkGuidanceItems, item => item.StandardKey == nameof(ReviewFramework.AzureWellArchitected));
        Assert.DoesNotContain(result.Evidence, item => ContainsAzure(item.Summary) || ContainsAzure(item.Details));
        Assert.DoesNotContain(result.Recommendations, item => ContainsAzure(item.Description));
        Assert.DoesNotContain(result.Tradeoffs, item => ContainsAzure(item.Summary) || item.Pros.Any(ContainsAzure) || item.Cons.Any(ContainsAzure));
        Assert.DoesNotContain(result.AgentTrace, item => string.Equals(item.Framework, nameof(ReviewFramework.AzureWellArchitected), StringComparison.OrdinalIgnoreCase));
        Assert.All(result.AgentTrace, item => Assert.DoesNotContain(nameof(ReviewFramework.AzureWellArchitected), item.Grounding.FrameworkRefs));
    }

    private static bool ContainsAzure(string? text)
    {
        return !string.IsNullOrWhiteSpace(text) &&
               text.Contains("azure", StringComparison.OrdinalIgnoreCase);
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

    private sealed class MixedCloudFoundryIqProvider : IFoundryIqProvider
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
                        Title = "Azure reliability guidance",
                        Summary = "Azure guidance that should be filtered.",
                        Content = "Azure-specific guidance",
                        SourceType = "test",
                        SourceLabel = "Azure guidance",
                        StandardKey = nameof(ReviewFramework.AzureWellArchitected),
                        Framework = nameof(ReviewFramework.AzureWellArchitected),
                    },
                    new FoundryIqContextItem
                    {
                        Id = "framework:aws",
                        Category = "framework",
                        Title = "AWS reliability guidance",
                        Summary = "AWS guidance that should remain.",
                        Content = "AWS-specific guidance",
                        SourceType = "test",
                        SourceLabel = "AWS guidance",
                        StandardKey = nameof(ReviewFramework.AwsWellArchitected),
                        Framework = nameof(ReviewFramework.AwsWellArchitected),
                    },
                },
                CitationRefs = { "Azure guidance", "AWS guidance" },
            });
        }
    }

    private sealed class LeakyArchitectureAgentService : IArchitectureAgentService
    {
        public Task<AgentAnalysisResult> AnalyzeAsync(Guid architectureDiagramId, string diagramContent, CancellationToken cancellationToken)
        {
            return Task.FromResult(new AgentAnalysisResult
            {
                ArchitectureDiagramId = architectureDiagramId,
                ResolvedFrameworkSelection = new FrameworkSelectionResult
                {
                    SelectedFrameworks = [ReviewFramework.AzureWellArchitected, ReviewFramework.AwsWellArchitected],
                    SelectedStandards = [ReviewStandard.Iso27001],
                },
                Evidence =
                {
                    new EvidenceItem
                    {
                        Summary = "Azure Key Vault and Azure Monitor are missing from the design.",
                        Details = "Azure-specific controls leaked into the answer.",
                        Grounding = new GroundingReferenceSet
                        {
                            FrameworkRefs = [nameof(ReviewFramework.AzureWellArchitected)],
                            CitationRefs = ["Azure guidance"],
                        },
                    },
                },
                Recommendations =
                {
                    new Recommendation
                    {
                        Description = "Use Azure Key Vault for secrets handling.",
                        Grounding = new GroundingReferenceSet
                        {
                            FrameworkRefs = [nameof(ReviewFramework.AzureWellArchitected)],
                            CitationRefs = ["Azure guidance"],
                        },
                    },
                },
                Tradeoffs =
                {
                    new Tradeoff
                    {
                        Summary = "Azure managed services versus portability",
                        Pros = ["Azure-native integration is faster."],
                        Cons = ["Azure-specific lock-in increases."],
                        Grounding = new GroundingReferenceSet
                        {
                            FrameworkRefs = [nameof(ReviewFramework.AzureWellArchitected)],
                            CitationRefs = ["Azure guidance"],
                        },
                    },
                },
                AgentTrace =
                {
                    new AgentExecutionTrace
                    {
                        AgentName = "Foundry Expert",
                        Role = "External expert review",
                        Framework = nameof(ReviewFramework.AzureWellArchitected),
                        Summary = "Azure-specific review output.",
                        Grounding = new GroundingReferenceSet
                        {
                            FrameworkRefs = [nameof(ReviewFramework.AzureWellArchitected)],
                            CitationRefs = ["Azure guidance"],
                        },
                    },
                },
            });
        }
    }
}
