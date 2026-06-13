using CoArchitect.Application.Interfaces;
using CoArchitect.Application.Services;
using CoArchitect.Api.Services;
using CoArchitect.Infrastructure.Services;
using CoArchitect.Infrastructure.Settings;
using CoArchitect.Infrastructure.Repositories;
using CoArchitect.Infrastructure.Persistence;
using CoArchitect.Infrastructure.Seeding;
using CoArchitect.Infrastructure.Storage;
using System.Text.Json;
using System.Threading.RateLimiting;
using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;

LocalEnvLoader.LoadIntoProcessEnvironment();

var builder = WebApplication.CreateBuilder(args);

// Configuration
var configuration = builder.Configuration;

static string? ReadSetting(IConfiguration config, params string[] keys)
{
    foreach (var key in keys)
    {
        var value = config[key] ?? Environment.GetEnvironmentVariable(key);
        if (!string.IsNullOrWhiteSpace(value))
        {
            return TrimWrappingQuotes(value.Trim());
        }
    }

    return null;
}

static string TrimWrappingQuotes(string value)
{
    if (value.Length >= 2 &&
        ((value.StartsWith('\"') && value.EndsWith('\"')) ||
         (value.StartsWith('\'') && value.EndsWith('\''))))
    {
        return value[1..^1];
    }

    return value;
}

var foundryOptions = new AzureFoundryArchitectureAgentOptions
{
    EndpointMode = ReadSetting(configuration, "ArchitectureAgent:EndpointMode", "ArchitectureAgent__EndpointMode") ?? "LegacyAgent",
    LegacyAgentEndpoint = ReadSetting(configuration, "AZURE_AI_FOUNDRY_LEGACY_AGENT_ENDPOINT", "AzureFoundry:LegacyAgentEndpoint", "AzureFoundry__LegacyAgentEndpoint"),
    ProjectEndpoint = ReadSetting(configuration, "AZURE_AI_FOUNDRY_PROJECT_ENDPOINT", "AzureFoundry:ProjectEndpoint", "AzureFoundry__ProjectEndpoint"),
    AgentId = ReadSetting(configuration, "AZURE_AI_FOUNDRY_AGENT_ID", "AzureFoundry:AgentId", "AzureFoundry__AgentId"),
    ModelDeployment = ReadSetting(configuration, "AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT", "AzureFoundry:ModelDeployment", "AzureFoundry__ModelDeployment"),
    ApiVersion = ReadSetting(configuration, "AZURE_AI_FOUNDRY_API_VERSION", "AzureFoundry:ApiVersion", "AzureFoundry__ApiVersion"),
    ApiKey = ReadSetting(configuration, "AZURE_AI_FOUNDRY_API_KEY", "AZURE_OPENAI_API_KEY", "AzureFoundry:ApiKey", "AzureFoundry__ApiKey"),
    BearerToken = ReadSetting(configuration, "AZURE_AI_FOUNDRY_BEARER_TOKEN", "AzureFoundry:BearerToken", "AzureFoundry__BearerToken"),
    ClientId = ReadSetting(configuration, "AZURE_CLIENT_ID"),
    ClientSecret = ReadSetting(configuration, "AZURE_CLIENT_SECRET"),
    TenantId = ReadSetting(configuration, "AZURE_TENANT_ID")
};

builder.Services.AddSingleton(foundryOptions);
builder.Services.AddSingleton(new FoundryIqOptions
{
    Provider = ReadSetting(configuration, "FoundryIq:Provider", "FoundryIq__Provider") ?? "Local",
    AgentId = ReadSetting(configuration, "AZURE_AI_FOUNDRY_IQ_AGENT_ID", "FoundryIq:AgentId", "FoundryIq__AgentId"),
});
builder.Services.AddSingleton(new AzureFoundryAgentExperimentOptions
{
    Mode = ReadSetting(configuration, "ArchitectureAgent:Mode", "ArchitectureAgent__Mode") ?? "SingleExpert",
    PlannerAgentId = ReadSetting(configuration, "AZURE_AI_FOUNDRY_PLANNER_AGENT_ID", "ArchitectureAgent:PlannerAgentId", "ArchitectureAgent__PlannerAgentId"),
    ReviewerAgentId = ReadSetting(configuration, "AZURE_AI_FOUNDRY_REVIEWER_AGENT_ID", "ArchitectureAgent:ReviewerAgentId", "ArchitectureAgent__ReviewerAgentId"),
    CriticComposerAgentId = ReadSetting(configuration, "AZURE_AI_FOUNDRY_CRITIC_AGENT_ID", "ArchitectureAgent:CriticComposerAgentId", "ArchitectureAgent__CriticComposerAgentId"),
});

var dataStoreOptions = configuration.GetSection("DataStore").Get<DataStoreOptions>() ?? new DataStoreOptions();
var storageOptions = configuration.GetSection("ArchitectureStorage").Get<ArchitectureStorageOptions>() ?? new ArchitectureStorageOptions();
builder.Services.AddSingleton(storageOptions);

// CORS
var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://127.0.0.1:5173", "http://[::1]:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Services: add health checks, swagger, and DI placeholders
builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        TimeSpan? retryAfter = null;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfterValue))
        {
            retryAfter = retryAfterValue;
            context.HttpContext.Response.Headers.RetryAfter = Math.Max(1, (int)Math.Ceiling(retryAfterValue.TotalSeconds)).ToString();
        }

        var factory = context.HttpContext.RequestServices.GetRequiredService<ProblemDetailsFactory>();
        var problemDetails = AnalysisRateLimiting.CreateProblemDetails(factory, context.HttpContext, retryAfter);

        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/problem+json";
        await context.HttpContext.Response.WriteAsync(
            JsonSerializer.Serialize(problemDetails),
            cancellationToken);
    };

    options.AddPolicy(AnalysisRateLimiting.PolicyName, httpContext =>
    {
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: AnalysisRateLimiting.ResolveClientKey(httpContext),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = AnalysisRateLimiting.PermitLimit,
                Window = AnalysisRateLimiting.Window,
                QueueLimit = 0,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true,
            });
    });
});
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var factory = context.HttpContext.RequestServices.GetRequiredService<ProblemDetailsFactory>();
        var problemDetails = factory.CreateValidationProblemDetails(
            context.HttpContext,
            context.ModelState,
            statusCode: StatusCodes.Status400BadRequest,
            title: "Validation failed");

        return new BadRequestObjectResult(problemDetails)
        {
            ContentTypes = { "application/problem+json" },
        };
    };
});

builder.Services.AddScoped<ICurrentUserService, LocalCurrentUserService>();
builder.Services.AddScoped<IArchitectureIntelligenceScoreService, ArchitectureIntelligenceScoreService>();
builder.Services.AddScoped<IFrameworkSelectionService, FrameworkSelectionService>();
builder.Services.AddSingleton<PerformanceCacheService>();
builder.Services.AddScoped<PerformanceReadModelService>();
builder.Services.AddSingleton<KnowledgeBaseCatalogLoader>();
builder.Services.AddScoped<FileSystemFoundryIqProvider>();
builder.Services.AddHttpClient<AzureFoundryInvocationService>();
builder.Services.AddScoped<AzureFoundryIqProvider>();
builder.Services.AddScoped<IFoundryIqKnowledgeProvider, HybridFoundryIqKnowledgeProvider>();
builder.Services.AddScoped<IFoundryIqProvider, CompositeFoundryIqProvider>();
builder.Services.AddScoped<IContextEnrichmentAgent, ContextEnrichmentAgent>();
builder.Services.AddScoped<IMultiAgentArchitectureAnalysisService, MultiAgentArchitectureAnalysisService>();
builder.Services.AddScoped<IAdrGenerationService, AdrGenerationService>();
builder.Services.AddScoped<HackathonDemoSeeder>();

if (dataStoreOptions.UseTiDb)
{
    var connectionString = configuration.GetConnectionString("DefaultConnection") ?? configuration.GetConnectionString("Default");
    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException("DataStore__Provider=TiDB requires ConnectionStrings__DefaultConnection or ConnectionStrings__Default.");
    }

    builder.Services.AddSingleton<IObjectStore>(new TidbObjectStore(connectionString));
    builder.Services.AddSingleton<IRelationalConnectionFactory>(new TidbConnectionFactory(connectionString));
    builder.Services.AddSingleton<RelationalSchemaInitializer>();
    builder.Services.AddScoped<IAiFoundrySettingsRepository, ObjectStoreAiFoundrySettingsRepository>();
    builder.Services.AddScoped<IOrganizationRepository, TidbOrganizationRepository>();
    builder.Services.AddScoped<IWorkspaceRepository, TidbWorkspaceRepository>();
    builder.Services.AddScoped<IDiagramRepository, TidbDiagramRepository>();
    builder.Services.AddScoped<IDiagramCommentRepository, TidbDiagramCommentRepository>();
    builder.Services.AddScoped<IAgentAnalysisRunRepository, TidbAgentAnalysisRunRepository>();
    builder.Services.AddScoped<IAdrRepository, TidbAdrRepository>();
}
else
{
    builder.Services.AddScoped<IOrganizationRepository, MockOrganizationRepository>();
    builder.Services.AddScoped<IAiFoundrySettingsRepository, InMemoryAiFoundrySettingsRepository>();
    builder.Services.AddScoped<IWorkspaceRepository, MockWorkspaceRepository>();
    builder.Services.AddScoped<IDiagramRepository, MockDiagramRepository>();
    builder.Services.AddScoped<IDiagramCommentRepository, MockDiagramCommentRepository>();
    builder.Services.AddScoped<IAgentAnalysisRunRepository, MockAgentAnalysisRunRepository>();
    builder.Services.AddScoped<IAdrRepository, MockAdrRepository>();
}

if (storageOptions.UseAzureBlobSas)
{
    builder.Services.AddHttpClient<IArchitectureFileStorage, SasBlobArchitectureFileStorage>();
}
else
{
    builder.Services.AddScoped<IArchitectureFileStorage, NoopArchitectureFileStorage>();
}

builder.Services.AddControllers();

var architectureAgentProvider = configuration["ArchitectureAgent:Provider"];
if (string.Equals(architectureAgentProvider, "AzureFoundry", StringComparison.OrdinalIgnoreCase) ||
    (!string.Equals(architectureAgentProvider, "Mock", StringComparison.OrdinalIgnoreCase) && foundryOptions.IsConfigured))
{
    builder.Services.AddScoped<IArchitectureAgentService, AzureFoundryArchitectureAgentService>();
}
else
{
    builder.Services.AddScoped<IArchitectureAgentService, MockArchitectureAgentService>();
}

// Keep existing analyzer registration for backward compatibility.
builder.Services.AddScoped<IArchitectureAnalyzer, MockArchitectureAgentService>();

var app = builder.Build();

app.Use(async (context, next) =>
{
    var stopwatch = Stopwatch.StartNew();
    await next();
    stopwatch.Stop();

    if (context.Request.Path.StartsWithSegments("/api"))
    {
        var loggerFactory = context.RequestServices.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("CoArchitect.Api.RequestTiming");
        logger.LogInformation(
            "{Method} {Path} responded {StatusCode} in {ElapsedMs} ms",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            stopwatch.ElapsedMilliseconds);
    }
});

if (configuration.GetValue("DemoData:Enabled", true))
{
    using var scope = app.Services.CreateScope();
    var seeder = scope.ServiceProvider.GetRequiredService<HackathonDemoSeeder>();
    await seeder.EnsureSeededAsync(CancellationToken.None);
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        await Results.Problem(
            title: "Server error",
            detail: "An unexpected error occurred while processing the request.",
            statusCode: StatusCodes.Status500InternalServerError)
            .ExecuteAsync(context);
    });
});

app.UseRateLimiter();

// Middleware: CORS must be before endpoints
app.UseCors("AllowFrontend");

// Middleware: Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

// Health endpoint
app.MapHealthChecks("/health");

app.Run();

public partial class Program;
