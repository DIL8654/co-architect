using Microsoft.AspNetCore.Mvc;
using CoArchitect.Api.DTOs;
using CoArchitect.Api.Services;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Enums;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/diagrams")]
public class DiagramAnalysisController : ControllerBase
{
    private readonly IAgentAnalysisRunRepository _analysisRepository;
    private readonly IDiagramRepository _diagramRepository;
    private readonly IArchitectureAgentService _agentService;
    private readonly IArchitectureIntelligenceScoreService _scoreService;
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly ILogger<DiagramAnalysisController> _logger;

    public DiagramAnalysisController(
        IAgentAnalysisRunRepository analysisRepository,
        IDiagramRepository diagramRepository,
        IArchitectureAgentService agentService,
        IArchitectureIntelligenceScoreService scoreService,
        IWorkspaceRepository workspaceRepository,
        ILogger<DiagramAnalysisController> logger)
    {
        _analysisRepository = analysisRepository;
        _diagramRepository = diagramRepository;
        _agentService = agentService;
        _scoreService = scoreService;
        _workspaceRepository = workspaceRepository;
        _logger = logger;
    }

    [HttpGet("{diagramId}/analysis")]
    public async Task<ActionResult<ArchitectureAnalysisResponse>> GetDiagramAnalysis(
        [FromRoute] Guid diagramId,
        CancellationToken cancellationToken)
    {
        var analysis = await _analysisRepository.GetLatestByDiagramIdAsync(diagramId, cancellationToken);
        if (analysis is null)
            return NotFound();

        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return NotFound();

        var agentResult = await _agentService.AnalyzeAsync(diagramId, diagram.Description ?? string.Empty, cancellationToken);
        return Ok(await MapToResponseAsync(analysis, agentResult, cancellationToken));
    }

    [HttpGet("/api/orgs/{organizationId:guid}/diagrams/{diagramId:guid}/analysis-runs/{runId:guid}")]
    public async Task<ActionResult<ArchitectureAnalysisResponse>> GetAnalysisRun(
        [FromRoute] Guid organizationId,
        [FromRoute] Guid diagramId,
        [FromRoute] Guid runId,
        CancellationToken cancellationToken)
    {
        var analysis = await _analysisRepository.GetByIdAsync(runId, cancellationToken);
        if (analysis is null || analysis.ArchitectureDiagramId != diagramId)
            return NotFound();

        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return NotFound("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return NotFound("Workspace not found.");

        if (workspace.OrganizationId != organizationId)
            return BadRequest("Diagram does not belong to organization.");

        var agentResult = await _agentService.AnalyzeAsync(diagramId, diagram.Description ?? string.Empty, cancellationToken);
        return Ok(await MapToResponseAsync(analysis, agentResult, cancellationToken));
    }

    [HttpPost("{diagramId}/analysis")]
    [HttpPost("/api/orgs/{organizationId:guid}/diagrams/{diagramId:guid}/analysis-runs")]
    public async Task<ActionResult<ArchitectureAnalysisResponse>> RunAnalysis(
        [FromRoute] Guid? organizationId,
        [FromRoute] Guid diagramId,
        CancellationToken cancellationToken)
    {
        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return NotFound("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return NotFound("Workspace not found.");

        if (organizationId.HasValue && workspace.OrganizationId != organizationId.Value)
            return BadRequest("Diagram does not belong to organization.");

        // Call AI agent service
        var agentResult = await _agentService.AnalyzeAsync(
            diagramId,
            diagram.Description ?? string.Empty,
            cancellationToken);

        // Create analysis run record
        var analysisRun = new CoArchitect.Domain.Entities.AgentAnalysisRun
        {
            Id = Guid.NewGuid(),
            WorkspaceId = diagram.WorkspaceId,
            ArchitectureDiagramId = diagramId,
            Status = CoArchitect.Domain.Enums.AnalysisRunStatus.Completed,
            RequestedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow,
        };

        await _analysisRepository.AddAsync(analysisRun, cancellationToken);
        await _analysisRepository.SaveChangesAsync(cancellationToken);

        var response = await MapToResponseAsync(analysisRun, agentResult, cancellationToken);
        return Ok(response);
    }

    private async Task<ArchitectureAnalysisResponse> MapToResponseAsync(
        CoArchitect.Domain.Entities.AgentAnalysisRun analysis,
        CoArchitect.Domain.Models.AgentAnalysisResult agentResult,
        CancellationToken cancellationToken)
    {
        var score = await CalculateScoreAsync(agentResult, cancellationToken);

        return new ArchitectureAnalysisResponse
        {
            Id = analysis.Id,
            DiagramId = analysis.ArchitectureDiagramId,
            Status = analysis.Status.ToString(),
            Evidence = agentResult.Evidence
                .Select((evidence, index) => new EvidenceItemResponse
                {
                    Summary = evidence.Summary,
                    Detail = evidence.Details ?? string.Empty,
                    Severity = index == 0 ? "High" : index == 1 ? "Medium" : "Low",
                })
                .ToList(),
            MissingControls = agentResult.MissingControls
                .Select(control => new MissingControlResponse
                {
                    Name = control.Name,
                    Impact = control.Description,
                    Recommendation = GetRecommendationText(control.Dimension, control.Name),
                })
                .ToList(),
            Recommendations = agentResult.Recommendations
                .Select((recommendation, index) => new RecommendationResponse
                {
                    Title = GetRecommendationTitle(recommendation.Description, index),
                    Description = recommendation.Description,
                    Priority = recommendation.Severity.ToString(),
                    EstimatedEffort = GetEstimatedEffort(recommendation.Severity),
                })
                .ToList(),
            Tradeoffs = agentResult.Tradeoffs
                .Select(tradeoff => new TradeoffResponse
                {
                    Scenario = tradeoff.Summary,
                    Pros = tradeoff.Pros,
                    Cons = tradeoff.Cons,
                })
                .ToList(),
            DimensionMaturitySuggestions = agentResult.DimensionMaturitySuggestions
                .Select(suggestion => new DimensionMaturitySuggestionResponse
                {
                    Dimension = suggestion.Dimension.ToString(),
                    CurrentMaturity = suggestion.CurrentMaturity,
                    SuggestedMaturity = suggestion.SuggestedMaturity,
                    Reason = suggestion.Reason,
                })
                .ToList(),
            FinalScore = score.FinalScore,
            ScoreBand = score.ScoreBand.ToString(),
            DimensionBreakdowns = score.DimensionBreakdown
                .Select(breakdown => new DimensionBreakdownResponse
                {
                    Dimension = breakdown.Dimension.ToString(),
                    Maturity = breakdown.Maturity,
                    Weight = breakdown.Weight,
                    Contribution = breakdown.Contribution,
                })
                .ToList(),
            CreatedAt = analysis.RequestedAt,
            CompletedAt = analysis.CompletedAt,
        };
    }

    private async Task<CoArchitect.Domain.Models.ArchitectureScoreResult> CalculateScoreAsync(
        CoArchitect.Domain.Models.AgentAnalysisResult agentResult,
        CancellationToken cancellationToken)
    {
        var maturityByDimension = agentResult.DimensionMaturitySuggestions.ToDictionary(
            suggestion => suggestion.Dimension,
            suggestion => suggestion.SuggestedMaturity);

        foreach (var dimension in Enum.GetValues<ArchitectureDimension>())
        {
            maturityByDimension.TryAdd(dimension, 2);
        }

        return await _scoreService.CalculateAsync(maturityByDimension, cancellationToken);
    }

    private static string GetRecommendationTitle(string description, int index)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            return $"Recommendation {index + 1}";
        }

        var firstSentence = description.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
        return string.IsNullOrWhiteSpace(firstSentence) ? $"Recommendation {index + 1}" : firstSentence;
    }

    private static string GetEstimatedEffort(SuggestionSeverity severity)
    {
        return severity switch
        {
            SuggestionSeverity.Critical => "2-4 weeks",
            SuggestionSeverity.High => "1-2 weeks",
            SuggestionSeverity.Medium => "3-5 days",
            SuggestionSeverity.Low => "1-2 days",
            _ => "TBD",
        };
    }

    private static string GetRecommendationText(ArchitectureDimension dimension, string controlName)
    {
        return dimension switch
        {
            ArchitectureDimension.Security => $"Use managed identity and Azure Key Vault to address {controlName.ToLowerInvariant()}.",
            ArchitectureDimension.ReliabilityAvailability => $"Add failover, backup, and recovery validation for {controlName.ToLowerInvariant()}.",
            ArchitectureDimension.ScalabilityPerformance => $"Introduce caching, autoscale, and queue buffering for {controlName.ToLowerInvariant()}.",
            ArchitectureDimension.OperationalExcellence => $"Add monitoring, alerting, and runbooks around {controlName.ToLowerInvariant()}.",
            ArchitectureDimension.DataTenantIsolation => $"Enforce tenant boundaries and access controls for {controlName.ToLowerInvariant()}.",
            ArchitectureDimension.ComplianceGovernance => $"Apply policy, audit, and retention controls for {controlName.ToLowerInvariant()}.",
            ArchitectureDimension.CostOptimization => $"Add budget, rightsizing, and reservation guidance for {controlName.ToLowerInvariant()}.",
            ArchitectureDimension.Maintainability => $"Reduce coupling and automate change management for {controlName.ToLowerInvariant()}.",
            _ => $"Address {controlName}.",
        };
    }
}
