namespace CoArchitect.Api.DTOs;

public sealed class ArchitectureAnalysisResponse
{
    public Guid Id { get; init; }
    public Guid DiagramId { get; init; }
    public string Status { get; init; } = string.Empty;
    public List<EvidenceItemResponse> Evidence { get; init; } = new();
    public List<MissingControlResponse> MissingControls { get; init; } = new();
    public List<RecommendationResponse> Recommendations { get; init; } = new();
    public List<TradeoffResponse> Tradeoffs { get; init; } = new();
    public List<DimensionMaturitySuggestionResponse> DimensionMaturitySuggestions { get; init; } = new();
    public double? FinalScore { get; init; }
    public string? ScoreBand { get; init; }
    public List<DimensionBreakdownResponse> DimensionBreakdowns { get; init; } = new();
    public DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public sealed class EvidenceItemResponse
{
    public string Summary { get; init; } = string.Empty;
    public string Detail { get; init; } = string.Empty;
    public string Severity { get; init; } = string.Empty;
}

public sealed class MissingControlResponse
{
    public string Name { get; init; } = string.Empty;
    public string Impact { get; init; } = string.Empty;
    public string Recommendation { get; init; } = string.Empty;
}

public sealed class RecommendationResponse
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Priority { get; init; } = string.Empty;
    public string EstimatedEffort { get; init; } = string.Empty;
}

public sealed class TradeoffResponse
{
    public string Scenario { get; init; } = string.Empty;
    public IList<string> Pros { get; init; } = new List<string>();
    public IList<string> Cons { get; init; } = new List<string>();
}

public sealed class DimensionMaturitySuggestionResponse
{
    public string Dimension { get; init; } = string.Empty;
    public int CurrentMaturity { get; init; }
    public int SuggestedMaturity { get; init; }
    public string Reason { get; init; } = string.Empty;
}

public sealed class DimensionBreakdownResponse
{
    public string Dimension { get; init; } = string.Empty;
    public int Maturity { get; init; }
    public double Weight { get; init; }
    public double Contribution { get; init; }
}
