using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Models;

public sealed class ContextEnrichmentResult
{
    public FoundryIqContextBundle ContextBundle { get; init; } = new();
    public IList<string> ApplicablePrinciples { get; init; } = new List<string>();
    public IList<string> ApplicableTradeoffs { get; init; } = new List<string>();
    public IList<string> MissingContextNotes { get; init; } = new List<string>();
    public IList<ReviewFramework> ConfirmedFrameworks { get; init; } = new List<ReviewFramework>();
    public string Summary { get; init; } = string.Empty;
}
