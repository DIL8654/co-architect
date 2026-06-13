using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using CoArchitect.Application.Interfaces;
using CoArchitect.Infrastructure.Settings;

namespace CoArchitect.Infrastructure.Services;

public sealed class AzureFoundryInvocationService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly AzureFoundryArchitectureAgentOptions _options;
    private readonly HttpClient _httpClient;
    private readonly IAiFoundrySettingsRepository _settingsRepository;

    public AzureFoundryInvocationService(
        AzureFoundryArchitectureAgentOptions options,
        HttpClient httpClient,
        IAiFoundrySettingsRepository settingsRepository)
    {
        _options = options ?? throw new ArgumentNullException(nameof(options));
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _settingsRepository = settingsRepository ?? throw new ArgumentNullException(nameof(settingsRepository));
    }

    public async Task<AzureFoundryInvocationResult> InvokeAsync(string input, string agentId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var options = await GetEffectiveOptionsAsync(cancellationToken);
        if (!options.IsConfigured)
        {
            return AzureFoundryInvocationResult.Failure("Azure AI Foundry configuration is incomplete.");
        }

        if (string.IsNullOrWhiteSpace(agentId))
        {
            return AzureFoundryInvocationResult.Failure("Agent id is required.");
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, BuildEndpointUri(options));
            AddAuthenticationHeaders(request, options);
            request.Content = JsonContent.Create(new
            {
                model = options.ModelDeployment,
                input,
                metadata = new Dictionary<string, string>
                {
                    ["agent_id"] = agentId
                }
            });

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return AzureFoundryInvocationResult.Failure(
                    $"Azure Foundry returned {(int)response.StatusCode} {response.ReasonPhrase}. {TrimForEvidence(responseBody)}");
            }

            var outputText = ExtractOutputText(responseBody);
            return string.IsNullOrWhiteSpace(outputText)
                ? AzureFoundryInvocationResult.Failure("Azure Foundry returned no text output.")
                : AzureFoundryInvocationResult.Success(outputText!, options);
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or TaskCanceledException)
        {
            return AzureFoundryInvocationResult.Failure($"Azure Foundry call failed: {ex.Message}");
        }
    }

    public async Task<AzureFoundryArchitectureAgentOptions> GetEffectiveOptionsAsync(CancellationToken cancellationToken)
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

    public static string? ExtractOutputText(string responseBody)
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

    public static string ExtractJsonPayload(string outputText)
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

        return json;
    }

    public static Uri BuildEndpointUri(AzureFoundryArchitectureAgentOptions options)
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

    public static void AddAuthenticationHeaders(HttpRequestMessage request, AzureFoundryArchitectureAgentOptions options)
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

    private static string TrimForEvidence(string value)
    {
        var trimmed = value.ReplaceLineEndings(" ").Trim();
        return trimmed.Length <= 500 ? trimmed : $"{trimmed[..500]}...";
    }
}

public sealed class AzureFoundryInvocationResult
{
    private AzureFoundryInvocationResult(bool succeeded, string? outputText, string? failureReason, AzureFoundryArchitectureAgentOptions? options)
    {
        Succeeded = succeeded;
        OutputText = outputText;
        FailureReason = failureReason;
        EffectiveOptions = options;
    }

    public bool Succeeded { get; }
    public string? OutputText { get; }
    public string? FailureReason { get; }
    public AzureFoundryArchitectureAgentOptions? EffectiveOptions { get; }

    public static AzureFoundryInvocationResult Success(string outputText, AzureFoundryArchitectureAgentOptions options) =>
        new(true, outputText, null, options);

    public static AzureFoundryInvocationResult Failure(string failureReason) =>
        new(false, null, failureReason, null);
}
