using Microsoft.AspNetCore.Mvc;
using CoArchitect.Api.DTOs;
using CoArchitect.Api.Services;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IDiagramRepository _diagramRepository;
    private readonly IDiagramCommentRepository _commentRepository;
    private readonly IAgentAnalysisRunRepository _analysisRunRepository;
    private readonly IAdrRepository _adrRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<WorkspacesController> _logger;

    public WorkspacesController(
        IWorkspaceRepository workspaceRepository,
        IDiagramRepository diagramRepository,
        IDiagramCommentRepository commentRepository,
        IAgentAnalysisRunRepository analysisRunRepository,
        IAdrRepository adrRepository,
        ICurrentUserService currentUserService,
        ILogger<WorkspacesController> logger)
    {
        _workspaceRepository = workspaceRepository;
        _diagramRepository = diagramRepository;
        _commentRepository = commentRepository;
        _analysisRunRepository = analysisRunRepository;
        _adrRepository = adrRepository;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<WorkspaceResponse>> CreateWorkspace(
        [FromBody] CreateWorkspaceRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (string.IsNullOrWhiteSpace(request.Name))
            return this.ValidationProblemFor(nameof(request.Name), "Workspace name is required.");

        var currentUser = _currentUserService.GetCurrentUser();

        var workspace = new Workspace
        {
            Id = Guid.NewGuid(),
            TenantId = currentUser.TenantId,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _workspaceRepository.AddAsync(workspace, cancellationToken);
        await _workspaceRepository.SaveChangesAsync(cancellationToken);

        var response = new WorkspaceResponse
        {
            Id = workspace.Id,
            Name = workspace.Name,
            CreatedAt = workspace.CreatedAt,
            UpdatedAt = workspace.UpdatedAt,
            DiagramCount = workspace.Diagrams.Count,
        };

        return CreatedAtAction(nameof(GetWorkspace), new { workspaceId = workspace.Id }, response);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkspaceResponse>>> ListWorkspaces(
        CancellationToken cancellationToken)
    {
        var currentUser = _currentUserService.GetCurrentUser();
        var workspaces = await _workspaceRepository.GetByTenantIdAsync(currentUser.TenantId, cancellationToken);

        var responses = new List<WorkspaceResponse>();
        foreach (var workspace in workspaces)
        {
            var diagrams = await _diagramRepository.GetByWorkspaceIdAsync(workspace.Id, cancellationToken);
            responses.Add(new WorkspaceResponse
            {
                Id = workspace.Id,
                Name = workspace.Name,
                CreatedAt = workspace.CreatedAt,
                UpdatedAt = workspace.UpdatedAt,
                DiagramCount = diagrams.Count(),
            });
        }

        return Ok(responses);
    }

    [HttpGet("{workspaceId}")]
    public async Task<ActionResult<WorkspaceResponse>> GetWorkspace(
        [FromRoute] Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var currentUser = _currentUserService.GetCurrentUser();
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
        if (workspace is null || workspace.TenantId != currentUser.TenantId)
            return this.NotFoundProblem("Workspace not found.");

        var diagrams = await _diagramRepository.GetByWorkspaceIdAsync(workspace.Id, cancellationToken);

        var response = new WorkspaceResponse
        {
            Id = workspace.Id,
            Name = workspace.Name,
            CreatedAt = workspace.CreatedAt,
            UpdatedAt = workspace.UpdatedAt,
            DiagramCount = diagrams.Count(),
        };

        return Ok(response);
    }

    [HttpDelete("{workspaceId}")]
    public async Task<IActionResult> DeleteWorkspace(
        [FromRoute] Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var currentUser = _currentUserService.GetCurrentUser();
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
        if (workspace is null || workspace.TenantId != currentUser.TenantId)
            return this.NotFoundProblem("Workspace not found.");

        var diagrams = await _diagramRepository.GetByWorkspaceIdAsync(workspaceId, cancellationToken);
        foreach (var diagram in diagrams)
        {
            await _commentRepository.DeleteByDiagramIdAsync(diagram.Id, cancellationToken);
            await _analysisRunRepository.DeleteByDiagramIdAsync(diagram.Id, cancellationToken);
            await _adrRepository.DeleteByDiagramIdAsync(diagram.Id, cancellationToken);
            await _diagramRepository.DeleteAsync(diagram.Id, cancellationToken);
        }

        await _workspaceRepository.DeleteAsync(workspaceId, cancellationToken);
        await _diagramRepository.SaveChangesAsync(cancellationToken);
        await _commentRepository.SaveChangesAsync(cancellationToken);
        await _analysisRunRepository.SaveChangesAsync(cancellationToken);
        await _adrRepository.SaveChangesAsync(cancellationToken);
        await _workspaceRepository.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
