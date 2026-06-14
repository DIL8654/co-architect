using CoArchitect.Api.DTOs;
using CoArchitect.Api.Services;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/workspaces/{workspaceId:guid}/diagrams/{diagramId:guid}/adrs")]
public sealed class AdrsController : ControllerBase
{
    private readonly IAdrRepository _adrRepository;
    private readonly IAdrGenerationService _adrGenerationService;
    private readonly IDiagramRepository _diagramRepository;
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IDiagramCommentRepository _commentRepository;
    private readonly IAgentAnalysisRunRepository _analysisRunRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly PerformanceCacheService _performanceCacheService;

    public AdrsController(
        IAdrRepository adrRepository,
        IAdrGenerationService adrGenerationService,
        IDiagramRepository diagramRepository,
        IWorkspaceRepository workspaceRepository,
        IDiagramCommentRepository commentRepository,
        IAgentAnalysisRunRepository analysisRunRepository,
        ICurrentUserService currentUserService,
        PerformanceCacheService performanceCacheService)
    {
        _adrRepository = adrRepository;
        _adrGenerationService = adrGenerationService;
        _diagramRepository = diagramRepository;
        _workspaceRepository = workspaceRepository;
        _commentRepository = commentRepository;
        _analysisRunRepository = analysisRunRepository;
        _currentUserService = currentUserService;
        _performanceCacheService = performanceCacheService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdrResponse>>> List(
        [FromRoute] Guid workspaceId,
        [FromRoute] Guid diagramId,
        CancellationToken cancellationToken)
    {
        var workspace = await ValidateScopeAsync(workspaceId, diagramId, cancellationToken);
        if (workspace is null)
        {
            return this.NotFoundProblem("Diagram scope not found.");
        }

        var adrs = await _adrRepository.GetByDiagramIdAsync(diagramId, cancellationToken);
        var responses = new List<AdrResponse>();
        foreach (var adr in adrs)
        {
            var versions = (await _adrRepository.GetVersionsAsync(adr.Id, cancellationToken)).ToList();
            responses.Add(MapAdr(adr, versions));
        }

        return Ok(responses);
    }

    [HttpPost]
    public async Task<ActionResult<AdrResponse>> Generate(
        [FromRoute] Guid workspaceId,
        [FromRoute] Guid diagramId,
        CancellationToken cancellationToken)
    {
        var workspace = await ValidateScopeAsync(workspaceId, diagramId, cancellationToken);
        if (workspace is null)
        {
            return this.NotFoundProblem("Diagram scope not found.");
        }

        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
        {
            return this.NotFoundProblem("Diagram not found.");
        }

        var currentUser = _currentUserService.GetCurrentUser();
        var analysis = await _analysisRunRepository.GetLatestByDiagramIdAsync(diagramId, cancellationToken);
        var comments = await _commentRepository.GetByDiagramIdAsync(diagramId, cancellationToken);
        var adr = new Adr
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            ArchitectureDiagramId = diagramId,
            Title = $"ADR: Improve architecture for {diagram.Name}",
            Status = analysis is null ? "Draft" : "Proposed",
            LatestVersionNumber = 1,
            CreatedByUserId = currentUser.UserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        var version = await _adrGenerationService.GenerateAsync(
            adr.Id,
            1,
            diagram,
            analysis,
            comments,
            currentUser.UserId,
            cancellationToken);

        await _adrRepository.AddAsync(adr, cancellationToken);
        await _adrRepository.AddVersionAsync(version, cancellationToken);
        await _adrRepository.SaveChangesAsync(cancellationToken);
        _performanceCacheService.InvalidateDiagram(workspace.TenantId, workspaceId, diagramId);

        return CreatedAtAction(nameof(Get), new { workspaceId, diagramId, adrId = adr.Id }, MapAdr(adr, [version]));
    }

    [HttpGet("{adrId:guid}")]
    public async Task<ActionResult<AdrResponse>> Get(
        [FromRoute] Guid workspaceId,
        [FromRoute] Guid diagramId,
        [FromRoute] Guid adrId,
        CancellationToken cancellationToken)
    {
        var workspace = await ValidateScopeAsync(workspaceId, diagramId, cancellationToken);
        if (workspace is null)
        {
            return this.NotFoundProblem("Diagram scope not found.");
        }

        var adr = await _adrRepository.GetByIdAsync(adrId, cancellationToken);
        if (adr is null || adr.ArchitectureDiagramId != diagramId)
        {
            return this.NotFoundProblem("ADR not found.");
        }

        var versions = (await _adrRepository.GetVersionsAsync(adr.Id, cancellationToken)).ToList();
        return Ok(MapAdr(adr, versions));
    }

    [HttpPost("{adrId:guid}/versions")]
    public async Task<ActionResult<AdrResponse>> Regenerate(
        [FromRoute] Guid workspaceId,
        [FromRoute] Guid diagramId,
        [FromRoute] Guid adrId,
        CancellationToken cancellationToken)
    {
        var workspace = await ValidateScopeAsync(workspaceId, diagramId, cancellationToken);
        if (workspace is null)
        {
            return this.NotFoundProblem("Diagram scope not found.");
        }

        var adr = await _adrRepository.GetByIdAsync(adrId, cancellationToken);
        if (adr is null || adr.ArchitectureDiagramId != diagramId)
        {
            return this.NotFoundProblem("ADR not found.");
        }

        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
        {
            return this.NotFoundProblem("Diagram not found.");
        }

        var analysis = await _analysisRunRepository.GetLatestByDiagramIdAsync(diagramId, cancellationToken);
        var comments = await _commentRepository.GetByDiagramIdAsync(diagramId, cancellationToken);
        var currentUser = _currentUserService.GetCurrentUser();
        var nextVersionNumber = adr.LatestVersionNumber + 1;
        var version = await _adrGenerationService.GenerateAsync(
            adr.Id,
            nextVersionNumber,
            diagram,
            analysis,
            comments,
            currentUser.UserId,
            cancellationToken);

        var updatedAdr = new Adr
        {
            Id = adr.Id,
            WorkspaceId = adr.WorkspaceId,
            ArchitectureDiagramId = adr.ArchitectureDiagramId,
            Title = version.Title,
            Status = version.Status,
            LatestVersionNumber = nextVersionNumber,
            CreatedByUserId = adr.CreatedByUserId,
            CreatedAt = adr.CreatedAt,
            UpdatedAt = DateTime.UtcNow,
        };

        await _adrRepository.UpdateAsync(updatedAdr, cancellationToken);
        await _adrRepository.AddVersionAsync(version, cancellationToken);
        await _adrRepository.SaveChangesAsync(cancellationToken);
        _performanceCacheService.InvalidateDiagram(workspace.TenantId, workspaceId, diagramId);

        var versions = (await _adrRepository.GetVersionsAsync(adrId, cancellationToken)).ToList();
        return Ok(MapAdr(updatedAdr, versions));
    }

    [HttpDelete("{adrId:guid}")]
    public async Task<IActionResult> Delete(
        [FromRoute] Guid workspaceId,
        [FromRoute] Guid diagramId,
        [FromRoute] Guid adrId,
        CancellationToken cancellationToken)
    {
        var workspace = await ValidateScopeAsync(workspaceId, diagramId, cancellationToken);
        if (workspace is null)
        {
            return this.NotFoundProblem("Diagram scope not found.");
        }

        var adr = await _adrRepository.GetByIdAsync(adrId, cancellationToken);
        if (adr is null || adr.ArchitectureDiagramId != diagramId)
        {
            return this.NotFoundProblem("ADR not found.");
        }

        await _adrRepository.DeleteAsync(adrId, cancellationToken);
        await _adrRepository.SaveChangesAsync(cancellationToken);
        _performanceCacheService.InvalidateDiagram(workspace.TenantId, workspaceId, diagramId);
        return NoContent();
    }

    private async Task<Workspace?> ValidateScopeAsync(Guid workspaceId, Guid diagramId, CancellationToken cancellationToken)
    {
        var currentUser = _currentUserService.GetCurrentUser();
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
        if (workspace is null || workspace.TenantId != currentUser.TenantId)
        {
            return null;
        }

        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null || diagram.WorkspaceId != workspaceId)
        {
            return null;
        }

        return workspace;
    }

    private static AdrResponse MapAdr(Adr adr, IReadOnlyCollection<AdrVersion> versions)
    {
        var latest = versions.OrderByDescending(item => item.VersionNumber).FirstOrDefault();
        return new AdrResponse
        {
            Id = adr.Id,
            WorkspaceId = adr.WorkspaceId,
            DiagramId = adr.ArchitectureDiagramId,
            Title = adr.Title,
            Status = adr.Status,
            LatestVersionNumber = adr.LatestVersionNumber,
            LatestVersion = latest is null ? null : MapVersion(latest),
            Versions = versions
                .OrderByDescending(item => item.VersionNumber)
                .Select(item => new AdrVersionSummaryResponse
                {
                    Id = item.Id,
                    VersionNumber = item.VersionNumber,
                    Status = item.Status,
                    CreatedAt = item.CreatedAt,
                })
                .ToList(),
            CreatedAt = adr.CreatedAt,
            UpdatedAt = adr.UpdatedAt,
        };
    }

    private static AdrVersionResponse MapVersion(AdrVersion version)
    {
        return new AdrVersionResponse
        {
            Id = version.Id,
            VersionNumber = version.VersionNumber,
            Title = version.Title,
            Status = version.Status,
            Frameworks = version.Frameworks.ToList(),
            Standards = version.Draft.Standards.ToList(),
            Date = version.Draft.Date,
            Context = version.Draft.Context.ToList(),
            Decision = version.Draft.Decision.ToList(),
            Alternatives = version.Draft.Alternatives.ToList(),
            Tradeoffs = version.Draft.Tradeoffs.ToList(),
            Consequences = version.Draft.Consequences.ToList(),
            Risks = version.Draft.Risks.ToList(),
            GroundedContext = version.Draft.GroundedContext.ToList(),
            History = version.Draft.History.ToList(),
            Markdown = version.Markdown,
            Html = version.Html,
            CreatedAt = version.CreatedAt,
        };
    }
}
