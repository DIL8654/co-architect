using CoArchitect.Api.Controllers;
using CoArchitect.Api.DTOs;
using CoArchitect.Api.Services;
using CoArchitect.Application.Interfaces;
using CoArchitect.Application.Services;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Repositories;
using CoArchitect.Infrastructure.Seeding;
using CoArchitect.Infrastructure.Services;
using CoArchitect.Infrastructure.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CoArchitect.Application.Tests;

public class UnauthenticatedMvpEndpointTests
{
    [Fact]
    public void LocalCurrentUser_IsStableTenantScopedPlaceholder()
    {
        var user = new LocalCurrentUserService().GetCurrentUser();

        Assert.Equal(Guid.Parse("00000000-0000-0000-0000-000000000001"), user.UserId);
        Assert.Equal(Guid.Parse("00000000-0000-0000-0000-000000000101"), user.TenantId);
        Assert.Equal("local-admin@coarchitect.ai", user.Email);
        Assert.Equal("CoArchitect Local Admin", user.DisplayName);
        Assert.Contains(FronteggRoles.Admin, user.Roles);
    }

    [Fact]
    public async Task RequiredMvpFlow_WorksWithoutAuth()
    {
        var currentUserService = new LocalCurrentUserService();
        var workspaceRepository = new MockWorkspaceRepository();
        var diagramRepository = new MockDiagramRepository();
        var commentRepository = new MockDiagramCommentRepository();
        var analysisRepository = new MockAgentAnalysisRunRepository();
        var adrRepository = new MockAdrRepository();
        IFrameworkSelectionService frameworkSelectionService = new FrameworkSelectionService();

        var workspacesController = new WorkspacesController(
            workspaceRepository,
            diagramRepository,
            commentRepository,
            analysisRepository,
            adrRepository,
            currentUserService,
            NullLogger<WorkspacesController>.Instance);
        var diagramsController = new DiagramsController(
            diagramRepository,
            workspaceRepository,
            commentRepository,
            analysisRepository,
            adrRepository,
            currentUserService,
            new NoopArchitectureFileStorage(),
            frameworkSelectionService,
            new ArchitectureIntelligenceScoreService(),
            NullLogger<DiagramsController>.Instance);
        var commentsController = new DiagramCommentsController(
            commentRepository,
            diagramRepository,
            workspaceRepository,
            currentUserService,
            NullLogger<DiagramCommentsController>.Instance);
        var analysisController = new DiagramAnalysisController(
            analysisRepository,
            diagramRepository,
            new MultiAgentArchitectureAnalysisService(
                new MockArchitectureAgentService(),
                frameworkSelectionService,
                new ContextEnrichmentAgent(new TestFoundryIqProvider())),
            new ArchitectureIntelligenceScoreService(),
            workspaceRepository,
            currentUserService,
            NullLogger<DiagramAnalysisController>.Instance);
        var adrsController = new AdrsController(
            adrRepository,
            new AdrGenerationService(),
            diagramRepository,
            workspaceRepository,
            commentRepository,
            analysisRepository,
            currentUserService);

        var createdWorkspace = await workspacesController.CreateWorkspace(
            new CreateWorkspaceRequest { Name = "Test Workspace" },
            CancellationToken.None);
        var workspace = AssertCreated<WorkspaceResponse>(createdWorkspace);

        var workspaces = AssertOk<IEnumerable<WorkspaceResponse>>(
            await workspacesController.ListWorkspaces(CancellationToken.None));
        Assert.Contains(workspaces, item => item.Id == workspace.Id);

        var createdDiagram = await diagramsController.UploadDiagram(
            workspace.Id,
            new UploadDiagramRequest
            {
                WorkspaceId = workspace.Id,
                Name = "Test Architecture",
                Description = "React frontend, .NET API, TiDB, no monitoring, no tenant isolation, no audit logging.",
                ReviewSetupJson = """
                {
                  "businessDomain":"B2B SaaS",
                  "targetUsers":"External customer tenants",
                  "expectedTraffic":"Moderate burst traffic",
                  "dataSensitivity":"PII",
                  "cloudProviderPreference":"Azure",
                  "complianceNeeds":"Audit logging and tenant isolation",
                  "currentPainPoints":"No monitoring",
                  "frameworkSelectionMode":"AutoDetect",
                  "requestedFrameworks":[],
                  "qualityAttributeWeights":[
                    { "key":"security","label":"Security","weight":25 },
                    { "key":"availability","label":"Availability","weight":20 },
                    { "key":"scalability","label":"Scalability","weight":15 },
                    { "key":"cost","label":"Cost","weight":10 },
                    { "key":"maintainability","label":"Maintainability","weight":10 },
                    { "key":"compliance","label":"Compliance","weight":10 },
                    { "key":"deliverySpeed","label":"Delivery Speed","weight":10 }
                  ]
                }
                """,
            },
            CancellationToken.None);
        var diagram = AssertCreated<ArchitectureDiagramResponse>(createdDiagram);
        Assert.Equal(LocalCurrentUserService.UserId, diagram.UploadedByUserId);
        Assert.Null(diagram.ArchitectureScore);

        var diagrams = AssertOk<IEnumerable<ArchitectureDiagramResponse>>(
            await diagramsController.ListDiagrams(workspace.Id, null, CancellationToken.None));
        Assert.Contains(diagrams, item => item.Id == diagram.Id);

        var loadedDiagram = AssertOk<ArchitectureDiagramResponse>(
            await diagramsController.GetDiagram(diagram.Id, CancellationToken.None));
        Assert.Equal(diagram.Id, loadedDiagram.Id);

        var createdComment = await commentsController.CreateComment(
            workspace.Id,
            diagram.Id,
            new CreateCommentRequest { DiagramId = diagram.Id, Content = "Looks ready for analysis." },
            CancellationToken.None);
        var comment = AssertCreated<DiagramCommentResponse>(createdComment);
        Assert.Equal(LocalCurrentUserService.UserId, comment.UserId);

        var comments = AssertOk<IEnumerable<DiagramCommentResponse>>(
            await commentsController.GetDiagramComments(workspace.Id, diagram.Id, CancellationToken.None));
        Assert.Contains(comments, item => item.Id == comment.Id);

        var runResult = await analysisController.RunAnalysis(workspace.Id, diagram.Id, CancellationToken.None);
        var analysis = AssertOk<ArchitectureAnalysisResponse>(runResult);
        Assert.NotEqual(Guid.Empty, analysis.Id);
        Assert.True(analysis.FinalScore > 0);
        Assert.NotEmpty(analysis.AgentTrace);
        Assert.Contains(analysis.AgentTrace, item => item.AgentName == "Context Enrichment Agent");
        Assert.Contains(analysis.AgentTrace, item => item.AgentName == "Critic / Verifier Agent");
        Assert.NotEmpty(analysis.FoundryIqContext.CitationRefs);
        Assert.True(analysis.FoundryIqContext.FrameworkGuidanceItems.Count > 0);

        var loadedAnalysis = AssertOk<ArchitectureAnalysisResponse>(
            await analysisController.GetAnalysisRun(workspace.Id, diagram.Id, analysis.Id, CancellationToken.None));
        Assert.Equal(analysis.Id, loadedAnalysis.Id);

        var history = AssertOk<IEnumerable<AnalysisRunTimelineItemResponse>>(
            await analysisController.ListAnalysisRuns(workspace.Id, diagram.Id, CancellationToken.None));
        Assert.Contains(history, item => item.Id == analysis.Id);

        diagrams = AssertOk<IEnumerable<ArchitectureDiagramResponse>>(
            await diagramsController.ListDiagrams(workspace.Id, null, CancellationToken.None));
        var rescoredDiagram = Assert.Single(diagrams.Where(item => item.Id == diagram.Id));
        Assert.NotNull(rescoredDiagram.ArchitectureScore);

        loadedDiagram = AssertOk<ArchitectureDiagramResponse>(
            await diagramsController.GetDiagram(diagram.Id, CancellationToken.None));
        Assert.NotNull(loadedDiagram.ArchitectureScore);

        var adrResponse = AssertCreated<AdrResponse>(
            await adrsController.Generate(workspace.Id, diagram.Id, CancellationToken.None));
        Assert.Equal(1, adrResponse.LatestVersionNumber);
        Assert.NotNull(adrResponse.LatestVersion);

        var regenerated = AssertOk<AdrResponse>(
            await adrsController.Regenerate(workspace.Id, diagram.Id, adrResponse.Id, CancellationToken.None));
        Assert.Equal(2, regenerated.LatestVersionNumber);
        Assert.Equal(2, regenerated.Versions.Count);
    }

    [Fact]
    public async Task HackathonDemoSeeder_CreatesCompleteIdempotentSyntheticJourneys()
    {
        var workspaceRepository = new MockWorkspaceRepository();
        var diagramRepository = new MockDiagramRepository();
        var analysisRepository = new MockAgentAnalysisRunRepository();
        var adrRepository = new MockAdrRepository();
        var seeder = new HackathonDemoSeeder(workspaceRepository, diagramRepository, analysisRepository, adrRepository);

        await seeder.EnsureSeededAsync(CancellationToken.None);
        await seeder.EnsureSeededAsync(CancellationToken.None);

        var workspaces = (await workspaceRepository.GetAllAsync(CancellationToken.None)).ToList();
        var demoWorkspaces = workspaces.Where(item => item.Name.StartsWith(HackathonDemoSeeder.DemoDataPrefix, StringComparison.Ordinal)).ToList();

        Assert.Equal(3, demoWorkspaces.Count);

        foreach (var workspace in demoWorkspaces)
        {
            var diagrams = (await diagramRepository.GetByWorkspaceIdAsync(workspace.Id, CancellationToken.None)).ToList();
            Assert.Single(diagrams);

            var diagram = diagrams[0];
            var latestAnalysis = await analysisRepository.GetLatestByDiagramIdAsync(diagram.Id, CancellationToken.None);
            Assert.NotNull(latestAnalysis);
            Assert.NotNull(latestAnalysis.Result);
            Assert.NotEmpty(latestAnalysis.Result.AgentTrace);
            Assert.Contains(latestAnalysis.Result.AgentTrace, item => item.AgentName == "Foundry IQ Retrieval");
            Assert.Contains(latestAnalysis.Result.AgentTrace, item => item.AgentName == "Recommendation Composer Agent");
            Assert.NotEmpty(latestAnalysis.Result.FoundryIqContext.CitationRefs);
            Assert.NotEmpty(latestAnalysis.Result.FoundryIqContext.FrameworkGuidanceItems);
            Assert.NotEmpty(latestAnalysis.Result.MissingControls);
            Assert.NotEmpty(latestAnalysis.Result.Tradeoffs);

            var adrs = (await adrRepository.GetByDiagramIdAsync(diagram.Id, CancellationToken.None)).ToList();
            Assert.NotEmpty(adrs);

            foreach (var adr in adrs)
            {
                var versions = (await adrRepository.GetVersionsAsync(adr.Id, CancellationToken.None)).ToList();
                Assert.True(versions.Count >= 3);
                Assert.Equal(versions.Count, adr.LatestVersionNumber);
                Assert.All(versions, version =>
                {
                    Assert.False(string.IsNullOrWhiteSpace(version.Markdown));
                    Assert.False(string.IsNullOrWhiteSpace(version.Html));
                });
            }
        }
    }

    [Fact]
    public async Task ScoringEngine_StillCalculatesFinalScore()
    {
        var scoreService = new ArchitectureIntelligenceScoreService();
        var score = await scoreService.CalculateAsync(
            new Dictionary<CoArchitect.Domain.Enums.ArchitectureDimension, int>
            {
                [CoArchitect.Domain.Enums.ArchitectureDimension.Security] = 2,
                [CoArchitect.Domain.Enums.ArchitectureDimension.ReliabilityAvailability] = 2,
                [CoArchitect.Domain.Enums.ArchitectureDimension.ScalabilityPerformance] = 3,
                [CoArchitect.Domain.Enums.ArchitectureDimension.OperationalExcellence] = 2,
                [CoArchitect.Domain.Enums.ArchitectureDimension.DataTenantIsolation] = 1,
                [CoArchitect.Domain.Enums.ArchitectureDimension.ComplianceGovernance] = 2,
                [CoArchitect.Domain.Enums.ArchitectureDimension.CostOptimization] = 3,
                [CoArchitect.Domain.Enums.ArchitectureDimension.Maintainability] = 3,
            },
            CancellationToken.None);

        Assert.True(score.FinalScore > 0);
        Assert.NotEmpty(score.DimensionBreakdown);
    }

    [Fact]
    public async Task WorkspaceCreate_InvalidRequest_ReturnsProblemDetails()
    {
        var controller = new WorkspacesController(
            new MockWorkspaceRepository(),
            new MockDiagramRepository(),
            new MockDiagramCommentRepository(),
            new MockAgentAnalysisRunRepository(),
            new MockAdrRepository(),
            new LocalCurrentUserService(),
            NullLogger<WorkspacesController>.Instance);

        var result = await controller.CreateWorkspace(
            new CreateWorkspaceRequest { Name = "   " },
            CancellationToken.None);

        var objectResult = Assert.IsAssignableFrom<ObjectResult>(result.Result);
        Assert.Equal(400, objectResult.StatusCode);
        var problem = Assert.IsType<ValidationProblemDetails>(objectResult.Value);
        Assert.Equal("Validation failed", problem.Title);
        Assert.Contains("Workspace name is required.", problem.Errors[nameof(CreateWorkspaceRequest.Name)]);
    }

    [Fact]
    public async Task DiagramLookup_MissingDiagram_ReturnsProblemDetails()
    {
        var controller = new DiagramsController(
            new MockDiagramRepository(),
            new MockWorkspaceRepository(),
            new MockDiagramCommentRepository(),
            new MockAgentAnalysisRunRepository(),
            new MockAdrRepository(),
            new LocalCurrentUserService(),
            new NoopArchitectureFileStorage(),
            new FrameworkSelectionService(),
            new ArchitectureIntelligenceScoreService(),
            NullLogger<DiagramsController>.Instance);

        var result = await controller.GetDiagram(Guid.NewGuid(), CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(404, objectResult.StatusCode);
        var problem = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal("Resource not found", problem.Title);
        Assert.Equal("Diagram not found.", problem.Detail);
    }

    private static T AssertOk<T>(ActionResult<T> result)
    {
        AssertAuthNeverBlocked(result.Result);
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        return Assert.IsAssignableFrom<T>(ok.Value);
    }

    private static T AssertCreated<T>(ActionResult<T> result)
    {
        AssertAuthNeverBlocked(result.Result);
        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        return Assert.IsAssignableFrom<T>(created.Value);
    }

    private static void AssertAuthNeverBlocked(IActionResult? result)
    {
        Assert.IsNotType<UnauthorizedResult>(result);
        Assert.IsNotType<ForbidResult>(result);
    }
}

internal sealed class TestFoundryIqProvider : IFoundryIqProvider
{
    public Task<FoundryIqContextBundle> RetrieveContextAsync(FoundryIqQuery query, CancellationToken cancellationToken)
    {
        return Task.FromResult(new FoundryIqContextBundle
        {
            FrameworkGuidanceItems =
            {
                new FoundryIqContextItem
                {
                    Id = "framework:seed",
                    Category = "framework",
                    Title = "Seed framework guidance",
                    Summary = "Seed framework guidance",
                    Content = "Seed framework guidance",
                    SourceType = "test",
                    SourceLabel = "Seed framework guidance",
                    Framework = query.SuggestedFrameworks.FirstOrDefault(),
                },
            },
            PrincipleItems =
            {
                new FoundryIqContextItem
                {
                    Id = "principle:security",
                    Category = "principle",
                    Title = "Security",
                    Summary = "Security",
                    Content = "Security",
                    SourceType = "test",
                    SourceLabel = "Seed principle guidance",
                    Principle = "Security",
                },
            },
            TradeoffItems =
            {
                new FoundryIqContextItem
                {
                    Id = "tradeoff:speed-governance",
                    Category = "tradeoff",
                    Title = "Speed of delivery vs governance",
                    Summary = "Speed of delivery vs governance",
                    Content = "Speed of delivery vs governance",
                    SourceType = "test",
                    SourceLabel = "Seed tradeoff guidance",
                    TradeoffTag = "Speed of delivery vs governance",
                },
            },
            CitationRefs = { "Seed framework guidance" },
        });
    }
}
