namespace CoArchitect.Infrastructure.Settings;

public sealed class AzureFoundryArchitectureAgentOptions
{
    public string EndpointMode { get; init; } = "LegacyAgent";
    public string? LegacyAgentEndpoint { get; init; }
    public string? ProjectEndpoint { get; init; }
    public string? AgentId { get; init; }
    public string? ModelDeployment { get; init; }
    public string? ApiVersion { get; init; }
    public string? ApiKey { get; init; }
    public string? BearerToken { get; init; }
    public string? ClientId { get; init; }
    public string? ClientSecret { get; init; }
    public string? TenantId { get; init; }

    public bool UseLegacyAgentEndpoint =>
        string.Equals(EndpointMode, "LegacyAgent", StringComparison.OrdinalIgnoreCase);

    public bool UseProjectEndpoint =>
        string.Equals(EndpointMode, "ProjectEndpoint", StringComparison.OrdinalIgnoreCase);

    public string? EffectiveEndpoint =>
        UseLegacyAgentEndpoint
            ? FirstNonEmpty(LegacyAgentEndpoint, ProjectEndpoint)
            : FirstNonEmpty(ProjectEndpoint, LegacyAgentEndpoint);

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(EffectiveEndpoint) &&
        !string.IsNullOrWhiteSpace(AgentId) &&
        !string.IsNullOrWhiteSpace(ModelDeployment);

    private static string? FirstNonEmpty(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }
}
