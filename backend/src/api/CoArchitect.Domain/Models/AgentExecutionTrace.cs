namespace CoArchitect.Domain.Models;

public sealed class AgentExecutionTrace
{
    public string AgentName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string? Framework { get; init; }
    public string Status { get; init; } = "Completed";
    public string Summary { get; init; } = string.Empty;
    public IList<string> Highlights { get; init; } = new List<string>();
    public GroundingReferenceSet Grounding { get; init; } = new();
    public bool UsedFoundry { get; init; }
    public DateTime StartedAt { get; init; } = DateTime.UtcNow;
    public DateTime CompletedAt { get; init; } = DateTime.UtcNow;
}
