using CoArchitect.Api.DTOs;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Settings;
using Microsoft.AspNetCore.Mvc;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/settings")]
public sealed class SettingsController : ControllerBase
{
    private readonly IAiFoundrySettingsRepository _repository;
    private readonly AzureFoundryArchitectureAgentOptions _environmentOptions;

    public SettingsController(
        IAiFoundrySettingsRepository repository,
        AzureFoundryArchitectureAgentOptions environmentOptions)
    {
        _repository = repository;
        _environmentOptions = environmentOptions;
    }

    [HttpGet("ai-foundry")]
    public async Task<ActionResult<AiFoundrySettingsResponse>> GetAiFoundry(CancellationToken cancellationToken)
    {
        var saved = await _repository.GetAsync(cancellationToken);
        return Ok(ToResponse(saved, _environmentOptions));
    }

    [HttpPut("ai-foundry")]
    public async Task<ActionResult<AiFoundrySettingsResponse>> SaveAiFoundry(
        SaveAiFoundrySettingsRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ProjectEndpoint) ||
            string.IsNullOrWhiteSpace(request.AgentId) ||
            string.IsNullOrWhiteSpace(request.ModelDeployment))
        {
            return BadRequest(new { message = "Project endpoint, agent id, and model deployment are required." });
        }

        var existing = await _repository.GetAsync(cancellationToken);
        var apiKey = request.ClearApiKey
            ? null
            : string.IsNullOrWhiteSpace(request.ApiKey)
                ? existing?.ApiKey
                : request.ApiKey.Trim();

        var settings = new AiFoundrySettings
        {
            ProjectEndpoint = request.ProjectEndpoint.Trim(),
            AgentId = request.AgentId.Trim(),
            ModelDeployment = request.ModelDeployment.Trim(),
            ApiVersion = request.ApiVersion?.Trim() ?? string.Empty,
            ApiKey = apiKey,
        };

        var saved = await _repository.SaveAsync(settings, cancellationToken);
        return Ok(ToResponse(saved, _environmentOptions));
    }

    private static AiFoundrySettingsResponse ToResponse(
        AiFoundrySettings? saved,
        AzureFoundryArchitectureAgentOptions environmentOptions)
    {
        var projectEndpoint = First(saved?.ProjectEndpoint, environmentOptions.ProjectEndpoint);
        var agentId = First(saved?.AgentId, environmentOptions.AgentId);
        var modelDeployment = First(saved?.ModelDeployment, environmentOptions.ModelDeployment);
        var apiVersion = First(saved?.ApiVersion, environmentOptions.ApiVersion);
        var apiKey = First(saved?.ApiKey, environmentOptions.ApiKey);

        return new AiFoundrySettingsResponse(
            projectEndpoint,
            agentId,
            modelDeployment,
            apiVersion,
            !string.IsNullOrWhiteSpace(apiKey),
            Preview(apiKey),
            saved?.UpdatedAt);
    }

    private static string First(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)) ?? string.Empty;
    }

    private static string? Preview(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Length <= 8 ? "********" : $"...{value[^4..]}";
    }
}
