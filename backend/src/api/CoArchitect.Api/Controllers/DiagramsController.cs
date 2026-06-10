using Microsoft.AspNetCore.Mvc;
using CoArchitect.Api.Services;
using CoArchitect.Api.DTOs;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiagramsController : ControllerBase
{
    private readonly IDiagramRepository _diagramRepository;
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly IDiagramCommentRepository _commentRepository;
    private readonly IAgentAnalysisRunRepository _analysisRunRepository;
    private readonly IAdrRepository _adrRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IArchitectureFileStorage _fileStorage;
    private readonly IFrameworkSelectionService _frameworkSelectionService;
    private readonly ILogger<DiagramsController> _logger;

    private static readonly string[] AllowedExtensions = { ".png", ".jpg", ".jpeg", ".svg" };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public DiagramsController(
        IDiagramRepository diagramRepository,
        IWorkspaceRepository workspaceRepository,
        IDiagramCommentRepository commentRepository,
        IAgentAnalysisRunRepository analysisRunRepository,
        IAdrRepository adrRepository,
        ICurrentUserService currentUserService,
        IArchitectureFileStorage fileStorage,
        IFrameworkSelectionService frameworkSelectionService,
        ILogger<DiagramsController> logger)
    {
        _diagramRepository = diagramRepository;
        _workspaceRepository = workspaceRepository;
        _commentRepository = commentRepository;
        _analysisRunRepository = analysisRunRepository;
        _adrRepository = adrRepository;
        _currentUserService = currentUserService;
        _fileStorage = fileStorage;
        _frameworkSelectionService = frameworkSelectionService;
        _logger = logger;
    }

    [HttpPost("upload")]
    [HttpPost("/api/workspaces/{workspaceId:guid}/diagrams")]
    public async Task<ActionResult<ArchitectureDiagramResponse>> UploadDiagram(
        [FromRoute] Guid? workspaceId,
        [FromForm] UploadDiagramRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (string.IsNullOrWhiteSpace(request.Name))
            return this.ValidationProblemFor(nameof(request.Name), "Diagram name is required.");

        var resolvedWorkspaceId = workspaceId ?? request.WorkspaceId;
        if (resolvedWorkspaceId == Guid.Empty)
            return this.ValidationProblemFor(nameof(request.WorkspaceId), "Workspace is required.");

        if (request.File is { Length: > 0 })
        {
            if (request.File.Length > MaxFileSize)
                return this.ValidationProblemFor(nameof(request.File), "File size must be less than 10MB.");

            var fileExtension = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(fileExtension))
                return this.ValidationProblemFor(nameof(request.File), $"Unsupported file format. Allowed: {string.Join(", ", AllowedExtensions)}");
        }

        // Verify workspace exists
        var workspace = await _workspaceRepository.GetByIdAsync(resolvedWorkspaceId, cancellationToken);
        if (workspace is null)
            return this.NotFoundProblem("Workspace not found.");

        var currentUser = _currentUserService.GetCurrentUser();
        if (workspace.TenantId != currentUser.TenantId)
            return this.NotFoundProblem("Workspace not found.");

        var reviewSetup = DiagramReviewSetupMapper.ParseRequest(request.ReviewSetupJson);
        var reviewContext = DiagramReviewSetupMapper.ToDomainContext(reviewSetup);
        var qualityAttributeWeights = DiagramReviewSetupMapper.ToDomainWeights(reviewSetup, _frameworkSelectionService);
        var frameworkSelection = _frameworkSelectionService.Select(
            request.Description,
            reviewContext,
            DiagramReviewSetupMapper.ToMode(reviewSetup.FrameworkSelectionMode),
            DiagramReviewSetupMapper.ToRequestedFrameworks(reviewSetup.RequestedFrameworks),
            qualityAttributeWeights);

        var diagramId = Guid.NewGuid();
        string? fileUrl = null;

        if (request.File is { Length: > 0 })
        {
            await using var stream = request.File.OpenReadStream();
            fileUrl = await _fileStorage.SaveDiagramFileAsync(
                workspace.TenantId,
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
            ReviewContext = reviewContext,
            FrameworkSelection = frameworkSelection,
            QualityAttributeWeights = qualityAttributeWeights,
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
            ReviewSetup = DiagramReviewSetupMapper.ToResponse(diagram),
        };

        return CreatedAtAction(nameof(GetDiagram), new { diagramId = diagram.Id }, response);
    }

    [HttpGet]
    [HttpGet("/api/workspaces/{workspaceId:guid}/diagrams")]
    public async Task<ActionResult<IEnumerable<ArchitectureDiagramResponse>>> ListDiagrams(
        [FromRoute(Name = "workspaceId")] Guid? workspaceIdFromRoute,
        [FromQuery] Guid? workspaceId,
        CancellationToken cancellationToken)
    {
        var currentUser = _currentUserService.GetCurrentUser();
        IEnumerable<ArchitectureDiagram> diagrams;
        var resolvedWorkspaceId = workspaceIdFromRoute ?? workspaceId;

        if (resolvedWorkspaceId.HasValue)
        {
            var workspace = await _workspaceRepository.GetByIdAsync(resolvedWorkspaceId.Value, cancellationToken);
            if (workspace is null || workspace.TenantId != currentUser.TenantId)
                return this.NotFoundProblem("Workspace not found.");

            diagrams = await _diagramRepository.GetByWorkspaceIdAsync(resolvedWorkspaceId.Value, cancellationToken);
        }
        else
        {
            var workspaces = await _workspaceRepository.GetByTenantIdAsync(currentUser.TenantId, cancellationToken);
            var allDiagrams = new List<ArchitectureDiagram>();
            foreach (var workspace in workspaces)
            {
                allDiagrams.AddRange(await _diagramRepository.GetByWorkspaceIdAsync(workspace.Id, cancellationToken));
            }

            diagrams = allDiagrams;
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
            ReviewSetup = DiagramReviewSetupMapper.ToResponse(d),
        });

        return Ok(responses);
    }

    [HttpGet("{diagramId}")]
    public async Task<ActionResult<ArchitectureDiagramResponse>> GetDiagram(
        [FromRoute] Guid diagramId,
        CancellationToken cancellationToken)
    {
        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return this.NotFoundProblem("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return this.NotFoundProblem("Workspace not found.");

        var currentUser = _currentUserService.GetCurrentUser();
        if (workspace.TenantId != currentUser.TenantId)
            return this.NotFoundProblem("Diagram not found.");

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
            ReviewSetup = DiagramReviewSetupMapper.ToResponse(diagram),
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
            return this.NotFoundProblem("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return this.NotFoundProblem("Workspace not found.");

        var currentUser = _currentUserService.GetCurrentUser();
        if (workspace.TenantId != currentUser.TenantId)
            return this.NotFoundProblem("Diagram not found.");

        await _commentRepository.DeleteByDiagramIdAsync(diagramId, cancellationToken);
        await _analysisRunRepository.DeleteByDiagramIdAsync(diagramId, cancellationToken);
        await _adrRepository.DeleteByDiagramIdAsync(diagramId, cancellationToken);

        await _diagramRepository.DeleteAsync(diagramId, cancellationToken);
        await _commentRepository.SaveChangesAsync(cancellationToken);
        await _analysisRunRepository.SaveChangesAsync(cancellationToken);
        await _adrRepository.SaveChangesAsync(cancellationToken);
        await _diagramRepository.SaveChangesAsync(cancellationToken);

        // TODO: Delete file from blob storage

        return NoContent();
    }
}
