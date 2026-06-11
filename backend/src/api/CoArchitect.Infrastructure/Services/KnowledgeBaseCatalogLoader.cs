using System.Text.Json;

namespace CoArchitect.Infrastructure.Services;

public sealed class KnowledgeBaseCatalogLoader
{
    private readonly Lazy<KnowledgeBaseCatalogDocument> _catalog;
    private readonly string _knowledgeBasePath;

    public KnowledgeBaseCatalogLoader()
    {
        _knowledgeBasePath = ResolveKnowledgeBasePath();
        _catalog = new Lazy<KnowledgeBaseCatalogDocument>(LoadCatalog, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public string KnowledgeBasePath => _knowledgeBasePath;

    public IReadOnlyList<KnowledgeBaseCatalogItem> GetItems() => _catalog.Value.Items.ToList();

    public string ResolveMarkdownPath(string markdownPath)
    {
        return Path.Combine(_knowledgeBasePath, markdownPath.Replace('/', Path.DirectorySeparatorChar));
    }

    private KnowledgeBaseCatalogDocument LoadCatalog()
    {
        var path = Path.Combine(_knowledgeBasePath, "catalog", "foundry-iq-catalog.json");
        if (!File.Exists(path))
        {
            return new KnowledgeBaseCatalogDocument();
        }

        var content = File.ReadAllText(path);
        return JsonSerializer.Deserialize<KnowledgeBaseCatalogDocument>(content, JsonOptions) ?? new KnowledgeBaseCatalogDocument();
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
