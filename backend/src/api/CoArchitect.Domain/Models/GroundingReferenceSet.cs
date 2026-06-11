namespace CoArchitect.Domain.Models;

public sealed class GroundingReferenceSet
{
    public IList<string> FrameworkRefs { get; init; } = new List<string>();
    public IList<string> PrincipleRefs { get; init; } = new List<string>();
    public IList<string> TradeoffRefs { get; init; } = new List<string>();
    public IList<string> HistoryRefs { get; init; } = new List<string>();
    public IList<string> CitationRefs { get; init; } = new List<string>();
}
