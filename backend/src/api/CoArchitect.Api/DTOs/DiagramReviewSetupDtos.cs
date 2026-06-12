namespace CoArchitect.Api.DTOs;

public sealed class DiagramReviewSetupRequest
{
    public string? BusinessDomain { get; init; }
    public string? TargetUsers { get; init; }
    public string? ExpectedTraffic { get; init; }
    public string? DataSensitivity { get; init; }
    public string? CloudProviderPreference { get; init; }
    public string? ComplianceNeeds { get; init; }
    public string? CurrentPainPoints { get; init; }
    public string FrameworkSelectionMode { get; init; } = "AutoDetect";
    public IList<string> RequestedFrameworks { get; init; } = new List<string>();
    public IList<string> RequestedStandards { get; init; } = new List<string>();
    public IList<QualityAttributeWeightDto> QualityAttributeWeights { get; init; } = new List<QualityAttributeWeightDto>();
}

public sealed class FrameworkSelectionPreviewRequest
{
    public string? Description { get; init; }
    public DiagramReviewSetupRequest ReviewSetup { get; init; } = new();
}

public sealed class DiagramReviewSetupResponse
{
    public ReviewContextResponse ReviewContext { get; init; } = new();
    public FrameworkSelectionSummaryResponse FrameworkSelection { get; init; } = new();
    public IList<QualityAttributeWeightDto> QualityAttributeWeights { get; init; } = new List<QualityAttributeWeightDto>();
}

public sealed class ReviewContextResponse
{
    public string? BusinessDomain { get; init; }
    public string? TargetUsers { get; init; }
    public string? ExpectedTraffic { get; init; }
    public string? DataSensitivity { get; init; }
    public string? CloudProviderPreference { get; init; }
    public string? ComplianceNeeds { get; init; }
    public string? CurrentPainPoints { get; init; }
}

public sealed class FrameworkSelectionSummaryResponse
{
    public string Mode { get; init; } = string.Empty;
    public string? DetectedCloudProvider { get; init; }
    public double ConfidenceScore { get; init; }
    public IList<string> RequestedFrameworks { get; init; } = new List<string>();
    public IList<string> SelectedFrameworks { get; init; } = new List<string>();
    public IList<string> RequestedStandards { get; init; } = new List<string>();
    public IList<string> SelectedStandards { get; init; } = new List<string>();
    public IList<string> SelectionRationale { get; init; } = new List<string>();
}

public sealed class QualityAttributeWeightDto
{
    public string Key { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public int Weight { get; init; }
}
