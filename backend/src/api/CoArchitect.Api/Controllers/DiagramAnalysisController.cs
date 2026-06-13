using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using CoArchitect.Api.DTOs;
using CoArchitect.Api.Services;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Entities;

namespace CoArchitect.Api.Controllers;

[ApiController]
[Route("api/diagrams")]
public class DiagramAnalysisController : ControllerBase
{
    private readonly IAgentAnalysisRunRepository _analysisRepository;
    private readonly IDiagramRepository _diagramRepository;
    private readonly IMultiAgentArchitectureAnalysisService _analysisService;
    private readonly IArchitectureIntelligenceScoreService _scoreService;
    private readonly IWorkspaceRepository _workspaceRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFrameworkSelectionService _frameworkSelectionService;
    private readonly ILogger<DiagramAnalysisController> _logger;

    public DiagramAnalysisController(
        IAgentAnalysisRunRepository analysisRepository,
        IDiagramRepository diagramRepository,
        IMultiAgentArchitectureAnalysisService analysisService,
        IArchitectureIntelligenceScoreService scoreService,
        IWorkspaceRepository workspaceRepository,
        ICurrentUserService currentUserService,
        IFrameworkSelectionService frameworkSelectionService,
        ILogger<DiagramAnalysisController> logger)
    {
        _analysisRepository = analysisRepository;
        _diagramRepository = diagramRepository;
        _analysisService = analysisService;
        _scoreService = scoreService;
        _workspaceRepository = workspaceRepository;
        _currentUserService = currentUserService;
        _frameworkSelectionService = frameworkSelectionService;
        _logger = logger;
    }

    [HttpGet("{diagramId}/analysis")]
    public async Task<ActionResult<ArchitectureAnalysisResponse>> GetDiagramAnalysis(
        [FromRoute] Guid diagramId,
        CancellationToken cancellationToken)
    {
        var analysis = await _analysisRepository.GetLatestByDiagramIdAsync(diagramId, cancellationToken);
        if (analysis is null)
            return this.NotFoundProblem("Analysis run not found.");

        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return this.NotFoundProblem("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null || workspace.TenantId != _currentUserService.GetCurrentUser().TenantId)
            return this.NotFoundProblem("Analysis run not found.");

        var agentResult = await GetStoredOrFreshResultAsync(analysis, diagram, cancellationToken);
        return Ok(await MapToResponseAsync(analysis, diagram, agentResult, cancellationToken));
    }

    [HttpGet("/api/workspaces/{workspaceId:guid}/diagrams/{diagramId:guid}/analysis-runs/{runId:guid}")]
    public async Task<ActionResult<ArchitectureAnalysisResponse>> GetAnalysisRun(
        [FromRoute] Guid workspaceId,
        [FromRoute] Guid diagramId,
        [FromRoute] Guid runId,
        CancellationToken cancellationToken)
    {
        var analysis = await _analysisRepository.GetByIdAsync(runId, cancellationToken);
        if (analysis is null || analysis.ArchitectureDiagramId != diagramId)
            return this.NotFoundProblem("Analysis run not found.");

        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return this.NotFoundProblem("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return this.NotFoundProblem("Workspace not found.");

        if (workspace.Id != workspaceId)
            return this.ValidationProblemFor("workspaceId", "Diagram does not belong to workspace.");
        if (workspace.TenantId != _currentUserService.GetCurrentUser().TenantId)
            return this.NotFoundProblem("Analysis run not found.");

        var agentResult = await GetStoredOrFreshResultAsync(analysis, diagram, cancellationToken);
        return Ok(await MapToResponseAsync(analysis, diagram, agentResult, cancellationToken));
    }

    [HttpGet("/api/workspaces/{workspaceId:guid}/diagrams/{diagramId:guid}/analysis-runs")]
    public async Task<ActionResult<IEnumerable<AnalysisRunTimelineItemResponse>>> ListAnalysisRuns(
        [FromRoute] Guid workspaceId,
        [FromRoute] Guid diagramId,
        CancellationToken cancellationToken)
    {
        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return this.NotFoundProblem("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return this.NotFoundProblem("Workspace not found.");

        if (workspace.Id != workspaceId)
            return this.ValidationProblemFor("workspaceId", "Diagram does not belong to workspace.");
        if (workspace.TenantId != _currentUserService.GetCurrentUser().TenantId)
            return this.NotFoundProblem("Diagram not found.");

        var runs = (await _analysisRepository.GetByDiagramIdAsync(diagramId, cancellationToken))
            .OrderByDescending(run => run.RequestedAt)
            .ToList();
        var items = new List<AnalysisRunTimelineItemResponse>(runs.Count);

        foreach (var run in runs)
        {
            var result = run.Result;
            var score = result is null ? null : await CalculateScoreAsync(result, cancellationToken);

            items.Add(new AnalysisRunTimelineItemResponse
            {
                Id = run.Id,
                Status = run.Status.ToString(),
                FinalScore = score?.FinalScore,
                ScoreBand = score?.ScoreBand.ToString(),
                ExecutiveSummary = result?.ExecutiveSummary ?? string.Empty,
                TopFinding = result?.MissingControls.FirstOrDefault()?.Name,
                Frameworks = result?.ResolvedFrameworkSelection.SelectedFrameworks.Any() == true
                    ? result.ResolvedFrameworkSelection.SelectedFrameworks.Select(item => item.ToString()).ToList()
                    : result?.AgentTrace.Where(item => !string.IsNullOrWhiteSpace(item.Framework)).Select(item => item.Framework!).Distinct().ToList()
                        ?? diagram.FrameworkSelection.SelectedFrameworks.Select(item => item.ToString()).ToList(),
                CreatedAt = run.RequestedAt,
                CompletedAt = run.CompletedAt,
            });
        }

        return Ok(items);
    }

    [HttpPost("{diagramId}/analysis")]
    [HttpPost("/api/workspaces/{workspaceId:guid}/diagrams/{diagramId:guid}/analysis-runs")]
    [EnableRateLimiting(AnalysisRateLimiting.PolicyName)]
    public async Task<ActionResult<ArchitectureAnalysisResponse>> RunAnalysis(
        [FromRoute] Guid? workspaceId,
        [FromRoute] Guid diagramId,
        [FromBody] RunAnalysisRequest? request,
        CancellationToken cancellationToken)
    {
        var diagram = await _diagramRepository.GetByIdAsync(diagramId, cancellationToken);
        if (diagram is null)
            return this.NotFoundProblem("Diagram not found.");

        var workspace = await _workspaceRepository.GetByIdAsync(diagram.WorkspaceId, cancellationToken);
        if (workspace is null)
            return this.NotFoundProblem("Workspace not found.");

        if (workspaceId.HasValue && workspace.Id != workspaceId.Value)
            return this.ValidationProblemFor("workspaceId", "Diagram does not belong to workspace.");
        if (workspace.TenantId != _currentUserService.GetCurrentUser().TenantId)
            return this.NotFoundProblem("Diagram not found.");

        if (request?.ReviewSetup is not null)
        {
            var requestedWeights = DiagramReviewSetupMapper.ToDomainWeights(request.ReviewSetup, _frameworkSelectionService);
            if (requestedWeights.Sum(weight => weight.Weight) != 100)
                return this.ValidationProblemFor("reviewSetup.qualityAttributeWeights", "Quality attribute weights must total exactly 100.");

            diagram = await ApplyReviewSetupOverrideAsync(diagram, request.ReviewSetup, request.PersistReviewSetup, cancellationToken);
        }

        var startedAt = DateTime.UtcNow;
        var agentResult = await _analysisService.AnalyzeAsync(diagram, cancellationToken);
        diagram = await UpgradeDiagramReviewSetupIfNeededAsync(diagram, agentResult, cancellationToken);

        // Create analysis run record
        var analysisRun = new CoArchitect.Domain.Entities.AgentAnalysisRun
        {
            Id = Guid.NewGuid(),
            WorkspaceId = diagram.WorkspaceId,
            ArchitectureDiagramId = diagramId,
            Status = CoArchitect.Domain.Enums.AnalysisRunStatus.Completed,
            RequestedAt = startedAt,
            StartedAt = startedAt,
            CompletedAt = DateTime.UtcNow,
            Result = agentResult,
        };

        await _analysisRepository.AddAsync(analysisRun, cancellationToken);
        await _analysisRepository.SaveChangesAsync(cancellationToken);

        var response = await MapToResponseAsync(analysisRun, diagram, agentResult, cancellationToken);
        return Ok(response);
    }

    private async Task<ArchitectureDiagram> ApplyReviewSetupOverrideAsync(
        ArchitectureDiagram diagram,
        DiagramReviewSetupRequest reviewSetup,
        bool persistReviewSetup,
        CancellationToken cancellationToken)
    {
        var reviewContext = DiagramReviewSetupMapper.ToDomainContext(reviewSetup);
        var qualityAttributeWeights = DiagramReviewSetupMapper.ToDomainWeights(reviewSetup, _frameworkSelectionService);

        var frameworkSelection = _frameworkSelectionService.Select(
            diagram.Description,
            reviewContext,
            DiagramReviewSetupMapper.ToMode(reviewSetup.FrameworkSelectionMode),
            DiagramReviewSetupMapper.ToRequestedFrameworks(reviewSetup.RequestedFrameworks),
            DiagramReviewSetupMapper.ToRequestedStandards(reviewSetup.RequestedStandards),
            qualityAttributeWeights);

        var updated = new ArchitectureDiagram
        {
            Id = diagram.Id,
            WorkspaceId = diagram.WorkspaceId,
            UploadedByUserId = diagram.UploadedByUserId,
            Name = diagram.Name,
            OriginalFileName = diagram.OriginalFileName,
            FileUrl = diagram.FileUrl,
            Description = diagram.Description,
            ReviewContext = reviewContext,
            FrameworkSelection = frameworkSelection,
            QualityAttributeWeights = qualityAttributeWeights,
            UploadedAt = diagram.UploadedAt,
            Comments = diagram.Comments,
            AnalysisRuns = diagram.AnalysisRuns,
            Workspace = diagram.Workspace,
        };

        if (persistReviewSetup)
        {
            await _diagramRepository.UpdateAsync(updated, cancellationToken);
            await _diagramRepository.SaveChangesAsync(cancellationToken);
        }

        return updated;
    }

    private async Task<ArchitectureAnalysisResponse> MapToResponseAsync(
        CoArchitect.Domain.Entities.AgentAnalysisRun analysis,
        CoArchitect.Domain.Entities.ArchitectureDiagram diagram,
        CoArchitect.Domain.Models.AgentAnalysisResult agentResult,
        CancellationToken cancellationToken)
    {
        var score = await CalculateScoreAsync(agentResult, cancellationToken);

        var normalizedContext = agentResult.FoundryIqContext ?? new CoArchitect.Domain.Models.FoundryIqContextBundle();

        return new ArchitectureAnalysisResponse
        {
            Id = analysis.Id,
            DiagramId = analysis.ArchitectureDiagramId,
            Status = analysis.Status.ToString(),
            ExecutiveSummary = agentResult.ExecutiveSummary,
            OpenQuestions = agentResult.OpenQuestions.ToList(),
            CriticNotes = agentResult.CriticNotes.ToList(),
            FoundryIqContext = MapFoundryIqContext(normalizedContext),
            AgentTrace = agentResult.AgentTrace
                .Select(trace => new AgentExecutionTraceResponse
                {
                    AgentName = trace.AgentName,
                    Role = trace.Role,
                    Framework = trace.Framework,
                    Status = trace.Status,
                    Summary = trace.Summary,
                    Highlights = trace.Highlights.ToList(),
                    Grounding = MapGrounding(trace.Grounding),
                    UsedFoundry = trace.UsedFoundry,
                    StartedAt = trace.StartedAt,
                    CompletedAt = trace.CompletedAt,
                })
                .ToList(),
            Evidence = agentResult.Evidence
                .Select((evidence, index) => new EvidenceItemResponse
                {
                    Summary = evidence.Summary,
                    Detail = evidence.Details ?? string.Empty,
                    Severity = index == 0 ? "High" : index == 1 ? "Medium" : "Low",
                    Grounding = MapGrounding(evidence.Grounding),
                })
                .ToList(),
            MissingControls = agentResult.MissingControls
                .Select(control => new MissingControlResponse
                {
                    Name = control.Name,
                    Impact = control.Description,
                    Recommendation = GetRecommendationText(control.Dimension, control.Name),
                    Grounding = MapGrounding(control.Grounding),
                })
                .ToList(),
            Recommendations = agentResult.Recommendations
                .Select((recommendation, index) => new RecommendationResponse
                {
                    Title = GetRecommendationTitle(recommendation.Description, index),
                    Description = recommendation.Description,
                    Priority = recommendation.Severity.ToString(),
                    EstimatedEffort = GetEstimatedEffort(recommendation.Severity),
                    Grounding = MapGrounding(recommendation.Grounding),
                })
                .ToList(),
            Tradeoffs = agentResult.Tradeoffs
                .Select(tradeoff => new TradeoffResponse
                {
                    Scenario = tradeoff.Summary,
                    Pros = tradeoff.Pros,
                    Cons = tradeoff.Cons,
                    Grounding = MapGrounding(tradeoff.Grounding),
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
            ReviewSetup = DiagramReviewSetupMapper.ToResponse(diagram),
            CreatedAt = analysis.RequestedAt,
            CompletedAt = analysis.CompletedAt,
        };
    }

    private static FoundryIqContextBundleResponse MapFoundryIqContext(CoArchitect.Domain.Models.FoundryIqContextBundle bundle)
    {
        return new FoundryIqContextBundleResponse
        {
            RetrievalProvider = bundle.RetrievalProvider,
            FallbackUsed = bundle.FallbackUsed,
            FallbackReason = bundle.FallbackReason,
            FrameworkGuidanceItems = bundle.FrameworkGuidanceItems.Select(MapContextItem).ToList(),
            PrincipleItems = bundle.PrincipleItems.Select(MapContextItem).ToList(),
            TradeoffItems = bundle.TradeoffItems.Select(MapContextItem).ToList(),
            ComplianceItems = bundle.ComplianceItems.Select(MapContextItem).ToList(),
            AdrTemplateItems = bundle.AdrTemplateItems.Select(MapContextItem).ToList(),
            WorkspaceMemoryItems = bundle.WorkspaceMemoryItems.Select(MapContextItem).ToList(),
            RelatedFindingItems = bundle.RelatedFindingItems.Select(MapContextItem).ToList(),
            RelatedAdrHistoryItems = bundle.RelatedAdrHistoryItems.Select(MapContextItem).ToList(),
            CitationRefs = bundle.CitationRefs.ToList(),
            WorkspaceMemory = new WorkspaceMemorySnapshotResponse
            {
                PreviousReviewSummaries = bundle.WorkspaceMemory.PreviousReviewSummaries.ToList(),
                RecurringFindings = bundle.WorkspaceMemory.RecurringFindings.ToList(),
                PriorRecommendations = bundle.WorkspaceMemory.PriorRecommendations.ToList(),
                RecentComments = bundle.WorkspaceMemory.RecentComments.ToList(),
                AdrHistory = bundle.WorkspaceMemory.AdrHistory.ToList(),
                ArchitectureEvolutionSummary = bundle.WorkspaceMemory.ArchitectureEvolutionSummary,
            },
        };
    }

    private static FoundryIqContextItemResponse MapContextItem(CoArchitect.Domain.Models.FoundryIqContextItem item)
    {
        return new FoundryIqContextItemResponse
        {
            Id = item.Id,
            Category = item.Category,
            Title = item.Title,
            Summary = item.Summary,
            Content = item.Content,
            SourceType = item.SourceType,
            SourceLabel = item.SourceLabel,
            SourceProvider = item.SourceProvider,
            SourceUri = item.SourceUri,
            WorkspaceScoped = item.WorkspaceScoped,
            StandardKey = item.StandardKey,
            UseCaseTags = item.UseCaseTags.ToList(),
            WhyItMatters = item.WhyItMatters,
            WhenToApply = item.WhenToApply,
            Framework = item.Framework,
            Principle = item.Principle,
            TradeoffTag = item.TradeoffTag,
            AdrId = item.AdrId,
            AnalysisRunId = item.AnalysisRunId,
        };
    }

    private static GroundingReferenceSetResponse MapGrounding(CoArchitect.Domain.Models.GroundingReferenceSet? grounding)
    {
        grounding ??= new CoArchitect.Domain.Models.GroundingReferenceSet();

        return new GroundingReferenceSetResponse
        {
            FrameworkRefs = grounding.FrameworkRefs.ToList(),
            StandardRefs = grounding.StandardRefs.ToList(),
            PrincipleRefs = grounding.PrincipleRefs.ToList(),
            TradeoffRefs = grounding.TradeoffRefs.ToList(),
            HistoryRefs = grounding.HistoryRefs.ToList(),
            CitationRefs = grounding.CitationRefs.ToList(),
        };
    }

    private async Task<CoArchitect.Domain.Models.AgentAnalysisResult> GetStoredOrFreshResultAsync(
        CoArchitect.Domain.Entities.AgentAnalysisRun analysis,
        CoArchitect.Domain.Entities.ArchitectureDiagram diagram,
        CancellationToken cancellationToken)
    {
        if (analysis.Result is not null)
        {
            return analysis.Result;
        }

        var result = await _analysisService.AnalyzeAsync(diagram, cancellationToken);
        var updatedRun = new CoArchitect.Domain.Entities.AgentAnalysisRun
        {
            Id = analysis.Id,
            WorkspaceId = analysis.WorkspaceId,
            ArchitectureDiagramId = analysis.ArchitectureDiagramId,
            Status = analysis.Status,
            RequestedAt = analysis.RequestedAt,
            StartedAt = analysis.StartedAt,
            CompletedAt = analysis.CompletedAt,
            ReportPath = analysis.ReportPath,
            Suggestions = analysis.Suggestions,
            Result = result,
        };

        await _analysisRepository.UpdateAsync(updatedRun, cancellationToken);
        await _analysisRepository.SaveChangesAsync(cancellationToken);
        return result;
    }

    private async Task<CoArchitect.Domain.Entities.ArchitectureDiagram> UpgradeDiagramReviewSetupIfNeededAsync(
        CoArchitect.Domain.Entities.ArchitectureDiagram diagram,
        CoArchitect.Domain.Models.AgentAnalysisResult result,
        CancellationToken cancellationToken)
    {
        var shouldUpgradeFrameworks =
            !diagram.FrameworkSelection.SelectedFrameworks.SequenceEqual(result.ResolvedFrameworkSelection.SelectedFrameworks) ||
            !diagram.FrameworkSelection.SelectedStandards.SequenceEqual(result.ResolvedFrameworkSelection.SelectedStandards) ||
            diagram.FrameworkSelection.SelectionRationale.Count == 0;

        var shouldUpgradeWeights =
            !diagram.QualityAttributeWeights.Any() && result.ResolvedQualityAttributeWeights.Any();

        if (!shouldUpgradeFrameworks && !shouldUpgradeWeights)
        {
            return diagram;
        }

        var upgraded = new CoArchitect.Domain.Entities.ArchitectureDiagram
        {
            Id = diagram.Id,
            WorkspaceId = diagram.WorkspaceId,
            UploadedByUserId = diagram.UploadedByUserId,
            Name = diagram.Name,
            OriginalFileName = diagram.OriginalFileName,
            FileUrl = diagram.FileUrl,
            Description = diagram.Description,
            ReviewContext = diagram.ReviewContext,
            FrameworkSelection = result.ResolvedFrameworkSelection,
            QualityAttributeWeights = shouldUpgradeWeights
                ? result.ResolvedQualityAttributeWeights.ToList()
                : diagram.QualityAttributeWeights.ToList(),
            UploadedAt = diagram.UploadedAt,
            Comments = diagram.Comments,
            AnalysisRuns = diagram.AnalysisRuns,
            Workspace = diagram.Workspace,
        };

        await _diagramRepository.UpdateAsync(upgraded, cancellationToken);
        await _diagramRepository.SaveChangesAsync(cancellationToken);
        return upgraded;
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
