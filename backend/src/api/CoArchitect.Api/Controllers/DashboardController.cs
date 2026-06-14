using CoArchitect.Api.DTOs;
using CoArchitect.Application.Interfaces;
using CoArchitect.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController : ControllerBase
{
    private readonly ICurrentUserService _currentUserService;
    private readonly PerformanceReadModelService _performanceReadModelService;

    public DashboardController(
        ICurrentUserService currentUserService,
        PerformanceReadModelService performanceReadModelService)
    {
        _currentUserService = currentUserService;
        _performanceReadModelService = performanceReadModelService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(CancellationToken cancellationToken)
    {
        var currentUser = _currentUserService.GetCurrentUser();
        return Ok(await _performanceReadModelService.GetDashboardSummaryAsync(currentUser.TenantId, cancellationToken));
    }
}
