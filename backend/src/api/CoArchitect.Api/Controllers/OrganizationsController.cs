using Microsoft.AspNetCore.Mvc;
using CoArchitect.Api.DTOs;
using CoArchitect.Api.Services;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationRepository _organizationRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<OrganizationsController> _logger;

    public OrganizationsController(
        IOrganizationRepository organizationRepository,
        ICurrentUserService currentUserService,
        ILogger<OrganizationsController> logger)
    {
        _organizationRepository = organizationRepository;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<OrganizationResponse>> CreateOrganization(
        [FromBody] CreateOrganizationRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = _currentUserService.GetCurrentUser();

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Organization name is required.");

        if (string.IsNullOrWhiteSpace(request.Slug))
            return BadRequest("Slug is required.");

        var slugExists = await _organizationRepository.SlugExistsAsync(request.Slug, cancellationToken);
        if (slugExists)
            return BadRequest("This slug is already taken.");

        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        organization.Members.Add(new OrganizationUser
        {
            OrganizationId = organization.Id,
            UserId = currentUser.UserId,
            AddedByUserId = currentUser.UserId,
            Role = OrganizationRole.Owner,
            JoinedAt = DateTime.UtcNow,
        });

        await _organizationRepository.AddAsync(organization, cancellationToken);
        await _organizationRepository.SaveChangesAsync(cancellationToken);

        var response = new OrganizationResponse
        {
            Id = organization.Id,
            Name = organization.Name,
            Slug = request.Slug,
            CreatedAt = organization.CreatedAt,
            MemberCount = organization.Members.Count,
        };

        return CreatedAtAction(nameof(GetOrganization), new { organizationId = organization.Id }, response);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrganizationResponse>>> ListOrganizations(
        CancellationToken cancellationToken)
    {
        var organizations = await _organizationRepository.GetAllAsync(cancellationToken);

        var responses = organizations.Select(o => new OrganizationResponse
        {
            Id = o.Id,
            Name = o.Name,
            Slug = o.Name,
            CreatedAt = o.CreatedAt,
            MemberCount = o.Members.Count,
        });

        return Ok(responses);
    }

    [HttpGet("{organizationId}")]
    public async Task<ActionResult<OrganizationResponse>> GetOrganization(
        [FromRoute] Guid organizationId,
        CancellationToken cancellationToken)
    {
        var organization = await _organizationRepository.GetByIdAsync(organizationId, cancellationToken);
        if (organization is null)
            return NotFound();

        var response = new OrganizationResponse
        {
            Id = organization.Id,
            Name = organization.Name,
            Slug = organization.Name,
            CreatedAt = organization.CreatedAt,
            MemberCount = organization.Members.Count,
        };

        return Ok(response);
    }

    [HttpGet("slug/{slug}/available")]
    public async Task<ActionResult<bool>> CheckSlugAvailable(
        [FromRoute] string slug,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(slug))
            return BadRequest("Slug is required.");

        var exists = await _organizationRepository.SlugExistsAsync(slug, cancellationToken);
        return Ok(!exists);
    }
}
