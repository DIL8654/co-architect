namespace CoArchitect.Infrastructure.Settings;

public sealed class AzureFoundryAgentExperimentOptions
{
    public string Mode { get; init; } = "SingleExpert";
    public string? PlannerAgentId { get; init; }
    public string? ReviewerAgentId { get; init; }
    public string? CriticComposerAgentId { get; init; }

    public bool UseHybridPromptAgents =>
        string.Equals(Mode, "HybridMultiAgent", StringComparison.OrdinalIgnoreCase) &&
        !string.IsNullOrWhiteSpace(PlannerAgentId) &&
        !string.IsNullOrWhiteSpace(ReviewerAgentId) &&
        !string.IsNullOrWhiteSpace(CriticComposerAgentId);
}
