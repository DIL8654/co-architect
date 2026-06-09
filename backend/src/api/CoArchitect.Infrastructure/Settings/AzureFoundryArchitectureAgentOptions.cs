namespace CoArchitect.Infrastructure.Settings;

public sealed class AzureFoundryArchitectureAgentOptions
{
    public string? ProjectEndpoint { get; init; }
    public string? AgentId { get; init; }
    public string? ModelDeployment { get; init; }
    public string? ApiVersion { get; init; }
    public string? ApiKey { get; init; }
    public string? BearerToken { get; init; }
    public string? ClientId { get; init; }
    public string? ClientSecret { get; init; }
    public string? TenantId { get; init; }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ProjectEndpoint) &&
        !string.IsNullOrWhiteSpace(AgentId) &&
        !string.IsNullOrWhiteSpace(ModelDeployment);
}
