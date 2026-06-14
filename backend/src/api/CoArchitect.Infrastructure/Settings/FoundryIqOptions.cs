namespace CoArchitect.Infrastructure.Settings;

public sealed class FoundryIqOptions
{
    public string Provider { get; init; } = "Local";
    public string? AgentId { get; init; }

    public bool UseLocalOnly =>
        string.Equals(Provider, "Local", StringComparison.OrdinalIgnoreCase);

    public bool PreferManagedFoundry =>
        string.Equals(Provider, "AzureFoundry", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(Provider, "Hybrid", StringComparison.OrdinalIgnoreCase);
}
