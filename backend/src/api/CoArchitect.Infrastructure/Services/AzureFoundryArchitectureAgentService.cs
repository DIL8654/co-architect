using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Settings;

namespace CoArchitect.Infrastructure.Services;

public sealed class AzureFoundryArchitectureAgentService : IArchitectureAgentService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly AzureFoundryArchitectureAgentOptions _options;
    private readonly HttpClient _httpClient;
    private readonly IAiFoundrySettingsRepository _settingsRepository;

    public AzureFoundryArchitectureAgentService(
        AzureFoundryArchitectureAgentOptions options,
        HttpClient httpClient,
        IAiFoundrySettingsRepository settingsRepository)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _settingsRepository = settingsRepository ?? throw new ArgumentNullException(nameof(settingsRepository));
    }

    public async Task<AgentAnalysisResult> AnalyzeAsync(Guid architectureDiagramId, string diagramContent, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            var options = await GetEffectiveOptionsAsync(cancellationToken);
            if (!options.IsConfigured)
            {
                return CreateFallbackResult(architectureDiagramId, diagramContent, "Azure AI Foundry configuration is incomplete.");
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, BuildEndpointUri(options));
            AddAuthenticationHeaders(request, options);
            request.Content = JsonContent.Create(new
            {
                model = options.ModelDeployment,
                input = BuildPrompt(diagramContent),
                metadata = new Dictionary<string, string>
                {
                    ["agent_id"] = options.AgentId!
                }
            });

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return CreateFallbackResult(
                    architectureDiagramId,
                    diagramContent,
                    $"Azure Foundry returned {(int)response.StatusCode} {response.ReasonPhrase}. {TrimForEvidence(responseBody)}");
            }

            var outputText = ExtractOutputText(responseBody);
            if (string.IsNullOrWhiteSpace(outputText))
            {
                return CreateFallbackResult(architectureDiagramId, diagramContent, "Azure Foundry returned no text output.");
            }

            var parsed = ParseAgentJson(outputText);
            return parsed?.ToAgentAnalysisResult(architectureDiagramId)
                ?? CreateFallbackResult(architectureDiagramId, diagramContent, "Azure Foundry output could not be parsed as structured JSON.");
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or TaskCanceledException)
        {
            return CreateFallbackResult(architectureDiagramId, diagramContent, $"Azure Foundry call failed: {ex.Message}");
        }
    }

    private async Task<AzureFoundryArchitectureAgentOptions> GetEffectiveOptionsAsync(CancellationToken cancellationToken)
    {
        var saved = await _settingsRepository.GetAsync(cancellationToken);
        return new AzureFoundryArchitectureAgentOptions
        {
            ProjectEndpoint = First(saved?.ProjectEndpoint, _options.ProjectEndpoint),
            AgentId = First(saved?.AgentId, _options.AgentId),
            ModelDeployment = First(saved?.ModelDeployment, _options.ModelDeployment),
            ApiVersion = First(saved?.ApiVersion, _options.ApiVersion),
            ApiKey = First(saved?.ApiKey, _options.ApiKey),
            BearerToken = _options.BearerToken,
            ClientId = _options.ClientId,
            ClientSecret = _options.ClientSecret,
            TenantId = _options.TenantId,
        };
    }

    private static void AddAuthenticationHeaders(HttpRequestMessage request, AzureFoundryArchitectureAgentOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.ApiKey))
        {
            request.Headers.Add("api-key", options.ApiKey);
        }

        if (!string.IsNullOrWhiteSpace(options.BearerToken))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.BearerToken);
        }
    }

    private static string? First(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    private static string BuildPrompt(string diagramContent)
    {
        var content = string.IsNullOrWhiteSpace(diagramContent)
            ? "No architecture text was provided. Analyze based on the uploaded diagram metadata and state assumptions clearly."
            : diagramContent;

        return $$"""
        You are CoArchitect AI, an architecture review agent.

        Analyze this architecture as an enterprise architecture review and return only valid JSON with this shape:
        {
          "evidence": [{"summary": "...", "details": "..."}],
          "missingControls": [{"name": "...", "description": "...", "dimension": "Security"}],
          "recommendations": [{"description": "...", "severity": "High"}],
          "tradeoffs": [{"summary": "...", "pros": ["..."], "cons": ["..."]}],
          "dimensionMaturitySuggestions": [{"dimension": "Security", "currentMaturity": 2, "suggestedMaturity": 4, "reason": "..."}]
        }

        Allowed dimensions:
        Security, ReliabilityAvailability, ScalabilityPerformance, OperationalExcellence,
        DataTenantIsolation, ComplianceGovernance, CostOptimization, Maintainability.

        Allowed severities:
        Critical, High, Medium, Low.

        Architecture:
        {{content}}
        """;
    }

    private static Uri BuildEndpointUri(AzureFoundryArchitectureAgentOptions options)
    {
        var endpoint = options.ProjectEndpoint!;
        if (string.IsNullOrWhiteSpace(options.ApiVersion) ||
            endpoint.Contains("api-version=", StringComparison.OrdinalIgnoreCase))
        {
            return new Uri(endpoint);
        }

        var separator = endpoint.Contains('?', StringComparison.Ordinal) ? "&" : "?";
        return new Uri($"{endpoint}{separator}api-version={Uri.EscapeDataString(options.ApiVersion)}");
    }

    private static string? ExtractOutputText(string responseBody)
    {
        using var document = JsonDocument.Parse(responseBody);
        var root = document.RootElement;

        if (root.TryGetProperty("output_text", out var outputText))
        {
            return outputText.GetString();
        }

        if (root.TryGetProperty("output", out var output) && output.ValueKind == JsonValueKind.Array)
        {
            var fragments = new List<string>();
            foreach (var item in output.EnumerateArray())
            {
                if (!item.TryGetProperty("content", out var content) || content.ValueKind != JsonValueKind.Array)
                {
                    continue;
                }

                foreach (var contentItem in content.EnumerateArray())
                {
                    if (contentItem.TryGetProperty("text", out var text))
                    {
                        fragments.Add(text.GetString() ?? string.Empty);
                    }
                }
            }

            return string.Join(Environment.NewLine, fragments.Where(fragment => !string.IsNullOrWhiteSpace(fragment)));
        }

        return responseBody;
    }

    private static string TrimForEvidence(string value)
    {
        var trimmed = value.ReplaceLineEndings(" ").Trim();
        return trimmed.Length <= 500 ? trimmed : $"{trimmed[..500]}...";
    }

    private static FoundryStructuredResult? ParseAgentJson(string outputText)
    {
        var json = outputText.Trim();
        var fenceStart = json.IndexOf("```", StringComparison.Ordinal);
        if (fenceStart >= 0)
        {
            var firstLineEnd = json.IndexOf('\n', fenceStart);
            var fenceEnd = json.LastIndexOf("```", StringComparison.Ordinal);
            if (firstLineEnd >= 0 && fenceEnd > firstLineEnd)
            {
                json = json[(firstLineEnd + 1)..fenceEnd].Trim();
            }
        }

        var objectStart = json.IndexOf('{');
        var objectEnd = json.LastIndexOf('}');
        if (objectStart >= 0 && objectEnd > objectStart)
        {
            json = json[objectStart..(objectEnd + 1)];
        }

        return JsonSerializer.Deserialize<FoundryStructuredResult>(json, JsonOptions);
    }

    private static AgentAnalysisResult CreateFallbackResult(Guid architectureDiagramId, string diagramContent, string reason)
    {
        var lower = diagramContent.ToLowerInvariant();
        var missing = new List<MissingControl>();

        AddIfMissing(lower, missing, "api gateway", "API Gateway", "Add a managed API gateway for routing, throttling, versioning, and policy enforcement.", ArchitectureDimension.Security);
        AddIfMissing(lower, missing, "monitor", "Monitoring", "Add observability with logs, metrics, traces, dashboards, and alerts.", ArchitectureDimension.OperationalExcellence);
        AddIfMissing(lower, missing, "tenant isolation", "Tenant Isolation", "Define tenant boundaries in identity, data access, storage, and operational workflows.", ArchitectureDimension.DataTenantIsolation);
        AddIfMissing(lower, missing, "audit", "Audit Logging", "Capture audit trails for security-relevant and tenant-relevant actions.", ArchitectureDimension.ComplianceGovernance);
        AddIfMissing(lower, missing, "disaster recovery", "Disaster Recovery", "Define RPO/RTO, backup restore testing, and regional recovery procedures.", ArchitectureDimension.ReliabilityAvailability);
        AddIfMissing(lower, missing, "secret", "Secrets Management", "Use a managed vault and managed identity for secrets and connection strings.", ArchitectureDimension.Security);

        if (missing.Count == 0)
        {
            missing.Add(new MissingControl
            {
                Name = "Architecture Evidence",
                Description = "Add explicit evidence for security, operations, resilience, tenant isolation, and cost controls.",
                Dimension = ArchitectureDimension.OperationalExcellence
            });
        }

        var recommendations = missing
            .Select(control => new Recommendation
            {
                Description = control.Description,
                Severity = control.Dimension is ArchitectureDimension.Security or ArchitectureDimension.ReliabilityAvailability
                    ? SuggestionSeverity.High
                    : SuggestionSeverity.Medium
            })
            .ToList();

        return new AgentAnalysisResult
        {
            ArchitectureDiagramId = architectureDiagramId,
            RequestedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
            Evidence =
            {
                new EvidenceItem
                {
                    Summary = "Architecture analysis completed with local fallback.",
                    Details = reason
                }
            },
            MissingControls = missing,
            Recommendations = recommendations,
            Tradeoffs =
            {
                new Tradeoff
                {
                    Summary = "Managed Azure services reduce delivery risk but require explicit cost and access governance.",
                    Pros = { "Faster delivery", "Less infrastructure to operate", "Clear path to production hardening" },
                    Cons = { "Cloud cost must be monitored", "SAS URLs should be replaced with identity-based access later" }
                }
            },
            DimensionMaturitySuggestions =
            {
                CreateMaturity(ArchitectureDimension.Security, lower.Contains("secret") ? 3 : 2, 4, "Strengthen identity, secrets, ingress controls, and auditability."),
                CreateMaturity(ArchitectureDimension.ReliabilityAvailability, lower.Contains("disaster recovery") ? 3 : 2, 4, "Define backup, restore, failover, and recovery objectives."),
                CreateMaturity(ArchitectureDimension.OperationalExcellence, lower.Contains("monitor") ? 3 : 2, 4, "Add monitoring, alerting, and operational runbooks."),
                CreateMaturity(ArchitectureDimension.DataTenantIsolation, lower.Contains("tenant isolation") ? 3 : 2, 4, "Make tenant boundaries explicit in data and authorization flows."),
                CreateMaturity(ArchitectureDimension.CostOptimization, 3, 4, "Add budgets, alerts, and right-sized resources for the workload.")
            }
        };
    }

    private static void AddIfMissing(string content, IList<MissingControl> controls, string probe, string name, string description, ArchitectureDimension dimension)
    {
        var isMissing =
            !content.Contains(probe, StringComparison.OrdinalIgnoreCase) ||
            content.Contains($"no {probe}", StringComparison.OrdinalIgnoreCase) ||
            content.Contains($"without {probe}", StringComparison.OrdinalIgnoreCase) ||
            content.Contains($"lacks {probe}", StringComparison.OrdinalIgnoreCase) ||
            content.Contains($"missing {probe}", StringComparison.OrdinalIgnoreCase);

        if (isMissing)
        {
            controls.Add(new MissingControl
            {
                Name = name,
                Description = description,
                Dimension = dimension
            });
        }
    }

    private static DimensionMaturitySuggestion CreateMaturity(
        ArchitectureDimension dimension,
        int current,
        int suggested,
        string reason)
    {
        return new DimensionMaturitySuggestion
        {
            Dimension = dimension,
            CurrentMaturity = current,
            SuggestedMaturity = suggested,
            Reason = reason
        };
    }

    private sealed class FoundryStructuredResult
    {
        public List<FoundryEvidence> Evidence { get; init; } = new();
        public List<FoundryMissingControl> MissingControls { get; init; } = new();
        public List<FoundryRecommendation> Recommendations { get; init; } = new();
        public List<FoundryTradeoff> Tradeoffs { get; init; } = new();
        public List<FoundryMaturitySuggestion> DimensionMaturitySuggestions { get; init; } = new();

        public AgentAnalysisResult ToAgentAnalysisResult(Guid diagramId)
        {
            return new AgentAnalysisResult
            {
                ArchitectureDiagramId = diagramId,
                RequestedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
                Evidence = Evidence.Select(item => new EvidenceItem
                {
                    Summary = item.Summary,
                    Details = item.Details
                }).ToList(),
                MissingControls = MissingControls.Select(item => new MissingControl
                {
                    Name = item.Name,
                    Description = item.Description,
                    Dimension = ParseEnum(item.Dimension, ArchitectureDimension.OperationalExcellence)
                }).ToList(),
                Recommendations = Recommendations.Select(item => new Recommendation
                {
                    Description = item.Description,
                    Severity = ParseEnum(item.Severity, SuggestionSeverity.Medium)
                }).ToList(),
                Tradeoffs = Tradeoffs.Select(item => new Tradeoff
                {
                    Summary = item.Summary,
                    Pros = item.Pros,
                    Cons = item.Cons
                }).ToList(),
                DimensionMaturitySuggestions = DimensionMaturitySuggestions.Select(item => new DimensionMaturitySuggestion
                {
                    Dimension = ParseEnum(item.Dimension, ArchitectureDimension.OperationalExcellence),
                    CurrentMaturity = Math.Clamp(item.CurrentMaturity, 1, 5),
                    SuggestedMaturity = Math.Clamp(item.SuggestedMaturity, 1, 5),
                    Reason = item.Reason
                }).ToList()
            };
        }
    }

    private sealed class FoundryEvidence
    {
        public string Summary { get; init; } = string.Empty;
        public string? Details { get; init; }
    }

    private sealed class FoundryMissingControl
    {
        public string Name { get; init; } = string.Empty;
        public string Description { get; init; } = string.Empty;
        public string Dimension { get; init; } = nameof(ArchitectureDimension.OperationalExcellence);
    }

    private sealed class FoundryRecommendation
    {
        public string Description { get; init; } = string.Empty;
        public string Severity { get; init; } = nameof(SuggestionSeverity.Medium);
    }

    private sealed class FoundryTradeoff
    {
        public string Summary { get; init; } = string.Empty;
        public List<string> Pros { get; init; } = new();
        public List<string> Cons { get; init; } = new();
    }

    private sealed class FoundryMaturitySuggestion
    {
        public string Dimension { get; init; } = nameof(ArchitectureDimension.OperationalExcellence);
        public int CurrentMaturity { get; init; } = 2;
        public int SuggestedMaturity { get; init; } = 4;
        public string Reason { get; init; } = string.Empty;
    }

    private static TEnum ParseEnum<TEnum>(string value, TEnum fallback)
        where TEnum : struct
    {
        return Enum.TryParse<TEnum>(value, ignoreCase: true, out var parsed) ? parsed : fallback;
    }
}
