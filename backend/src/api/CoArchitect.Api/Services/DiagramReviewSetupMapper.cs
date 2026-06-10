using System.Text.Json;
using CoArchitect.Api.DTOs;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;

namespace CoArchitect.Api.Services;

public static class DiagramReviewSetupMapper
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static DiagramReviewSetupRequest ParseRequest(string? reviewSetupJson)
    {
        if (string.IsNullOrWhiteSpace(reviewSetupJson))
        {
            return new DiagramReviewSetupRequest();
        }

        return JsonSerializer.Deserialize<DiagramReviewSetupRequest>(reviewSetupJson, JsonOptions) ?? new DiagramReviewSetupRequest();
    }

    public static ArchitectureReviewContext ToDomainContext(DiagramReviewSetupRequest request)
    {
        return new ArchitectureReviewContext
        {
            BusinessDomain = NullIfWhiteSpace(request.BusinessDomain),
            TargetUsers = NullIfWhiteSpace(request.TargetUsers),
            ExpectedTraffic = NullIfWhiteSpace(request.ExpectedTraffic),
            DataSensitivity = NullIfWhiteSpace(request.DataSensitivity),
            CloudProviderPreference = NullIfWhiteSpace(request.CloudProviderPreference),
            ComplianceNeeds = NullIfWhiteSpace(request.ComplianceNeeds),
            CurrentPainPoints = NullIfWhiteSpace(request.CurrentPainPoints),
        };
    }

    public static List<QualityAttributeWeight> ToDomainWeights(DiagramReviewSetupRequest request, IFrameworkSelectionService frameworkSelectionService)
    {
        var requested = request.QualityAttributeWeights
            .Where(weight => !string.IsNullOrWhiteSpace(weight.Key))
            .Select(weight => new QualityAttributeWeight
            {
                Key = weight.Key.Trim(),
                Label = string.IsNullOrWhiteSpace(weight.Label) ? weight.Key.Trim() : weight.Label.Trim(),
                Weight = Math.Max(0, weight.Weight),
            })
            .ToList();

        return requested.Count > 0 ? requested : frameworkSelectionService.GetDefaultWeights().ToList();
    }

    public static FrameworkSelectionMode ToMode(string? mode)
    {
        return Enum.TryParse<FrameworkSelectionMode>(mode, ignoreCase: true, out var parsed)
            ? parsed
            : FrameworkSelectionMode.AutoDetect;
    }

    public static List<ReviewFramework> ToRequestedFrameworks(IEnumerable<string> frameworks)
    {
        return frameworks
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => Enum.TryParse<ReviewFramework>(value, ignoreCase: true, out var parsed) ? parsed : (ReviewFramework?)null)
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .Distinct()
            .ToList();
    }

    public static DiagramReviewSetupResponse ToResponse(ArchitectureDiagram diagram)
    {
        return new DiagramReviewSetupResponse
        {
            ReviewContext = new ReviewContextResponse
            {
                BusinessDomain = diagram.ReviewContext.BusinessDomain,
                TargetUsers = diagram.ReviewContext.TargetUsers,
                ExpectedTraffic = diagram.ReviewContext.ExpectedTraffic,
                DataSensitivity = diagram.ReviewContext.DataSensitivity,
                CloudProviderPreference = diagram.ReviewContext.CloudProviderPreference,
                ComplianceNeeds = diagram.ReviewContext.ComplianceNeeds,
                CurrentPainPoints = diagram.ReviewContext.CurrentPainPoints,
            },
            FrameworkSelection = new FrameworkSelectionSummaryResponse
            {
                Mode = diagram.FrameworkSelection.Mode.ToString(),
                DetectedCloudProvider = diagram.FrameworkSelection.DetectedCloudProvider,
                ConfidenceScore = diagram.FrameworkSelection.ConfidenceScore,
                RequestedFrameworks = diagram.FrameworkSelection.RequestedFrameworks.Select(item => item.ToString()).ToList(),
                SelectedFrameworks = diagram.FrameworkSelection.SelectedFrameworks.Select(item => item.ToString()).ToList(),
                SelectionRationale = diagram.FrameworkSelection.SelectionRationale.ToList(),
            },
            QualityAttributeWeights = diagram.QualityAttributeWeights
                .Select(weight => new QualityAttributeWeightDto
                {
                    Key = weight.Key,
                    Label = weight.Label,
                    Weight = weight.Weight,
                })
                .ToList(),
        };
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
