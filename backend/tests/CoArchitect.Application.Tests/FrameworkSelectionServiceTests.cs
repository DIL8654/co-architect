using CoArchitect.Application.Services;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;
using Xunit;

namespace CoArchitect.Application.Tests;

public class FrameworkSelectionServiceTests
{
    private readonly FrameworkSelectionService _service = new();

    [Fact]
    public void AutoDetect_SelectsAzureAndSecurityFrameworks_WhenAzureApiAndSensitiveDataArePresent()
    {
        var result = _service.Select(
            "React frontend, Azure App Service API, Blob Storage, external users, and PII.",
            new ArchitectureReviewContext
            {
                CloudProviderPreference = "Azure",
                DataSensitivity = "PII",
                ComplianceNeeds = "Audit logging",
            },
            FrameworkSelectionMode.AutoDetect,
            [],
            _service.GetDefaultWeights());

        Assert.Contains(ReviewFramework.AzureWellArchitected, result.SelectedFrameworks);
        Assert.Contains(ReviewFramework.OwaspAsvs, result.SelectedFrameworks);
        Assert.Equal("Azure", result.DetectedCloudProvider);
        Assert.NotEmpty(result.SelectionRationale);
    }

    [Fact]
    public void AutoDetect_DoesNotSelectAws_WhenApiGatewayIsMentionedAsMissing()
    {
        var result = _service.Select(
            "React frontend, .NET API, Blob Storage, and no API gateway.",
            new ArchitectureReviewContext
            {
                CloudProviderPreference = "Azure",
            },
            FrameworkSelectionMode.AutoDetect,
            [],
            _service.GetDefaultWeights());

        Assert.Contains(ReviewFramework.AzureWellArchitected, result.SelectedFrameworks);
        Assert.DoesNotContain(ReviewFramework.AwsWellArchitected, result.SelectedFrameworks);
        Assert.Equal("Azure", result.DetectedCloudProvider);
    }

    [Fact]
    public void ManualSelection_PreservesRequestedFrameworks()
    {
        var result = _service.Select(
            "Simple architecture description",
            new ArchitectureReviewContext(),
            FrameworkSelectionMode.Manual,
            [ReviewFramework.Iso25010, ReviewFramework.OwaspAsvs],
            _service.GetDefaultWeights());

        Assert.Equal(2, result.SelectedFrameworks.Count);
        Assert.Contains(ReviewFramework.Iso25010, result.SelectedFrameworks);
        Assert.Contains(ReviewFramework.OwaspAsvs, result.SelectedFrameworks);
        Assert.Equal(0.99, result.ConfidenceScore);
    }
}
