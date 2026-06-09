namespace CoArchitect.Api.DTOs;

public sealed record AiFoundrySettingsResponse(
    string ProjectEndpoint,
    string AgentId,
    string ModelDeployment,
    string ApiVersion,
    bool HasApiKey,
    string? ApiKeyPreview,
    DateTime? UpdatedAt);

public sealed record SaveAiFoundrySettingsRequest(
    string ProjectEndpoint,
    string AgentId,
    string ModelDeployment,
    string? ApiVersion,
    string? ApiKey,
    bool ClearApiKey);
