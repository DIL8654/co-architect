namespace CoArchitect.Domain.Models;

public sealed class ArchitectureReviewContext
{
    public string? BusinessDomain { get; init; }
    public string? TargetUsers { get; init; }
    public string? ExpectedTraffic { get; init; }
    public string? DataSensitivity { get; init; }
    public string? CloudProviderPreference { get; init; }
    public string? ComplianceNeeds { get; init; }
    public string? CurrentPainPoints { get; init; }
}
