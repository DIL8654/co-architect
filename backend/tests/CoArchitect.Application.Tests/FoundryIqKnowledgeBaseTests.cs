using CoArchitect.Application.Services;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Services;
using Xunit;

namespace CoArchitect.Application.Tests;

public class FoundryIqKnowledgeBaseTests
{
    [Fact]
    public void Loader_accepts_a_parent_docs_path_and_normalizes_to_knowledge_base()
    {
        var tempRoot = Path.Combine(Path.GetTempPath(), $"coarchitect-kb-{Guid.NewGuid():N}");
        var docsRoot = Path.Combine(tempRoot, "docs");
        var knowledgeBaseRoot = Path.Combine(docsRoot, "knowledge-base");
        var catalogRoot = Path.Combine(knowledgeBaseRoot, "catalog");

        Directory.CreateDirectory(catalogRoot);
        File.WriteAllText(Path.Combine(catalogRoot, "foundry-iq-catalog.json"), "{\"items\":[]}");

        var previous = Environment.GetEnvironmentVariable("FoundryIq__KnowledgeBasePath");
        Environment.SetEnvironmentVariable("FoundryIq__KnowledgeBasePath", docsRoot);

        try
        {
            var loader = new KnowledgeBaseCatalogLoader();
            Assert.True(loader.CatalogExists);
            Assert.EndsWith(Path.Combine("docs", "knowledge-base"), loader.KnowledgeBasePath);
            Assert.EndsWith(Path.Combine("docs", "knowledge-base", "catalog", "foundry-iq-catalog.json"), loader.CatalogPath);
        }
        finally
        {
            Environment.SetEnvironmentVariable("FoundryIq__KnowledgeBasePath", previous);
            if (Directory.Exists(tempRoot))
            {
                Directory.Delete(tempRoot, recursive: true);
            }
        }
    }

    [Fact]
    public void Catalog_loads_all_expected_standards_and_markdown_files_exist()
    {
        var loader = new KnowledgeBaseCatalogLoader();
        var items = loader.GetItems();

        var standards = items
            .Select(item => item.StandardKey)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        Assert.Contains("AzureWellArchitected", standards);
        Assert.Contains("AwsWellArchitected", standards);
        Assert.Contains("Iso25010", standards);
        Assert.Contains("OwaspAsvs", standards);
        Assert.Contains("TOGAF", standards);
        Assert.Contains("SAFe", standards);
        Assert.Contains("ISO27001", standards);
        Assert.Contains("GDPR", standards);
        Assert.Contains("SOC2", standards);

        foreach (var markdownPath in items
                     .Select(item => item.MarkdownPath)
                     .Where(item => !string.IsNullOrWhiteSpace(item))
                     .Distinct(StringComparer.OrdinalIgnoreCase))
        {
            Assert.True(File.Exists(loader.ResolveMarkdownPath(markdownPath)), $"Missing markdown file for {markdownPath}");
        }
    }

    [Fact]
    public async Task Provider_retrieves_framework_principle_tradeoff_and_compliance_context()
    {
        var provider = new FileSystemFoundryIqProvider(new KnowledgeBaseCatalogLoader());
        var query = new FoundryIqQuery
        {
            WorkspaceId = Guid.NewGuid(),
            DiagramId = Guid.NewGuid(),
            DiagramName = "Customer API",
            ArchitectureDescription = "Azure App Service exposes partner APIs, stores personal data for European customers, supports deletion and audit logging, and needs better secrets handling.",
            ReviewContext = new ArchitectureReviewContext
            {
                DataSensitivity = "PII and sensitive customer data",
                ComplianceNeeds = "GDPR and security controls",
                TargetUsers = "External enterprise users",
            },
            SuggestedFrameworks = [nameof(ReviewFramework.AzureWellArchitected), nameof(ReviewFramework.OwaspAsvs)],
            SuggestedStandards = [nameof(ReviewStandard.Iso27001), nameof(ReviewStandard.Gdpr)],
            QualityAttributeWeights =
            [
                new QualityAttributeWeight { Key = "security", Label = "Security", Weight = 30 },
                new QualityAttributeWeight { Key = "compliance", Label = "Compliance", Weight = 20 },
                new QualityAttributeWeight { Key = "availability", Label = "Availability", Weight = 20 },
            ],
        };

        var result = await provider.RetrieveContextAsync(query, CancellationToken.None);

        Assert.Contains(result.FrameworkGuidanceItems, item => item.StandardKey == nameof(ReviewFramework.AzureWellArchitected));
        Assert.Contains(result.FrameworkGuidanceItems, item => item.StandardKey == nameof(ReviewFramework.OwaspAsvs));
        Assert.NotEmpty(result.PrincipleItems);
        Assert.NotEmpty(result.TradeoffItems);
        Assert.NotEmpty(result.ComplianceItems);
        Assert.Contains(result.ComplianceItems, item => item.StandardKey is "GDPR" or "ISO27001");
    }

    [Fact]
    public async Task Provider_returns_governance_and_scaling_guidance_from_architecture_cues()
    {
        var provider = new FileSystemFoundryIqProvider(new KnowledgeBaseCatalogLoader());

        var togafResult = await provider.RetrieveContextAsync(new FoundryIqQuery
        {
            WorkspaceId = Guid.NewGuid(),
            DiagramId = Guid.NewGuid(),
            DiagramName = "Enterprise roadmap platform",
            ArchitectureDescription = "A roadmap-led enterprise change program with architecture governance, capability planning, and change management across product areas.",
        }, CancellationToken.None);

        Assert.Contains(togafResult.FrameworkGuidanceItems, item => item.StandardKey == "TOGAF");

        var safeResult = await provider.RetrieveContextAsync(new FoundryIqQuery
        {
            WorkspaceId = Guid.NewGuid(),
            DiagramId = Guid.NewGuid(),
            DiagramName = "Shared platform",
            ArchitectureDescription = "A shared platform for many teams with value streams, release coordination, platform teams, and system integration needs.",
        }, CancellationToken.None);

        Assert.Contains(safeResult.FrameworkGuidanceItems, item => item.StandardKey == "SAFe");
    }

    [Fact]
    public async Task Provider_returns_non_empty_cloud_neutral_baseline_when_no_frameworks_are_selected()
    {
        var provider = new FileSystemFoundryIqProvider(new KnowledgeBaseCatalogLoader());
        var result = await provider.RetrieveContextAsync(new FoundryIqQuery
        {
            WorkspaceId = Guid.NewGuid(),
            DiagramId = Guid.NewGuid(),
            DiagramName = "General architecture review",
            ArchitectureDescription = "A business system with APIs, background jobs, and a shared database.",
        }, CancellationToken.None);

        Assert.NotEmpty(result.FrameworkGuidanceItems);
        Assert.NotEmpty(result.PrincipleItems);
        Assert.NotEmpty(result.TradeoffItems);
    }

    [Fact]
    public async Task Context_enrichment_uses_structured_categories_and_reports_real_counts()
    {
        var agent = new ContextEnrichmentAgent(new FileSystemFoundryIqProvider(new KnowledgeBaseCatalogLoader()));
        var diagram = new ArchitectureDiagram
        {
            Id = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            UploadedByUserId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Name = "Document processing service",
            OriginalFileName = "doc-platform.txt",
            Description = "A document processing platform with APIs, PII, audit trails, retention needs, human review, and platform team coordination.",
            UploadedAt = DateTime.UtcNow,
            ReviewContext = new ArchitectureReviewContext
            {
                ComplianceNeeds = "GDPR and auditability",
                DataSensitivity = "PII",
                CurrentPainPoints = "Slow release coordination across teams",
            },
        };

        var result = await agent.EnrichAsync(
            diagram,
            [ReviewFramework.Iso25010, ReviewFramework.OwaspAsvs],
            [ReviewStandard.Iso27001, ReviewStandard.Gdpr, ReviewStandard.Safe],
            [
                new QualityAttributeWeight { Key = "security", Label = "Security", Weight = 25 },
                new QualityAttributeWeight { Key = "compliance", Label = "Compliance", Weight = 20 },
                new QualityAttributeWeight { Key = "deliverySpeed", Label = "Delivery Speed", Weight = 15 },
            ],
            CancellationToken.None);

        Assert.NotEmpty(result.ApplicablePrinciples);
        Assert.NotEmpty(result.ApplicableTradeoffs);
        Assert.NotEmpty(result.ContextBundle.ComplianceItems);
        Assert.Contains(ReviewStandard.Iso27001, result.ConfirmedStandards);
        Assert.Contains("compliance notes", result.Summary, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Retrieved 0 framework guidance items, 0 principle notes, 0 trade-off notes, 0 compliance notes", result.Summary, StringComparison.OrdinalIgnoreCase);
    }
}
