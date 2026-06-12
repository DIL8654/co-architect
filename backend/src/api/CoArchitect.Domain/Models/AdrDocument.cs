namespace CoArchitect.Domain.Models;

public sealed class AdrDocument
{
    public string Title { get; init; } = string.Empty;
    public string Status { get; init; } = "Draft";
    public string Date { get; init; } = string.Empty;
    public IList<string> Context { get; init; } = new List<string>();
    public IList<string> Decision { get; init; } = new List<string>();
    public IList<string> Alternatives { get; init; } = new List<string>();
    public IList<string> Tradeoffs { get; init; } = new List<string>();
    public IList<string> Consequences { get; init; } = new List<string>();
    public IList<string> Risks { get; init; } = new List<string>();
    public IList<string> Frameworks { get; init; } = new List<string>();
    public IList<string> Standards { get; init; } = new List<string>();
    public IList<string> GroundedContext { get; init; } = new List<string>();
    public IList<string> History { get; init; } = new List<string>();
}
