using System.Text.Json;

namespace CoArchitect.Infrastructure.Services;

public sealed class KnowledgeBaseCatalogLoader
{
    private readonly Lazy<KnowledgeBaseCatalogDocument> _catalog;
    private readonly string _knowledgeBasePath;
    private readonly string _catalogPath;

    public KnowledgeBaseCatalogLoader()
    {
        _knowledgeBasePath = ResolveKnowledgeBasePath(Environment.GetEnvironmentVariable("FoundryIq__KnowledgeBasePath"));
        _catalogPath = Path.Combine(_knowledgeBasePath, "catalog", "foundry-iq-catalog.json");
        _catalog = new Lazy<KnowledgeBaseCatalogDocument>(LoadCatalog, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public string KnowledgeBasePath => _knowledgeBasePath;
    public string CatalogPath => _catalogPath;
    public bool CatalogExists => File.Exists(_catalogPath);

    public IReadOnlyList<KnowledgeBaseCatalogItem> GetItems() => _catalog.Value.Items.ToList();

    public string ResolveMarkdownPath(string markdownPath)
    {
        return Path.Combine(_knowledgeBasePath, markdownPath.Replace('/', Path.DirectorySeparatorChar));
    }

    private KnowledgeBaseCatalogDocument LoadCatalog()
    {
        if (!File.Exists(_catalogPath))
        {
            return new KnowledgeBaseCatalogDocument();
        }

        var content = File.ReadAllText(_catalogPath);
        return JsonSerializer.Deserialize<KnowledgeBaseCatalogDocument>(content, JsonOptions) ?? new KnowledgeBaseCatalogDocument();
    }

    private static string ResolveKnowledgeBasePath(string? configuredPath)
    {
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            var expanded = Environment.ExpandEnvironmentVariables(configuredPath);
            var normalized = NormalizeConfiguredPath(expanded);
            if (normalized is not null)
            {
                return normalized;
            }
        }

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

        current = new DirectoryInfo(Directory.GetCurrentDirectory());
        while (current is not null)
        {
            var candidate = Path.Combine(current.FullName, "docs", "knowledge-base");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            current = current.Parent;
        }

        return Path.Combine(AppContext.BaseDirectory, "docs", "knowledge-base");
    }

    private static string? NormalizeConfiguredPath(string expanded)
    {
        if (Directory.Exists(Path.Combine(expanded, "catalog")) &&
            File.Exists(Path.Combine(expanded, "catalog", "foundry-iq-catalog.json")))
        {
            return expanded;
        }

        var nested = Path.Combine(expanded, "knowledge-base");
        if (Directory.Exists(Path.Combine(nested, "catalog")) &&
            File.Exists(Path.Combine(nested, "catalog", "foundry-iq-catalog.json")))
        {
            return nested;
        }

        if (Directory.Exists(expanded))
        {
            return expanded;
        }

        return null;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };
}

public sealed class KnowledgeBaseCatalogDocument
{
    public IList<KnowledgeBaseCatalogItem> Items { get; init; } = new List<KnowledgeBaseCatalogItem>();
}

public sealed class KnowledgeBaseCatalogItem
{
    public string Id { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Kind { get; init; } = string.Empty;
    public string StandardKey { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public IList<string> UseCaseTags { get; init; } = new List<string>();
    public string Summary { get; init; } = string.Empty;
    public string WhyItMatters { get; init; } = string.Empty;
    public string WhenToApply { get; init; } = string.Empty;
    public string Guidance { get; init; } = string.Empty;
    public IList<string> Pros { get; init; } = new List<string>();
    public IList<string> Cons { get; init; } = new List<string>();
    public string? DecisionContext { get; init; }
    public string SourceLabel { get; init; } = string.Empty;
    public string SourceUri { get; init; } = string.Empty;
    public string MarkdownPath { get; init; } = string.Empty;
}
