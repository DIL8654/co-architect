using CoArchitect.Application.Interfaces;
using CoArchitect.Application.Services;
using CoArchitect.Api.Services;
using CoArchitect.Infrastructure.Services;
using CoArchitect.Infrastructure.Settings;
using CoArchitect.Infrastructure.Repositories;
using CoArchitect.Infrastructure.Persistence;
using CoArchitect.Infrastructure.Seeding;
using CoArchitect.Infrastructure.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;

LocalEnvLoader.LoadIntoProcessEnvironment();

var builder = WebApplication.CreateBuilder(args);

// Configuration
var configuration = builder.Configuration;

var foundryOptions = new AzureFoundryArchitectureAgentOptions
{
    ProjectEndpoint = configuration["AZURE_AI_FOUNDRY_PROJECT_ENDPOINT"],
    AgentId = configuration["AZURE_AI_FOUNDRY_AGENT_ID"],
    ModelDeployment = configuration["AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT"],
    ApiVersion = configuration["AZURE_AI_FOUNDRY_API_VERSION"],
    ApiKey = configuration["AZURE_AI_FOUNDRY_API_KEY"] ?? configuration["AZURE_OPENAI_API_KEY"],
    BearerToken = configuration["AZURE_AI_FOUNDRY_BEARER_TOKEN"],
    ClientId = configuration["AZURE_CLIENT_ID"],
    ClientSecret = configuration["AZURE_CLIENT_SECRET"],
    TenantId = configuration["AZURE_TENANT_ID"]
};

builder.Services.AddSingleton(foundryOptions);

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
builder.Services.AddSingleton<KnowledgeBaseCatalogLoader>();
builder.Services.AddScoped<FileSystemFoundryIqProvider>();
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
    builder.Services.AddHttpClient<IArchitectureAgentService, AzureFoundryArchitectureAgentService>();
}
else
{
    builder.Services.AddScoped<IArchitectureAgentService, MockArchitectureAgentService>();
}

// Keep existing analyzer registration for backward compatibility.
builder.Services.AddScoped<IArchitectureAnalyzer, MockArchitectureAgentService>();

var app = builder.Build();

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
