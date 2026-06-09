using Microsoft.AspNetCore.Mvc;
using CoArchitect.Api.DTOs;
using CoArchitect.Api.Services;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/diagrams")]
public class DiagramCommentsController : ControllerBase
{
    private readonly IDiagramCommentRepository _commentRepository;
    private readonly IDiagramRepository _diagramRepository;
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<DiagramCommentsController> _logger;

    public DiagramCommentsController(
        IDiagramCommentRepository commentRepository,
        IDiagramRepository diagramRepository,
        IWorkspaceRepository workspaceRepository,
        ICurrentUserService currentUserService,
        ILogger<DiagramCommentsController> logger)
    {
        _commentRepository = commentRepository;
        _diagramRepository = diagramRepository;
        _workspaceRepository = workspaceRepository;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpPost("comments")]
    [HttpPost("/api/orgs/{organizationId:guid}/diagrams/{diagramId:guid}/comments")]
    public async Task<ActionResult<DiagramCommentResponse>> CreateComment(
        [FromRoute] Guid? organizationId,
        [FromRoute] Guid? diagramId,
        [FromBody] CreateCommentRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest("Comment content is required.");

        var resolvedDiagramId = diagramId ?? request.DiagramId;
        if (resolvedDiagramId == Guid.Empty)
            return BadRequest("Diagram is required.");

        var diagram = await _diagramRepository.GetByIdAsync(resolvedDiagramId, cancellationToken);
        if (diagram is null)
            return BadRequest("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return BadRequest("Workspace not found.");

        if (organizationId.HasValue && workspace.OrganizationId != organizationId.Value)
            return BadRequest("Diagram does not belong to organization.");

        var currentUser = _currentUserService.GetCurrentUser();

        var comment = new DiagramComment
        {
            Id = Guid.NewGuid(),
            ArchitectureDiagramId = resolvedDiagramId,
            UserId = currentUser.UserId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
        };

        await _commentRepository.AddAsync(comment, cancellationToken);
        await _commentRepository.SaveChangesAsync(cancellationToken);

        var response = new DiagramCommentResponse
        {
            Id = comment.Id,
            DiagramId = comment.ArchitectureDiagramId,
            UserId = comment.UserId,
            UserName = currentUser.DisplayName,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
        };

        return CreatedAtAction(nameof(GetDiagramComments), new { diagramId = comment.ArchitectureDiagramId }, response);
    }

    [HttpGet("{diagramId}/comments")]
    [HttpGet("/api/orgs/{organizationId:guid}/diagrams/{diagramId:guid}/comments")]
    public async Task<ActionResult<IEnumerable<DiagramCommentResponse>>> GetDiagramComments(
        [FromRoute] Guid? organizationId,
        [FromRoute] Guid diagramId,
        CancellationToken cancellationToken)
    {
        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return NotFound("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return NotFound("Workspace not found.");

        if (organizationId.HasValue && workspace.OrganizationId != organizationId.Value)
            return BadRequest("Diagram does not belong to organization.");

        var comments = await _commentRepository.GetByDiagramIdAsync(diagramId, cancellationToken);

        var responses = comments.Select(c => new DiagramCommentResponse
        {
            Id = c.Id,
            DiagramId = c.ArchitectureDiagramId,
            UserId = c.UserId,
            UserName = c.UserId == SystemCurrentUserService.UserId ? SystemCurrentUserService.DisplayName : "CoArchitect User",
            Content = c.Content,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
        });

        return Ok(responses);
    }

    [HttpDelete("comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(
        [FromRoute] Guid commentId,
        CancellationToken cancellationToken)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId, cancellationToken);
        if (comment is null)
            return NotFound();

        var diagram = await _diagramRepository.GetByIdAsync(comment.ArchitectureDiagramId, cancellationToken);
        if (diagram is null)
            return NotFound("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return NotFound("Workspace not found.");

        await _commentRepository.DeleteAsync(commentId, cancellationToken);
        await _commentRepository.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
