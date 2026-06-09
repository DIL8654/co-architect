namespace CoArchitect.Domain.Entities;

public sealed class AiFoundrySettings
{
    public Guid Id { get; init; } = WellKnownId;
    public string ProjectEndpoint { get; set; } = string.Empty;
    public string AgentId { get; set; } = string.Empty;
    public string ModelDeployment { get; set; } = string.Empty;
    public string ApiVersion { get; set; } = string.Empty;
    public string? ApiKey { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public static Guid WellKnownId { get; } = Guid.Parse("00000000-0000-0000-0000-00000000a1f0");
}
