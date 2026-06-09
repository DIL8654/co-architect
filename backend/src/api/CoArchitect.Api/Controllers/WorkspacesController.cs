using Microsoft.AspNetCore.Mvc;
using CoArchitect.Api.DTOs;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkspacesController : ControllerBase
{
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IDiagramRepository _diagramRepository;
    private readonly ILogger<WorkspacesController> _logger;

    public WorkspacesController(
        IWorkspaceRepository workspaceRepository,
        IOrganizationRepository organizationRepository,
        IDiagramRepository diagramRepository,
        ILogger<WorkspacesController> logger)
    {
        _workspaceRepository = workspaceRepository;
        _organizationRepository = organizationRepository;
        _diagramRepository = diagramRepository;
        _logger = logger;
    }

    [HttpPost]
    [HttpPost("/api/orgs/{organizationId:guid}/workspaces")]
    public async Task<ActionResult<WorkspaceResponse>> CreateWorkspace(
        [FromRoute] Guid? organizationId,
        [FromBody] CreateWorkspaceRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Workspace name is required.");

        var resolvedOrganizationId = organizationId ?? request.OrganizationId;
        if (resolvedOrganizationId == Guid.Empty)
            return BadRequest("Organization is required.");

        var organization = await _organizationRepository.GetByIdAsync(resolvedOrganizationId, cancellationToken);
        if (organization is null)
            return BadRequest("Organization not found.");

        var workspace = new Workspace
        {
            Id = Guid.NewGuid(),
            OrganizationId = resolvedOrganizationId,
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        await _workspaceRepository.AddAsync(workspace, cancellationToken);
        await _workspaceRepository.SaveChangesAsync(cancellationToken);

        var response = new WorkspaceResponse
        {
            Id = workspace.Id,
            OrganizationId = workspace.OrganizationId,
            Name = workspace.Name,
            CreatedAt = workspace.CreatedAt,
            UpdatedAt = workspace.UpdatedAt,
            DiagramCount = workspace.Diagrams.Count,
        };

        return CreatedAtAction(nameof(GetWorkspace), new { workspaceId = workspace.Id }, response);
    }

    [HttpGet]
    [HttpGet("/api/orgs/{organizationId:guid}/workspaces")]
    public async Task<ActionResult<IEnumerable<WorkspaceResponse>>> ListWorkspaces(
        [FromRoute] Guid? organizationIdFromRoute,
        [FromQuery] Guid? organizationId,
        CancellationToken cancellationToken)
    {
        IEnumerable<Workspace> workspaces;
        var resolvedOrganizationId = organizationIdFromRoute ?? organizationId;

        if (resolvedOrganizationId.HasValue)
        {
            workspaces = await _workspaceRepository.GetByOrganizationIdAsync(resolvedOrganizationId.Value, cancellationToken);
        }
        else
        {
            workspaces = await _workspaceRepository.GetAllAsync(cancellationToken);
        }

        var responses = new List<WorkspaceResponse>();
        foreach (var workspace in workspaces)
        {
            var diagrams = await _diagramRepository.GetByWorkspaceIdAsync(workspace.Id, cancellationToken);
            responses.Add(new WorkspaceResponse
            {
                Id = workspace.Id,
                OrganizationId = workspace.OrganizationId,
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
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
        if (workspace is null)
            return NotFound();

        var diagrams = await _diagramRepository.GetByWorkspaceIdAsync(workspace.Id, cancellationToken);

        var response = new WorkspaceResponse
        {
            Id = workspace.Id,
            OrganizationId = workspace.OrganizationId,
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
        var workspace = await _workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
        if (workspace is null)
            return NotFound();

        await _workspaceRepository.DeleteAsync(workspaceId, cancellationToken);
        await _workspaceRepository.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
