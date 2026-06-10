using CoArchitect.Api.DTOs;
using CoArchitect.Api.Services;
using CoArchitect.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/framework-selection")]
public sealed class FrameworkSelectionController : ControllerBase
{
    private readonly IFrameworkSelectionService _frameworkSelectionService;

    public FrameworkSelectionController(IFrameworkSelectionService frameworkSelectionService)
    {
        _frameworkSelectionService = frameworkSelectionService;
    }

    [HttpPost("preview")]
    public ActionResult<DiagramReviewSetupResponse> Preview([FromBody] FrameworkSelectionPreviewRequest request)
    {
        var reviewSetup = request.ReviewSetup ?? new DiagramReviewSetupRequest();
        var reviewContext = DiagramReviewSetupMapper.ToDomainContext(reviewSetup);
        var weights = DiagramReviewSetupMapper.ToDomainWeights(reviewSetup, _frameworkSelectionService);
        var selection = _frameworkSelectionService.Select(
            request.Description,
            reviewContext,
            DiagramReviewSetupMapper.ToMode(reviewSetup.FrameworkSelectionMode),
            DiagramReviewSetupMapper.ToRequestedFrameworks(reviewSetup.RequestedFrameworks),
            weights);

        return Ok(new DiagramReviewSetupResponse
        {
            ReviewContext = new ReviewContextResponse
            {
                BusinessDomain = reviewContext.BusinessDomain,
                TargetUsers = reviewContext.TargetUsers,
                ExpectedTraffic = reviewContext.ExpectedTraffic,
                DataSensitivity = reviewContext.DataSensitivity,
                CloudProviderPreference = reviewContext.CloudProviderPreference,
                ComplianceNeeds = reviewContext.ComplianceNeeds,
                CurrentPainPoints = reviewContext.CurrentPainPoints,
            },
            FrameworkSelection = new FrameworkSelectionSummaryResponse
            {
                Mode = selection.Mode.ToString(),
                DetectedCloudProvider = selection.DetectedCloudProvider,
                ConfidenceScore = selection.ConfidenceScore,
                RequestedFrameworks = selection.RequestedFrameworks.Select(item => item.ToString()).ToList(),
                SelectedFrameworks = selection.SelectedFrameworks.Select(item => item.ToString()).ToList(),
                SelectionRationale = selection.SelectionRationale.ToList(),
            },
            QualityAttributeWeights = weights.Select(weight => new QualityAttributeWeightDto
            {
                Key = weight.Key,
                Label = weight.Label,
                Weight = weight.Weight,
            }).ToList(),
        });
    }
}
