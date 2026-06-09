using System.Net.Http.Headers;
using System.Net.Http.Json;
using CoArchitect.Infrastructure.Persistence;
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

    public InfraHealthController(
        IServiceProvider services,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ArchitectureStorageOptions storageOptions,
        AzureFoundryArchitectureAgentOptions foundryOptions)
    {
        _services = services;
        _httpClientFactory = httpClientFactory;
        _dataStoreOptions = configuration.GetSection("DataStore").Get<DataStoreOptions>() ?? new DataStoreOptions();
        _storageOptions = storageOptions;
        _foundryOptions = foundryOptions;
    }

    [HttpGet]
    public async Task<ActionResult<InfraHealthResponse>> Get(CancellationToken cancellationToken)
    {
        var checks = new List<InfraHealthCheck>
        {
            await CheckDatabaseAsync(cancellationToken),
            await CheckBlobStorageAsync(cancellationToken),
            await CheckFoundryAsync(cancellationToken),
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
        if (!_dataStoreOptions.UsePostgres && !_dataStoreOptions.UseTiDb)
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
        if (!_foundryOptions.IsConfigured)
        {
            return InfraHealthCheck.Degraded("azureFoundry", "AzureFoundry", "Foundry endpoint, agent id, or model deployment is missing.");
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, BuildFoundryEndpointUri(_foundryOptions));
            if (!string.IsNullOrWhiteSpace(_foundryOptions.ApiKey))
            {
                request.Headers.Add("api-key", _foundryOptions.ApiKey);
            }

            if (!string.IsNullOrWhiteSpace(_foundryOptions.BearerToken))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _foundryOptions.BearerToken);
            }

            request.Content = JsonContent.Create(new
            {
                model = _foundryOptions.ModelDeployment,
                input = "Health check. Reply with a short JSON object: {\"status\":\"ok\"}.",
                metadata = new Dictionary<string, string>
                {
                    ["agent_id"] = _foundryOptions.AgentId!
                }
            });

            using var response = await client.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return InfraHealthCheck.Healthy("azureFoundry", "AzureFoundry", "Foundry endpoint accepted a request.");
            }

            var status = response.StatusCode == System.Net.HttpStatusCode.BadRequest ? "degraded" : "unhealthy";
            return new InfraHealthCheck
            {
                Name = "azureFoundry",
                Provider = "AzureFoundry",
                Status = status,
                Message = Trim($"Foundry returned {(int)response.StatusCode} {response.ReasonPhrase}. {body}"),
            };
        }
        catch (Exception ex)
        {
            return InfraHealthCheck.Unhealthy("azureFoundry", "AzureFoundry", Trim(ex.Message));
        }
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

    private static Uri BuildFoundryEndpointUri(AzureFoundryArchitectureAgentOptions options)
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

    private static string Trim(string value)
    {
        var trimmed = value.ReplaceLineEndings(" ").Trim();
        return trimmed.Length <= 500 ? trimmed : $"{trimmed[..500]}...";
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
