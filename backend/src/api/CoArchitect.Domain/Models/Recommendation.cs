using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Models;

public sealed class Recommendation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Description { get; init; } = string.Empty;
    public SuggestionSeverity Severity { get; init; } = SuggestionSeverity.Medium;
}
