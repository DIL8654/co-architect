using System.Net.Http.Headers;
using System.Net.Http.Json;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Persistence;
using CoArchitect.Infrastructure.Services;
using CoArchitect.Infrastructure.Settings;
using Microsoft.AspNetCore.Mvc;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/infra-health")]
public sealed class InfraHealthController : ControllerBase
{
    private readonly IServiceProvider _services;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly DataStoreOptions _dataStoreOptions;
    private readonly ArchitectureStorageOptions _storageOptions;
    private readonly AzureFoundryArchitectureAgentOptions _foundryOptions;
    private readonly FoundryIqOptions _foundryIqOptions;
    private readonly AzureFoundryAgentExperimentOptions _experimentOptions;
    private readonly IAiFoundrySettingsRepository _foundrySettingsRepository;
    private readonly KnowledgeBaseCatalogLoader _knowledgeBaseCatalogLoader;
    private readonly AzureFoundryInvocationService _foundryInvocationService;

    public InfraHealthController(
        IServiceProvider services,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ArchitectureStorageOptions storageOptions,
        AzureFoundryArchitectureAgentOptions foundryOptions,
        FoundryIqOptions foundryIqOptions,
        AzureFoundryAgentExperimentOptions experimentOptions,
        IAiFoundrySettingsRepository foundrySettingsRepository,
        KnowledgeBaseCatalogLoader knowledgeBaseCatalogLoader,
        AzureFoundryInvocationService foundryInvocationService)
    {
        _services = services;
        _httpClientFactory = httpClientFactory;
        _dataStoreOptions = configuration.GetSection("DataStore").Get<DataStoreOptions>() ?? new DataStoreOptions();
        _storageOptions = storageOptions;
        _foundryOptions = foundryOptions;
        _foundryIqOptions = foundryIqOptions;
        _experimentOptions = experimentOptions;
        _foundrySettingsRepository = foundrySettingsRepository;
        _knowledgeBaseCatalogLoader = knowledgeBaseCatalogLoader;
        _foundryInvocationService = foundryInvocationService;
    }

    [HttpGet]
    public async Task<ActionResult<InfraHealthResponse>> Get(CancellationToken cancellationToken)
    {
        var checks = new List<InfraHealthCheck>
        {
            await CheckDatabaseAsync(cancellationToken),
            await CheckBlobStorageAsync(cancellationToken),
            await CheckFoundryAsync(cancellationToken),
            await CheckManagedFoundryIqAsync(cancellationToken),
            CheckAgentMode(),
            CheckFoundryIqCatalog(),
        };

        var status = checks.Any(check => check.Status == "unhealthy")
            ? "unhealthy"
            : checks.Any(check => check.Status == "degraded")
                ? "degraded"
                : "healthy";

        return Ok(new InfraHealthResponse
        {
            Status = status,
            CheckedAt = DateTime.UtcNow,
            Checks = checks,
        });
    }

    private async Task<InfraHealthCheck> CheckDatabaseAsync(CancellationToken cancellationToken)
    {
        if (!_dataStoreOptions.UseTiDb)
        {
            return InfraHealthCheck.Healthy("database", _dataStoreOptions.Provider, "Using in-memory mock store.");
        }

        try
        {
            var store = _services.GetRequiredService<IObjectStore>();
            _ = await store.GetAllAsync<object>("health_check", cancellationToken);

            return InfraHealthCheck.Healthy("database", _dataStoreOptions.Provider, "Database connection succeeded.");
        }
        catch (Exception ex)
        {
            return InfraHealthCheck.Unhealthy("database", _dataStoreOptions.Provider, Trim(ex.Message));
        }
    }

    private async Task<InfraHealthCheck> CheckBlobStorageAsync(CancellationToken cancellationToken)
    {
        if (!_storageOptions.UseAzureBlobSas)
        {
            return InfraHealthCheck.Healthy("blobStorage", _storageOptions.Provider, "Blob storage is disabled for this local run.");
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Put, BuildBlobUri(_storageOptions.ContainerSasUrl!, "_health/local-health-check.txt"));
            request.Headers.Add("x-ms-blob-type", "BlockBlob");
            request.Content = new StringContent($"CoArchitect health check {DateTime.UtcNow:O}");
            request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/plain");
            using var response = await client.SendAsync(request, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return InfraHealthCheck.Healthy("blobStorage", _storageOptions.Provider, "Blob container SAS accepted a test upload.");
            }

            return InfraHealthCheck.Degraded(
                "blobStorage",
                _storageOptions.Provider,
                $"Blob check returned {(int)response.StatusCode} {response.ReasonPhrase}.");
        }
        catch (Exception ex)
        {
            return InfraHealthCheck.Unhealthy("blobStorage", _storageOptions.Provider, Trim(ex.Message));
        }
    }

    private async Task<InfraHealthCheck> CheckFoundryAsync(CancellationToken cancellationToken)
    {
        var foundryOptions = await GetEffectiveFoundryOptionsAsync(cancellationToken);
        if (!foundryOptions.IsConfigured)
        {
            return InfraHealthCheck.Degraded("azureFoundry", "AzureFoundry", "Foundry endpoint, agent id, or model deployment is missing.");
        }

        try
        {
            var auth = await _foundryInvocationService.BuildAuthenticationAsync(foundryOptions, cancellationToken);
            if (auth.Mode == FoundryAuthenticationMode.Unavailable)
            {
                return InfraHealthCheck.Unhealthy("azureFoundry", "AzureFoundry", auth.Note ?? "No usable Foundry authentication was available.");
            }

            var client = _httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, BuildFoundryEndpointUri(foundryOptions));
            AzureFoundryInvocationService.ApplyAuthenticationHeaders(request, auth);

            request.Content = JsonContent.Create(new
            {
                model = foundryOptions.ModelDeployment,
                input = "Health check. Reply with a short JSON object: {\"status\":\"ok\"}.",
                metadata = new Dictionary<string, string>
                {
                    ["agent_id"] = foundryOptions.AgentId!
                }
            });

            using var response = await client.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return InfraHealthCheck.Healthy("azureFoundry", "AzureFoundry", $"Foundry endpoint accepted a request using {DescribeAuthMode(auth.Mode)}.");
            }

            var status = response.StatusCode == System.Net.HttpStatusCode.BadRequest ? "degraded" : "unhealthy";
            return new InfraHealthCheck
            {
                Name = "azureFoundry",
                Provider = "AzureFoundry",
                Status = status,
                Message = Trim($"Foundry returned {(int)response.StatusCode} {response.ReasonPhrase} using {DescribeAuthMode(auth.Mode)}. {body}"),
            };
        }
        catch (Exception ex)
        {
            return InfraHealthCheck.Unhealthy("azureFoundry", "AzureFoundry", Trim(ex.Message));
        }
    }

    private InfraHealthCheck CheckFoundryIqCatalog()
    {
        if (_knowledgeBaseCatalogLoader.CatalogExists)
        {
            return InfraHealthCheck.Healthy(
                "foundryIqCatalog",
                "LocalKnowledgeBase",
                $"Foundry IQ catalog loaded from {_knowledgeBaseCatalogLoader.CatalogPath}.");
        }

        return InfraHealthCheck.Degraded(
            "foundryIqCatalog",
            "LocalKnowledgeBase",
            $"Foundry IQ catalog was not found at {_knowledgeBaseCatalogLoader.CatalogPath}. Live analysis will fall back to minimal baseline guidance.");
    }

    private async Task<InfraHealthCheck> CheckManagedFoundryIqAsync(CancellationToken cancellationToken)
    {
        if (_foundryIqOptions.UseLocalOnly)
        {
            return InfraHealthCheck.Healthy("managedFoundryIq", "LocalFallback", "Managed Foundry IQ is disabled; local knowledge base is the active source.");
        }

        if (string.IsNullOrWhiteSpace(_foundryIqOptions.AgentId))
        {
            return InfraHealthCheck.Degraded("managedFoundryIq", "AzureFoundryIQ", "Managed Foundry IQ provider is enabled, but no retrieval agent id is configured.");
        }

        var foundryOptions = await GetEffectiveFoundryOptionsAsync(cancellationToken);
        if (!foundryOptions.IsConfigured)
        {
            return InfraHealthCheck.Degraded("managedFoundryIq", "AzureFoundryIQ", "Managed Foundry IQ requires the base Azure Foundry endpoint, agent, and model configuration.");
        }

        try
        {
            var auth = await _foundryInvocationService.BuildAuthenticationAsync(foundryOptions, cancellationToken);
            if (auth.Mode == FoundryAuthenticationMode.Unavailable)
            {
                return InfraHealthCheck.Unhealthy("managedFoundryIq", "AzureFoundryIQ", auth.Note ?? "No usable Foundry authentication was available.");
            }

            var client = _httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, BuildFoundryEndpointUri(foundryOptions));
            AzureFoundryInvocationService.ApplyAuthenticationHeaders(request, auth);

            request.Content = JsonContent.Create(new
            {
                model = foundryOptions.ModelDeployment,
                input = "Return a short plain-text confirmation that the managed knowledge base is reachable.",
                metadata = new Dictionary<string, string>
                {
                    ["agent_id"] = _foundryIqOptions.AgentId
                }
            });

            using var response = await client.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                return InfraHealthCheck.Healthy("managedFoundryIq", "AzureFoundryIQ", $"Managed Foundry IQ retrieval agent accepted a request using {DescribeAuthMode(auth.Mode)}.");
            }

            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            return InfraHealthCheck.Degraded("managedFoundryIq", "AzureFoundryIQ", Trim($"Managed retrieval returned {(int)response.StatusCode} {response.ReasonPhrase} using {DescribeAuthMode(auth.Mode)}. {body}"));
        }
        catch (Exception ex)
        {
            return InfraHealthCheck.Unhealthy("managedFoundryIq", "AzureFoundryIQ", Trim(ex.Message));
        }
    }

    private InfraHealthCheck CheckAgentMode()
    {
        if (_experimentOptions.UseHybridPromptAgents)
        {
            return InfraHealthCheck.Healthy("architectureAgentMode", "AzureFoundry", "Architecture analysis is configured for the hybrid prompt-agent experiment with planner, reviewer, and critic/composer agents.");
        }

        return InfraHealthCheck.Healthy("architectureAgentMode", "AzureFoundry", "Architecture analysis is using the stable single-expert mode.");
    }

    private static Uri BuildBlobUri(string containerSasUrl, string blobPath)
    {
        var separatorIndex = containerSasUrl.IndexOf('?', StringComparison.Ordinal);
        var baseUrl = separatorIndex >= 0 ? containerSasUrl[..separatorIndex] : containerSasUrl;
        var query = separatorIndex >= 0 ? containerSasUrl[separatorIndex..] : string.Empty;
        var escapedPath = string.Join(
            '/',
            blobPath.Split('/', StringSplitOptions.RemoveEmptyEntries)
                .Select(Uri.EscapeDataString));

        return new Uri($"{baseUrl.TrimEnd('/')}/{escapedPath}{query}");
    }

    private async Task<AzureFoundryArchitectureAgentOptions> GetEffectiveFoundryOptionsAsync(CancellationToken cancellationToken)
    {
        var saved = await _foundrySettingsRepository.GetAsync(cancellationToken);
        return new AzureFoundryArchitectureAgentOptions
        {
            ProjectEndpoint = First(saved?.ProjectEndpoint, _foundryOptions.ProjectEndpoint),
            AgentId = First(saved?.AgentId, _foundryOptions.AgentId),
            ModelDeployment = First(saved?.ModelDeployment, _foundryOptions.ModelDeployment),
            ApiVersion = First(saved?.ApiVersion, _foundryOptions.ApiVersion),
            ApiKey = First(saved?.ApiKey, _foundryOptions.ApiKey),
            BearerToken = _foundryOptions.BearerToken,
            ClientId = _foundryOptions.ClientId,
            ClientSecret = _foundryOptions.ClientSecret,
            TenantId = _foundryOptions.TenantId,
        };
    }

    private static string? First(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    private static Uri BuildFoundryEndpointUri(AzureFoundryArchitectureAgentOptions options)
    {
        var endpoint = AzureFoundryInvocationService.NormalizeResponsesEndpoint(options.ProjectEndpoint!);
        if (string.IsNullOrWhiteSpace(options.ApiVersion) ||
            endpoint.Contains("api-version=", StringComparison.OrdinalIgnoreCase))
        {
            return new Uri(endpoint);
        }

        var separator = endpoint.Contains('?', StringComparison.Ordinal) ? "&" : "?";
        return new Uri($"{endpoint}{separator}api-version={Uri.EscapeDataString(options.ApiVersion)}");
    }

    private static string Trim(string value)
    {
        var trimmed = value.ReplaceLineEndings(" ").Trim();
        return trimmed.Length <= 500 ? trimmed : $"{trimmed[..500]}...";
    }

    private static string DescribeAuthMode(FoundryAuthenticationMode mode)
    {
        return mode switch
        {
            FoundryAuthenticationMode.ManagedIdentity => "DefaultAzureCredential / managed identity",
            FoundryAuthenticationMode.StaticBearer => "explicit bearer token",
            FoundryAuthenticationMode.ApiKey => "API key fallback",
            _ => "no auth",
        };
    }
}

public sealed class InfraHealthResponse
{
    public string Status { get; init; } = "unknown";
    public DateTime CheckedAt { get; init; }
    public IList<InfraHealthCheck> Checks { get; init; } = new List<InfraHealthCheck>();
}

public sealed class InfraHealthCheck
{
    public string Name { get; init; } = string.Empty;
    public string Provider { get; init; } = string.Empty;
    public string Status { get; init; } = "unknown";
    public string Message { get; init; } = string.Empty;

    public static InfraHealthCheck Healthy(string name, string provider, string message) =>
        new() { Name = name, Provider = provider, Status = "healthy", Message = message };

    public static InfraHealthCheck Degraded(string name, string provider, string message) =>
        new() { Name = name, Provider = provider, Status = "degraded", Message = message };

    public static InfraHealthCheck Unhealthy(string name, string provider, string message) =>
        new() { Name = name, Provider = provider, Status = "unhealthy", Message = message };
}
