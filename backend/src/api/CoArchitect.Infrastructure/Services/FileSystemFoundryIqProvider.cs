using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Models;

namespace CoArchitect.Infrastructure.Services;

public sealed class FileSystemFoundryIqProvider : IFoundryIqProvider
{
    private readonly string _knowledgeBasePath;

    public FileSystemFoundryIqProvider()
    {
        _knowledgeBasePath = ResolveKnowledgeBasePath();
    }

    public Task<FoundryIqContextBundle> RetrieveContextAsync(FoundryIqQuery query, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var frameworkItems = query.SuggestedFrameworks
            .SelectMany(MapFrameworkFile)
            .ToList();

        var principleItems = LoadListItems(
            "architecture-tradeoff-principles.md",
            "principle",
            "Architecture Principles",
            sourceUri: "/docs/knowledge-base/architecture-tradeoff-principles.md");

        var tradeoffItems = LoadListItems(
            "architecture-tradeoff-principles.md",
            "tradeoff",
            "Trade-off Catalog",
            sourceUri: "/docs/knowledge-base/architecture-tradeoff-principles.md",
            lineFilter: line => line.Contains(" versus ", StringComparison.OrdinalIgnoreCase));

        var adrTemplateItems = LoadHeadingItems(
            "adr-template.md",
            "adr-template",
            "ADR Template",
            sourceUri: "/docs/knowledge-base/adr-template.md");

        return Task.FromResult(new FoundryIqContextBundle
        {
            FrameworkGuidanceItems = frameworkItems,
            PrincipleItems = principleItems,
            TradeoffItems = tradeoffItems,
            AdrTemplateItems = adrTemplateItems,
            CitationRefs = frameworkItems
                .Concat(principleItems)
                .Concat(tradeoffItems)
                .Concat(adrTemplateItems)
                .Select(item => BuildCitation(item))
                .Distinct(StringComparer.Ordinal)
                .ToList(),
        });
    }

    private IEnumerable<FoundryIqContextItem> MapFrameworkFile(string framework) => framework switch
    {
        "AzureWellArchitected" => LoadListItems(
            "azure-well-architected-summary.md",
            "framework",
            "Azure Well-Architected Framework",
            framework,
            "https://learn.microsoft.com/azure/well-architected/"),
        "AwsWellArchitected" => LoadListItems(
            "aws-well-architected-summary.md",
            "framework",
            "AWS Well-Architected Framework",
            framework,
            "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html"),
        "Iso25010" => LoadListItems(
            "iso-25010-summary.md",
            "framework",
            "ISO/IEC 25010",
            framework,
            "https://iso25000.com/index.php/en/iso-25000-standards/iso-25010"),
        "OwaspAsvs" => LoadListItems(
            "owasp-asvs-summary.md",
            "framework",
            "OWASP ASVS",
            framework,
            "https://owasp.org/www-project-application-security-verification-standard/"),
        _ => Array.Empty<FoundryIqContextItem>(),
    };

    private List<FoundryIqContextItem> LoadListItems(
        string fileName,
        string category,
        string sourceLabel,
        string? framework = null,
        string? sourceUri = null,
        Func<string, bool>? lineFilter = null)
    {
        var content = ReadFile(fileName);
        var lines = content
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(line => line.StartsWith("- ", StringComparison.Ordinal))
            .Select(line => line[2..].Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Where(line => lineFilter is null || lineFilter(line))
            .ToList();

        return lines
            .Select((line, index) => new FoundryIqContextItem
            {
                Id = $"{fileName}:{category}:{index}",
                Category = category,
                Title = line,
                Summary = line,
                Content = line,
                SourceType = "knowledge-base-file",
                SourceLabel = sourceLabel,
                SourceUri = sourceUri,
                Framework = framework,
                Principle = category == "principle" ? line : null,
                TradeoffTag = category == "tradeoff" ? line : null,
            })
            .ToList();
    }

    private List<FoundryIqContextItem> LoadHeadingItems(
        string fileName,
        string category,
        string sourceLabel,
        string? sourceUri = null)
    {
        var content = ReadFile(fileName);
        var lines = content
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(line => line.StartsWith("## ", StringComparison.Ordinal))
            .Select(line => line[3..].Trim())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToList();

        return lines
            .Select((line, index) => new FoundryIqContextItem
            {
                Id = $"{fileName}:{category}:{index}",
                Category = category,
                Title = line,
                Summary = $"ADR section: {line}",
                Content = line,
                SourceType = "knowledge-base-file",
                SourceLabel = sourceLabel,
                SourceUri = sourceUri,
            })
            .ToList();
    }

    private string ReadFile(string fileName)
    {
        var path = Path.Combine(_knowledgeBasePath, fileName);
        return File.Exists(path) ? File.ReadAllText(path) : string.Empty;
    }

    private static string ResolveKnowledgeBasePath()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var candidate = Path.Combine(current.FullName, "docs", "knowledge-base");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            current = current.Parent;
        }

        return Path.Combine(Directory.GetCurrentDirectory(), "docs", "knowledge-base");
    }

    private static string BuildCitation(FoundryIqContextItem item)
    {
        return string.IsNullOrWhiteSpace(item.SourceUri)
            ? item.SourceLabel
            : $"{item.SourceLabel} ({item.SourceUri})";
    }
}
