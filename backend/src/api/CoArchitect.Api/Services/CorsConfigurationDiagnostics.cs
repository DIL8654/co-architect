namespace CoArchitect.Api.Services;

public sealed class CorsConfigurationDiagnostics
{
    public bool HasExplicitConfiguredOrigins { get; init; }
    public string[] ResolvedOrigins { get; init; } = [];
}
