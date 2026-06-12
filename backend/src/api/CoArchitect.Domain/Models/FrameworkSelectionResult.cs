using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Models;

public sealed class FrameworkSelectionResult
{
    public FrameworkSelectionMode Mode { get; init; } = FrameworkSelectionMode.AutoDetect;
    public string? DetectedCloudProvider { get; init; }
    public double ConfidenceScore { get; init; }
    public IList<ReviewFramework> RequestedFrameworks { get; init; } = new List<ReviewFramework>();
    public IList<ReviewFramework> SelectedFrameworks { get; init; } = new List<ReviewFramework>();
    public IList<ReviewStandard> RequestedStandards { get; init; } = new List<ReviewStandard>();
    public IList<ReviewStandard> SelectedStandards { get; init; } = new List<ReviewStandard>();
    public IList<string> SelectionRationale { get; init; } = new List<string>();
}
