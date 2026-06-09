using Microsoft.AspNetCore.Mvc;
using CoArchitect.Api.DTOs;
using CoArchitect.Api.Services;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiagramsController : ControllerBase
{
    private readonly IDiagramRepository _diagramRepository;
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IArchitectureFileStorage _fileStorage;
    private readonly ILogger<DiagramsController> _logger;

    private static readonly string[] AllowedExtensions = { ".png", ".jpg", ".jpeg", ".svg" };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public DiagramsController(
        IDiagramRepository diagramRepository,
        IWorkspaceRepository workspaceRepository,
        ICurrentUserService currentUserService,
        IArchitectureFileStorage fileStorage,
        ILogger<DiagramsController> logger)
    {
        _diagramRepository = diagramRepository;
        _workspaceRepository = workspaceRepository;
        _currentUserService = currentUserService;
        _fileStorage = fileStorage;
        _logger = logger;
    }

    [HttpPost("upload")]
    [HttpPost("/api/orgs/{organizationId:guid}/workspaces/{workspaceId:guid}/diagrams")]
    public async Task<ActionResult<ArchitectureDiagramResponse>> UploadDiagram(
        [FromRoute] Guid? organizationId,
        [FromRoute] Guid? workspaceId,
        [FromForm] UploadDiagramRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Diagram name is required.");

        var resolvedWorkspaceId = workspaceId ?? request.WorkspaceId;
        if (resolvedWorkspaceId == Guid.Empty)
            return BadRequest("Workspace is required.");

        if (request.File is { Length: > 0 })
        {
            if (request.File.Length > MaxFileSize)
                return BadRequest("File size must be less than 10MB.");

            var fileExtension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(fileExtension))
                return BadRequest($"Unsupported file format. Allowed: {string.Join(", ", AllowedExtensions)}");
        }

        // Verify workspace exists
        var workspace = await _workspaceRepository.GetByIdAsync(resolvedWorkspaceId, cancellationToken);
        if (workspace is null)
            return BadRequest("Workspace not found.");

        if (organizationId.HasValue && workspace.OrganizationId != organizationId.Value)
            return BadRequest("Workspace does not belong to organization.");

        var currentUser = _currentUserService.GetCurrentUser();
        var diagramId = Guid.NewGuid();
        string? fileUrl = null;

        if (request.File is { Length: > 0 })
        {
            await using var stream = request.File.OpenReadStream();
            fileUrl = await _fileStorage.SaveDiagramFileAsync(
                workspace.OrganizationId,
                workspace.Id,
                diagramId,
                request.File.FileName,
                stream,
                request.File.ContentType,
                cancellationToken);
        }

        var diagram = new ArchitectureDiagram
        {
            Id = diagramId,
            WorkspaceId = resolvedWorkspaceId,
            UploadedByUserId = currentUser.UserId,
            Name = request.Name.Trim(),
            OriginalFileName = request.File?.FileName ?? "architecture-description.txt",
            FileUrl = fileUrl,
            Description = request.Description?.Trim(),
            UploadedAt = DateTime.UtcNow,
        };

        await _diagramRepository.AddAsync(diagram, cancellationToken);
        await _diagramRepository.SaveChangesAsync(cancellationToken);

        var response = new ArchitectureDiagramResponse
        {
            Id = diagram.Id,
            WorkspaceId = diagram.WorkspaceId,
            UploadedByUserId = diagram.UploadedByUserId,
            Name = diagram.Name,
            OriginalFileName = diagram.OriginalFileName,
            FileUrl = diagram.FileUrl,
            Description = diagram.Description,
            UploadedAt = diagram.UploadedAt,
        };

        return CreatedAtAction(nameof(GetDiagram), new { diagramId = diagram.Id }, response);
    }

    [HttpGet]
    [HttpGet("/api/orgs/{organizationId:guid}/workspaces/{workspaceId:guid}/diagrams")]
    public async Task<ActionResult<IEnumerable<ArchitectureDiagramResponse>>> ListDiagrams(
        [FromRoute] Guid? organizationId,
        [FromRoute] Guid? workspaceIdFromRoute,
        [FromQuery] Guid? workspaceId,
        CancellationToken cancellationToken)
    {
        IEnumerable<ArchitectureDiagram> diagrams;
        var resolvedWorkspaceId = workspaceIdFromRoute ?? workspaceId;

        if (resolvedWorkspaceId.HasValue)
        {
            var workspace = await _workspaceRepository.GetByIdAsync(resolvedWorkspaceId.Value, cancellationToken);
            if (workspace is null)
                return NotFound("Workspace not found.");

            if (organizationId.HasValue && workspace.OrganizationId != organizationId.Value)
                return BadRequest("Workspace does not belong to organization.");

            diagrams = await _diagramRepository.GetByWorkspaceIdAsync(resolvedWorkspaceId.Value, cancellationToken);
        }
        else
        {
            diagrams = await _diagramRepository.GetAllAsync(cancellationToken);
        }

        var responses = diagrams.Select(d => new ArchitectureDiagramResponse
        {
            Id = d.Id,
            WorkspaceId = d.WorkspaceId,
            UploadedByUserId = d.UploadedByUserId,
            Name = d.Name,
            OriginalFileName = d.OriginalFileName,
            FileUrl = d.FileUrl,
            Description = d.Description,
            UploadedAt = d.UploadedAt,
        });

        return Ok(responses);
    }

    [HttpGet("{diagramId}")]
    [HttpGet("/api/orgs/{organizationId:guid}/diagrams/{diagramId:guid}")]
    public async Task<ActionResult<ArchitectureDiagramResponse>> GetDiagram(
        [FromRoute] Guid? organizationId,
        [FromRoute] Guid diagramId,
        CancellationToken cancellationToken)
    {
        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return NotFound();

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return NotFound("Workspace not found.");

        if (organizationId.HasValue && workspace.OrganizationId != organizationId.Value)
            return BadRequest("Diagram does not belong to organization.");

        var response = new ArchitectureDiagramResponse
        {
            Id = diagram.Id,
            WorkspaceId = diagram.WorkspaceId,
            UploadedByUserId = diagram.UploadedByUserId,
            Name = diagram.Name,
            OriginalFileName = diagram.OriginalFileName,
            FileUrl = diagram.FileUrl,
            Description = diagram.Description,
            UploadedAt = diagram.UploadedAt,
        };

        return Ok(response);
    }

    [HttpDelete("{diagramId}")]
    public async Task<IActionResult> DeleteDiagram(
        [FromRoute] Guid diagramId,
        CancellationToken cancellationToken)
    {
        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return NotFound();

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return NotFound("Workspace not found.");

        await _diagramRepository.DeleteAsync(diagramId, cancellationToken);
        await _diagramRepository.SaveChangesAsync(cancellationToken);

        // TODO: Delete file from blob storage

        return NoContent();
    }
}
