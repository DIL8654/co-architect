namespace CoArchitect.Domain.Models;

public sealed class FoundryIqContextItem
{
    public string Id { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Summary { get; init; } = string.Empty;
    public string Content { get; init; } = string.Empty;
    public string SourceType { get; init; } = string.Empty;
    public string SourceLabel { get; init; } = string.Empty;
    public string? SourceUri { get; init; }
    public bool WorkspaceScoped { get; init; }
    public string? Framework { get; init; }
    public string? Principle { get; init; }
    public string? TradeoffTag { get; init; }
    public Guid? AdrId { get; init; }
    public Guid? AnalysisRunId { get; init; }
}
