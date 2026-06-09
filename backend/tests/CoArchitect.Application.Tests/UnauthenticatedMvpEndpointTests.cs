using CoArchitect.Api.Controllers;
using CoArchitect.Api.DTOs;
using CoArchitect.Api.Services;
using CoArchitect.Application.Services;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Repositories;
using CoArchitect.Infrastructure.Services;
using CoArchitect.Infrastructure.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CoArchitect.Application.Tests;

public class UnauthenticatedMvpEndpointTests
{
    [Fact]
    public void SystemCurrentUser_IsStableAuditPlaceholder()
    {
        var user = new SystemCurrentUserService().GetCurrentUser();

        Assert.Equal(Guid.Parse("00000000-0000-0000-0000-000000000001"), user.UserId);
        Assert.Equal("system@coarchitect.ai", user.Email);
        Assert.Equal("CoArchitect System User", user.DisplayName);
    }

    [Fact]
    public async Task RequiredMvpFlow_WorksWithoutAuth()
    {
        var currentUserService = new SystemCurrentUserService();
        var organizationRepository = new MockOrganizationRepository();
        var workspaceRepository = new MockWorkspaceRepository();
        var diagramRepository = new MockDiagramRepository();
        var commentRepository = new MockDiagramCommentRepository();
        var analysisRepository = new MockAgentAnalysisRunRepository();

        var organizationsController = new OrganizationsController(
            organizationRepository,
            currentUserService,
            NullLogger<OrganizationsController>.Instance);
        var workspacesController = new WorkspacesController(
            workspaceRepository,
            organizationRepository,
            diagramRepository,
            NullLogger<WorkspacesController>.Instance);
        var diagramsController = new DiagramsController(
            diagramRepository,
            workspaceRepository,
            currentUserService,
            new NoopArchitectureFileStorage(),
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
            new MockArchitectureAgentService(),
            new ArchitectureIntelligenceScoreService(),
            workspaceRepository,
            NullLogger<DiagramAnalysisController>.Instance);

        var slug = $"test-org-{Guid.NewGuid():N}";
        var slugAvailable = await organizationsController.CheckSlugAvailable(slug, CancellationToken.None);
        var slugOk = AssertOk<bool>(slugAvailable);
        Assert.True(slugOk);

        var createdOrganization = await organizationsController.CreateOrganization(
            new CreateOrganizationRequest { Name = $"Test Org {Guid.NewGuid():N}", Slug = slug },
            CancellationToken.None);
        var organization = AssertCreated<OrganizationResponse>(createdOrganization);
        Assert.Equal(1, organization.MemberCount);

        var organizations = AssertOk<IEnumerable<OrganizationResponse>>(
            await organizationsController.ListOrganizations(CancellationToken.None));
        Assert.Contains(organizations, item => item.Id == organization.Id);

        var createdWorkspace = await workspacesController.CreateWorkspace(
            organization.Id,
            new CreateWorkspaceRequest { OrganizationId = organization.Id, Name = "Test Workspace" },
            CancellationToken.None);
        var workspace = AssertCreated<WorkspaceResponse>(createdWorkspace);

        var workspaces = AssertOk<IEnumerable<WorkspaceResponse>>(
            await workspacesController.ListWorkspaces(organization.Id, null, CancellationToken.None));
        Assert.Contains(workspaces, item => item.Id == workspace.Id);

        var createdDiagram = await diagramsController.UploadDiagram(
            organization.Id,
            workspace.Id,
            new UploadDiagramRequest
            {
                WorkspaceId = workspace.Id,
                Name = "Test Architecture",
                Description = "React frontend, .NET API, PostgreSQL, no monitoring, no tenant isolation, no audit logging.",
            },
            CancellationToken.None);
        var diagram = AssertCreated<ArchitectureDiagramResponse>(createdDiagram);
        Assert.Equal(SystemCurrentUserService.UserId, diagram.UploadedByUserId);

        var diagrams = AssertOk<IEnumerable<ArchitectureDiagramResponse>>(
            await diagramsController.ListDiagrams(organization.Id, workspace.Id, null, CancellationToken.None));
        Assert.Contains(diagrams, item => item.Id == diagram.Id);

        var loadedDiagram = AssertOk<ArchitectureDiagramResponse>(
            await diagramsController.GetDiagram(organization.Id, diagram.Id, CancellationToken.None));
        Assert.Equal(diagram.Id, loadedDiagram.Id);

        var createdComment = await commentsController.CreateComment(
            organization.Id,
            diagram.Id,
            new CreateCommentRequest { DiagramId = diagram.Id, Content = "Looks ready for analysis." },
            CancellationToken.None);
        var comment = AssertCreated<DiagramCommentResponse>(createdComment);
        Assert.Equal(SystemCurrentUserService.UserId, comment.UserId);

        var comments = AssertOk<IEnumerable<DiagramCommentResponse>>(
            await commentsController.GetDiagramComments(organization.Id, diagram.Id, CancellationToken.None));
        Assert.Contains(comments, item => item.Id == comment.Id);

        var runResult = await analysisController.RunAnalysis(organization.Id, diagram.Id, CancellationToken.None);
        var analysis = AssertOk<ArchitectureAnalysisResponse>(runResult);
        Assert.NotEqual(Guid.Empty, analysis.Id);
        Assert.True(analysis.FinalScore > 0);
        Assert.False(string.IsNullOrWhiteSpace(analysis.ScoreBand));
        Assert.NotEmpty(analysis.DimensionBreakdowns);
        Assert.NotEmpty(analysis.MissingControls);
        Assert.NotEmpty(analysis.Recommendations);
        Assert.NotEmpty(analysis.Tradeoffs);

        var loadedAnalysis = AssertOk<ArchitectureAnalysisResponse>(
            await analysisController.GetAnalysisRun(organization.Id, diagram.Id, analysis.Id, CancellationToken.None));
        Assert.Equal(analysis.Id, loadedAnalysis.Id);
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
