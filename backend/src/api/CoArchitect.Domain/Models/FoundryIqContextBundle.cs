namespace CoArchitect.Domain.Models;

public sealed class FoundryIqContextBundle
{
    public IList<FoundryIqContextItem> FrameworkGuidanceItems { get; init; } = new List<FoundryIqContextItem>();
    public IList<FoundryIqContextItem> PrincipleItems { get; init; } = new List<FoundryIqContextItem>();
    public IList<FoundryIqContextItem> TradeoffItems { get; init; } = new List<FoundryIqContextItem>();
    public IList<FoundryIqContextItem> AdrTemplateItems { get; init; } = new List<FoundryIqContextItem>();
    public IList<FoundryIqContextItem> WorkspaceMemoryItems { get; init; } = new List<FoundryIqContextItem>();
    public IList<FoundryIqContextItem> RelatedFindingItems { get; init; } = new List<FoundryIqContextItem>();
    public IList<FoundryIqContextItem> RelatedAdrHistoryItems { get; init; } = new List<FoundryIqContextItem>();
    public IList<string> CitationRefs { get; init; } = new List<string>();
    public WorkspaceMemorySnapshot WorkspaceMemory { get; init; } = new();
}
