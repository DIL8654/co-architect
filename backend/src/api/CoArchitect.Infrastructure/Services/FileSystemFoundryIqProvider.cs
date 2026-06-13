using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Models;

namespace CoArchitect.Infrastructure.Services;

public sealed class FileSystemFoundryIqProvider : IFoundryIqProvider, IFoundryIqKnowledgeProvider
{
    private static readonly string[] CloudNeutralBaselineFrameworks = ["Iso25010", "OwaspAsvs"];
    private static readonly string[] DefaultTradeoffIds =
    [
        "tradeoff-cost-reliability",
        "tradeoff-simplicity-scalability",
        "tradeoff-security-usability",
        "tradeoff-speed-governance",
    ];

    private readonly KnowledgeBaseCatalogLoader _catalogLoader;

    public FileSystemFoundryIqProvider(KnowledgeBaseCatalogLoader catalogLoader)
    {
        _catalogLoader = catalogLoader;
    }

    public Task<FoundryIqContextBundle> RetrieveContextAsync(FoundryIqQuery query, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var items = _catalogLoader.GetItems();
        var normalizedText = BuildNormalizedText(query);
        var selectedFrameworks = query.SuggestedFrameworks
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var selectedStandards = query.SuggestedStandards
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(NormalizeStandardKey)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (selectedFrameworks.Count == 0)
        {
            foreach (var framework in CloudNeutralBaselineFrameworks)
            {
                selectedFrameworks.Add(framework);
            }
        }

        if (items.Count == 0)
        {
            return Task.FromResult(BuildCatalogMissingFallback(selectedFrameworks, selectedStandards));
        }

        var principleCategories = ResolvePrincipleCategories(query.QualityAttributeWeights.ToList());
        var architectureTags = ResolveArchitectureTags(normalizedText, query);

        var frameworkItems = SelectFrameworkItems(items, selectedFrameworks, selectedStandards, architectureTags);
        var principleItems = SelectPrincipleItems(items, principleCategories, architectureTags);
        var tradeoffItems = SelectTradeoffItems(items, principleCategories, architectureTags);
        var complianceItems = SelectComplianceItems(items, selectedStandards, architectureTags, normalizedText, query);
        var adrTemplateItems = items
            .Where(item => string.Equals(item.Kind, "adr-template", StringComparison.OrdinalIgnoreCase))
            .Select(MapItem)
            .ToList();

        var citationRefs = frameworkItems
            .Concat(principleItems)
            .Concat(tradeoffItems)
            .Concat(complianceItems)
            .Concat(adrTemplateItems)
            .Select(BuildCitation)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        return Task.FromResult(new FoundryIqContextBundle
        {
            RetrievalProvider = "LocalKnowledgeBase",
            FrameworkGuidanceItems = frameworkItems,
            PrincipleItems = principleItems,
            TradeoffItems = tradeoffItems,
            ComplianceItems = complianceItems,
            AdrTemplateItems = adrTemplateItems,
            CitationRefs = citationRefs,
        });
    }

    private FoundryIqContextBundle BuildCatalogMissingFallback(
        HashSet<string> selectedFrameworks,
        HashSet<string> selectedStandards)
    {
        var frameworkItems = selectedFrameworks
            .Take(4)
            .Select(key => BuildFallbackItem($"fallback-framework-{key}", "framework-guidance", key, "baseline", $"{key} baseline guidance", "Knowledge-base catalog was not found; using minimal baseline guidance so the reasoning trace remains explicit."))
            .ToList();

        var complianceItems = selectedStandards
            .Take(4)
            .Select(key => BuildFallbackItem($"fallback-standard-{key}", "compliance-guidance", key, "compliance", $"{key} standard guidance", "Knowledge-base catalog was not found; selected standards were still carried into the review setup."))
            .ToList();

        var principleItems = new List<FoundryIqContextItem>
        {
            BuildFallbackItem("fallback-principle-security", "architecture-principle", "CorePrinciples", "security", "Protect identity, data, and ingress boundaries", "Use a secure baseline when richer Foundry IQ knowledge is unavailable."),
            BuildFallbackItem("fallback-principle-reliability", "architecture-principle", "CorePrinciples", "reliability", "Design for failure and recovery", "Use a reliability baseline when richer Foundry IQ knowledge is unavailable."),
        };

        var tradeoffItems = new List<FoundryIqContextItem>
        {
            BuildFallbackItem("fallback-tradeoff-security-usability", "tradeoff-guidance", "CoreTradeoffs", "security", "Security vs usability", "Consider the operational and user impact of stronger security controls."),
            BuildFallbackItem("fallback-tradeoff-cost-reliability", "tradeoff-guidance", "CoreTradeoffs", "reliability", "Cost vs reliability", "Balance resilience investments against workload value and risk."),
        };

        var citations = new List<string> { $"Foundry IQ catalog unavailable at {_catalogLoader.CatalogPath}" };
        return new FoundryIqContextBundle
        {
            RetrievalProvider = "LocalKnowledgeBase",
            FallbackUsed = true,
            FallbackReason = $"Foundry IQ catalog unavailable at {_catalogLoader.CatalogPath}",
            FrameworkGuidanceItems = frameworkItems,
            ComplianceItems = complianceItems,
            PrincipleItems = principleItems,
            TradeoffItems = tradeoffItems,
            CitationRefs = citations,
        };
    }

    private static FoundryIqContextItem BuildFallbackItem(
        string id,
        string sourceType,
        string standardKey,
        string category,
        string title,
        string summary)
    {
        return new FoundryIqContextItem
        {
            Id = id,
            Category = category,
            Title = title,
            Summary = summary,
            Content = summary,
            SourceType = sourceType,
            SourceLabel = "Foundry IQ fallback baseline",
            SourceProvider = "FallbackBaseline",
            StandardKey = standardKey,
            UseCaseTags = new List<string> { category },
            WhyItMatters = "Grounding should remain visible even when the local catalog path is misconfigured.",
            WhenToApply = "Use as a fallback only until the structured knowledge-base catalog is available.",
            Framework = sourceType == "framework-guidance" ? standardKey : null,
            Principle = sourceType == "architecture-principle" ? title : null,
            TradeoffTag = sourceType == "tradeoff-guidance" ? title : null,
        };
    }

    private static List<FoundryIqContextItem> SelectFrameworkItems(
        IReadOnlyList<KnowledgeBaseCatalogItem> items,
        HashSet<string> selectedFrameworks,
        HashSet<string> selectedStandards,
        HashSet<string> architectureTags)
    {
        var directFrameworks = items
            .Where(item => string.Equals(item.Kind, "framework-guidance", StringComparison.OrdinalIgnoreCase))
            .Where(item => selectedFrameworks.Contains(item.StandardKey))
            .Select(MapItem)
            .ToList();

        var governanceSignals = items
            .Where(item => string.Equals(item.Kind, "framework-guidance", StringComparison.OrdinalIgnoreCase))
            .Where(item =>
                string.Equals(item.StandardKey, "TOGAF", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.StandardKey, "SAFe", StringComparison.OrdinalIgnoreCase))
            .Where(item => selectedStandards.Contains(item.StandardKey) || HasTagOverlap(item.UseCaseTags, architectureTags))
            .Select(MapItem)
            .ToList();

        return directFrameworks
            .Concat(governanceSignals)
            .GroupBy(item => item.Id, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .DefaultIfEmpty()
            .Where(item => item is not null)
            .Cast<FoundryIqContextItem>()
            .ToList();
    }

    private static List<FoundryIqContextItem> SelectPrincipleItems(
        IReadOnlyList<KnowledgeBaseCatalogItem> items,
        HashSet<string> principleCategories,
        HashSet<string> architectureTags)
    {
        var matches = items
            .Where(item => string.Equals(item.Kind, "architecture-principle", StringComparison.OrdinalIgnoreCase))
            .Select(item => new
            {
                Item = item,
                Score = ScorePrincipleItem(item, principleCategories, architectureTags),
            })
            .Where(item => item.Score > 0)
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Item.Title, StringComparer.OrdinalIgnoreCase)
            .Take(8)
            .Select(item => MapItem(item.Item))
            .ToList();

        if (matches.Count > 0)
        {
            return matches;
        }

        return items
            .Where(item => string.Equals(item.Kind, "architecture-principle", StringComparison.OrdinalIgnoreCase))
            .Where(item =>
                string.Equals(item.Category, "security", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.Category, "reliability", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(item.Category, "operations", StringComparison.OrdinalIgnoreCase))
            .Take(6)
            .Select(MapItem)
            .ToList();
    }

    private static List<FoundryIqContextItem> SelectTradeoffItems(
        IReadOnlyList<KnowledgeBaseCatalogItem> items,
        HashSet<string> principleCategories,
        HashSet<string> architectureTags)
    {
        var matches = items
            .Where(item => string.Equals(item.Kind, "tradeoff-guidance", StringComparison.OrdinalIgnoreCase))
            .Select(item => new
            {
                Item = item,
                Score = ScoreTradeoffItem(item, principleCategories, architectureTags),
            })
            .Where(item => item.Score > 0)
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Item.Title, StringComparer.OrdinalIgnoreCase)
            .Take(6)
            .Select(item => MapItem(item.Item))
            .ToList();

        if (matches.Count > 0)
        {
            return matches;
        }

        return items
            .Where(item => DefaultTradeoffIds.Contains(item.Id, StringComparer.OrdinalIgnoreCase))
            .Select(MapItem)
            .ToList();
    }

    private static List<FoundryIqContextItem> SelectComplianceItems(
        IReadOnlyList<KnowledgeBaseCatalogItem> items,
        HashSet<string> selectedStandards,
        HashSet<string> architectureTags,
        string normalizedText,
        FoundryIqQuery query)
    {
        var hasComplianceContext =
            !string.IsNullOrWhiteSpace(query.ReviewContext.ComplianceNeeds) ||
            !string.IsNullOrWhiteSpace(query.ReviewContext.DataSensitivity) ||
            architectureTags.Contains("pii") ||
            architectureTags.Contains("privacy") ||
            architectureTags.Contains("audit") ||
            architectureTags.Contains("compliance");

        var matches = items
            .Where(item => string.Equals(item.Kind, "compliance-guidance", StringComparison.OrdinalIgnoreCase))
            .Select(item => new
            {
                Item = item,
                Score = ScoreComplianceItem(item, selectedStandards, architectureTags, normalizedText),
            })
            .Where(item => item.Score > 0)
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Item.StandardKey, StringComparer.OrdinalIgnoreCase)
            .Take(6)
            .Select(item => MapItem(item.Item))
            .ToList();

        if (matches.Count > 0)
        {
            return matches;
        }

        if (!hasComplianceContext)
        {
            return [];
        }

        return items
            .Where(item => string.Equals(item.Kind, "compliance-guidance", StringComparison.OrdinalIgnoreCase))
            .GroupBy(item => item.StandardKey, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .Take(3)
            .Select(MapItem)
            .ToList();
    }

    private static int ScorePrincipleItem(
        KnowledgeBaseCatalogItem item,
        HashSet<string> principleCategories,
        HashSet<string> architectureTags)
    {
        var score = 0;
        if (principleCategories.Contains(item.Category))
        {
            score += 4;
        }

        score += item.UseCaseTags.Count(tag => architectureTags.Contains(tag));
        return score;
    }

    private static string NormalizeStandardKey(string standard)
    {
        return standard.Trim() switch
        {
            "Iso27001" => "ISO27001",
            "ISO 27001" => "ISO27001",
            "Gdpr" => "GDPR",
            "Soc2" => "SOC2",
            "SOC 2" => "SOC2",
            "Togaf" => "TOGAF",
            "Safe" => "SAFe",
            _ => standard.Trim(),
        };
    }

    private static int ScoreTradeoffItem(
        KnowledgeBaseCatalogItem item,
        HashSet<string> principleCategories,
        HashSet<string> architectureTags)
    {
        var score = item.UseCaseTags.Count(tag => architectureTags.Contains(tag));

        if (principleCategories.Contains(item.Category))
        {
            score += 2;
        }

        if (!string.IsNullOrWhiteSpace(item.DecisionContext) && architectureTags.Any(tag => item.DecisionContext.Contains(tag, StringComparison.OrdinalIgnoreCase)))
        {
            score += 1;
        }

        return score;
    }

    private static int ScoreComplianceItem(
        KnowledgeBaseCatalogItem item,
        HashSet<string> selectedStandards,
        HashSet<string> architectureTags,
        string normalizedText)
    {
        var score = item.UseCaseTags.Count(tag => architectureTags.Contains(tag));

        if (selectedStandards.Contains(item.StandardKey))
        {
            score += 5;
        }

        if (normalizedText.Contains(item.StandardKey, StringComparison.OrdinalIgnoreCase))
        {
            score += 2;
        }

        return score;
    }

    private static HashSet<string> ResolvePrincipleCategories(IReadOnlyCollection<QualityAttributeWeight> weights)
    {
        var categories = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var weight in weights.OrderByDescending(item => item.Weight).Take(4))
        {
            switch (weight.Key.ToLowerInvariant())
            {
                case "security":
                    categories.Add("security");
                    categories.Add("compliance");
                    break;
                case "availability":
                    categories.Add("reliability");
                    categories.Add("operations");
                    break;
                case "scalability":
                    categories.Add("scalability");
                    break;
                case "cost":
                    categories.Add("cost");
                    break;
                case "maintainability":
                    categories.Add("maintainability");
                    break;
                case "compliance":
                    categories.Add("compliance");
                    categories.Add("security");
                    break;
                case "deliveryspeed":
                    categories.Add("operations");
                    categories.Add("governance");
                    break;
            }
        }

        if (categories.Count == 0)
        {
            categories.UnionWith(["security", "reliability", "operations"]);
        }

        return categories;
    }

    private static HashSet<string> ResolveArchitectureTags(string normalizedText, FoundryIqQuery query)
    {
        var tags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var knownTags =
            new[]
            {
                "api", "external-user", "pii", "eu-data", "retention", "deletion", "privacy",
                "audit", "governance", "enterprise-change", "roadmap", "capability-planning",
                "value-stream", "platform-team", "release-alignment", "high-scale", "queue",
                "async", "blob-storage", "video", "document-processing", "tenant-isolation",
                "secrets", "availability", "cost", "performance", "self-hosted", "managed-service",
                "compliance", "incident-response", "observability", "operations"
            };

        foreach (var tag in knownTags)
        {
            if (normalizedText.Contains(tag.Replace('-', ' '), StringComparison.OrdinalIgnoreCase) ||
                normalizedText.Contains(tag, StringComparison.OrdinalIgnoreCase))
            {
                tags.Add(tag);
            }
        }

        if (ContainsAny(normalizedText, "api", "rest", "graphql", "partner"))
        {
            tags.Add("api");
        }

        if (ContainsAny(normalizedText, "pii", "personal data", "customer data", "sensitive"))
        {
            tags.Add("pii");
            tags.Add("privacy");
        }

        if (ContainsAny(normalizedText, "gdpr", "europe", "european", "eu"))
        {
            tags.Add("eu-data");
            tags.Add("privacy");
            tags.Add("compliance");
        }

        if (ContainsAny(normalizedText, "audit", "audit logging", "traceability", "evidence"))
        {
            tags.Add("audit");
            tags.Add("compliance");
        }

        if (ContainsAny(normalizedText, "retention", "delete", "deletion", "right to be forgotten"))
        {
            tags.Add("retention");
            tags.Add("deletion");
            tags.Add("privacy");
        }

        if (ContainsAny(normalizedText, "governance", "architecture board", "enterprise architecture", "roadmap", "capability"))
        {
            tags.Add("governance");
            tags.Add("enterprise-change");
            tags.Add("roadmap");
            tags.Add("capability-planning");
        }

        if (ContainsAny(normalizedText, "value stream", "release train", "platform team", "release coordination", "system team"))
        {
            tags.Add("value-stream");
            tags.Add("platform-team");
            tags.Add("release-alignment");
        }

        if (ContainsAny(normalizedText, "queue", "message", "event", "async", "background worker"))
        {
            tags.Add("queue");
            tags.Add("async");
        }

        if (ContainsAny(normalizedText, "tenant", "multi-tenant", "tenant isolation"))
        {
            tags.Add("tenant-isolation");
        }

        if (ContainsAny(normalizedText, "key vault", "secret", "credential"))
        {
            tags.Add("secrets");
        }

        if (ContainsAny(normalizedText, "monitoring", "observability", "tracing", "logs"))
        {
            tags.Add("observability");
            tags.Add("operations");
        }

        if (ContainsAny(normalizedText, "dr", "disaster recovery", "backup", "restore", "recovery"))
        {
            tags.Add("availability");
        }

        if (ContainsAny(normalizedText, "blob", "object storage", "s3", "video"))
        {
            tags.Add("blob-storage");
        }

        if (ContainsAny(normalizedText, "video", "media"))
        {
            tags.Add("video");
        }

        if (ContainsAny(normalizedText, "document", "ocr", "extraction", "classification"))
        {
            tags.Add("document-processing");
        }

        if (ContainsAny(normalizedText, "managed service", "serverless", "saas"))
        {
            tags.Add("managed-service");
        }

        if (ContainsAny(normalizedText, "self-hosted", "self managed", "kubernetes"))
        {
            tags.Add("self-hosted");
        }

        if (!string.IsNullOrWhiteSpace(query.ReviewContext.ComplianceNeeds))
        {
            tags.Add("compliance");
        }

        return tags;
    }

    private static string BuildNormalizedText(FoundryIqQuery query)
    {
        return string.Join(
                ' ',
                query.ArchitectureDescription,
                query.DiagramName,
                query.AnalysisPurpose,
                query.ReviewContext.BusinessDomain,
                query.ReviewContext.TargetUsers,
                query.ReviewContext.ExpectedTraffic,
                query.ReviewContext.DataSensitivity,
                query.ReviewContext.CloudProviderPreference,
                query.ReviewContext.ComplianceNeeds,
                query.ReviewContext.CurrentPainPoints)
            .ToLowerInvariant();
    }

    private static bool ContainsAny(string text, params string[] phrases)
    {
        return phrases.Any(phrase => text.Contains(phrase, StringComparison.OrdinalIgnoreCase));
    }

    private static bool HasTagOverlap(IEnumerable<string> itemTags, HashSet<string> architectureTags)
    {
        return itemTags.Any(architectureTags.Contains);
    }

    private static FoundryIqContextItem MapItem(KnowledgeBaseCatalogItem item)
    {
        return new FoundryIqContextItem
        {
            Id = item.Id,
            Category = item.Category,
            Title = item.Title,
            Summary = item.Summary,
            Content = item.Guidance,
            SourceType = "knowledge-base-catalog",
            SourceLabel = string.IsNullOrWhiteSpace(item.SourceLabel) ? item.Title : item.SourceLabel,
            SourceProvider = "LocalKnowledgeBase",
            SourceUri = string.IsNullOrWhiteSpace(item.SourceUri) ? null : item.SourceUri,
            StandardKey = item.StandardKey,
            UseCaseTags = item.UseCaseTags.ToList(),
            WhyItMatters = item.WhyItMatters,
            WhenToApply = item.WhenToApply,
            Framework = string.Equals(item.Kind, "framework-guidance", StringComparison.OrdinalIgnoreCase)
                && item.StandardKey is "AzureWellArchitected" or "AwsWellArchitected" or "Iso25010" or "OwaspAsvs"
                ? item.StandardKey
                : null,
            Principle = string.Equals(item.Kind, "architecture-principle", StringComparison.OrdinalIgnoreCase) ? item.Title : null,
            TradeoffTag = string.Equals(item.Kind, "tradeoff-guidance", StringComparison.OrdinalIgnoreCase) ? item.Title : null,
        };
    }

    private static string BuildCitation(FoundryIqContextItem item)
    {
        var label = string.IsNullOrWhiteSpace(item.SourceLabel) ? item.Title : item.SourceLabel;
        return string.IsNullOrWhiteSpace(item.SourceUri)
            ? label
            : $"{label} ({item.SourceUri})";
    }
}
