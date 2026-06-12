using System.Text;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;
using CoArchitect.Domain.Services;

namespace CoArchitect.Application.Services;

public sealed class AdrGenerationService : IAdrGenerationService
{
    public Task<AdrVersion> GenerateAsync(
        Guid adrId,
        int versionNumber,
        ArchitectureDiagram diagram,
        AgentAnalysisRun? analysis,
        IEnumerable<DiagramComment> comments,
        Guid createdByUserId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var title = $"ADR: Improve architecture for {diagram.Name}";
        var status = analysis is null ? "Draft" : "Proposed";
        var date = (analysis?.RequestedAt ?? diagram.UploadedAt).ToString("yyyy-MM-dd");
        var frameworks = (analysis?.Result?.ResolvedFrameworkSelection.SelectedFrameworks.Select(item => item.ToString()).ToList()
            ?? diagram.FrameworkSelection.SelectedFrameworks.Select(item => item.ToString()).ToList());
        var standards = (analysis?.Result?.ResolvedFrameworkSelection.SelectedStandards.Select(ReviewStandardCatalog.ToDisplayLabel).ToList()
            ?? diagram.FrameworkSelection.SelectedStandards.Select(ReviewStandardCatalog.ToDisplayLabel).ToList());
        var groundedContext = BuildGroundedContext(analysis?.Result);

        var context = new List<string>
        {
            string.IsNullOrWhiteSpace(diagram.Description)
                ? "Architecture evidence was uploaded without a long-form description."
                : diagram.Description.Trim(),
            analysis?.Result?.ExecutiveSummary ?? "No completed analysis is available yet, so the decision remains a draft.",
        };
        context.AddRange(comments.Take(3).Select(comment => $"Stakeholder note: {comment.Content}"));

        var decision = analysis?.Result?.Recommendations.Any() == true
            ? analysis.Result.Recommendations.Take(3).Select(item => $"{BuildRecommendationTitle(item.Description)}: {item.Description}").ToList()
            : new List<string> { "Run architecture analysis to generate actionable recommendations." };

        var alternatives = analysis?.Result?.Tradeoffs.Any() == true
            ? analysis.Result.Tradeoffs.Select(item => item.Summary).ToList()
            : new List<string> { "Keep the current architecture and monitor risk until more evidence is collected." };

        var tradeoffs = analysis?.Result?.Tradeoffs.Any() == true
            ? analysis.Result.Tradeoffs.Take(4).Select(FormatTradeoff).ToList()
            : new List<string> { "No trade-offs captured yet." };

        var consequences = analysis?.Result?.MissingControls.Any() == true
            ? analysis.Result.MissingControls.Take(4).Select(item => $"{item.Name}: {item.Description}").ToList()
            : new List<string> { "No major consequence set has been recorded yet." };

        var risks = analysis?.Result?.CriticNotes.Any() == true
            ? analysis.Result.CriticNotes.ToList()
            : analysis?.Result?.OpenQuestions.Any() == true
                ? analysis.Result.OpenQuestions.ToList()
                : new List<string> { "Further architecture review is needed to document implementation risks." };

        var history = new List<string>
        {
            $"Uploaded architecture evidence on {diagram.UploadedAt:yyyy-MM-dd}.",
            analysis is not null ? $"Generated AI review on {analysis.RequestedAt:yyyy-MM-dd}." : "No AI review history yet.",
            comments.Any() ? $"{comments.Count()} comment(s) are attached to this architecture." : "No stakeholder comments recorded.",
            $"ADR version {versionNumber} generated on {DateTime.UtcNow:yyyy-MM-dd}.",
        };

        var draft = new AdrDocument
        {
            Title = title,
            Status = status,
            Date = date,
            Context = context,
            Decision = decision,
            Alternatives = alternatives,
            Tradeoffs = tradeoffs,
            Consequences = consequences,
            Risks = risks,
            Frameworks = frameworks,
            Standards = standards,
            GroundedContext = groundedContext,
            History = history,
        };

        return Task.FromResult(new AdrVersion
        {
            Id = Guid.NewGuid(),
            AdrId = adrId,
            VersionNumber = versionNumber,
            Title = title,
            Status = status,
            Frameworks = frameworks,
            Draft = draft,
            Markdown = BuildMarkdown(draft),
            Html = BuildHtml(draft),
            Summary = analysis?.Result?.ExecutiveSummary ?? "ADR draft generated from architecture evidence.",
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow,
        });
    }

    private static string BuildMarkdown(AdrDocument draft)
    {
        var lines = new List<string>
        {
            $"# {draft.Title}",
            string.Empty,
            $"- Status: {draft.Status}",
            $"- Date: {draft.Date}",
            $"- Frameworks: {(draft.Frameworks.Count > 0 ? string.Join(", ", draft.Frameworks) : "None selected")}",
            $"- Standards: {(draft.Standards.Count > 0 ? string.Join(", ", draft.Standards) : "None selected")}",
            string.Empty,
            "## Context",
        };
        lines.AddRange(draft.Context.Select(item => $"- {item}"));
        lines.Add(string.Empty);
        lines.Add("## Decision");
        lines.AddRange(draft.Decision.Select(item => $"- {item}"));
        lines.Add(string.Empty);
        lines.Add("## Alternatives Considered");
        lines.AddRange(draft.Alternatives.Select(item => $"- {item}"));
        lines.Add(string.Empty);
        lines.Add("## Trade-offs");
        lines.AddRange(draft.Tradeoffs.Select(item => $"- {item}"));
        lines.Add(string.Empty);
        lines.Add("## Grounded Context Used");
        lines.AddRange(draft.GroundedContext.Select(item => $"- {item}"));
        lines.Add(string.Empty);
        lines.Add("## Consequences");
        lines.AddRange(draft.Consequences.Select(item => $"- {item}"));
        lines.Add(string.Empty);
        lines.Add("## Risks and Open Questions");
        lines.AddRange(draft.Risks.Select(item => $"- {item}"));
        return string.Join('\n', lines);
    }

    private static string BuildHtml(AdrDocument draft)
    {
        var builder = new StringBuilder();
        builder.AppendLine("<article style=\"font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.65;\">");
        builder.AppendLine($"<h1 style=\"margin-bottom: 8px;\">{EscapeHtml(draft.Title)}</h1>");
        builder.AppendLine($"<p style=\"margin: 0 0 8px; color: #4b5563;\">Status: {EscapeHtml(draft.Status)} | Date: {EscapeHtml(draft.Date)}</p>");
        builder.AppendLine($"<p style=\"margin: 0 0 20px; color: #4b5563;\">Frameworks: {EscapeHtml(draft.Frameworks.Count > 0 ? string.Join(", ", draft.Frameworks) : "None selected")} | Standards: {EscapeHtml(draft.Standards.Count > 0 ? string.Join(", ", draft.Standards) : "None selected")}</p>");
        builder.AppendLine(RenderSection("Context", draft.Context));
        builder.AppendLine(RenderSection("Decision", draft.Decision));
        builder.AppendLine(RenderSection("Alternatives Considered", draft.Alternatives));
        builder.AppendLine(RenderSection("Trade-offs", draft.Tradeoffs));
        builder.AppendLine(RenderSection("Grounded Context Used", draft.GroundedContext));
        builder.AppendLine(RenderSection("Consequences", draft.Consequences));
        builder.AppendLine(RenderSection("Risks and Open Questions", draft.Risks));
        builder.AppendLine("</article>");
        return builder.ToString().Trim();
    }

    private static string RenderSection(string title, IEnumerable<string> items)
    {
        var listItems = string.Join(string.Empty, items.Select(item => $"<li style=\"margin-bottom: 8px;\">{EscapeHtml(item)}</li>"));
        return $"""
            <section style="margin: 24px 0;">
              <h2 style="margin: 0 0 12px; font-size: 18px;">{EscapeHtml(title)}</h2>
              <ul style="margin: 0; padding-left: 20px;">{listItems}</ul>
            </section>
            """;
    }

    private static string FormatTradeoff(Tradeoff tradeoff)
    {
        var pros = tradeoff.Pros.Any() ? $"Pros: {string.Join(", ", tradeoff.Pros)}" : "Pros: not captured";
        var cons = tradeoff.Cons.Any() ? $"Cons: {string.Join(", ", tradeoff.Cons)}" : "Cons: not captured";
        return $"{tradeoff.Summary}. {pros}. {cons}.";
    }

    private static List<string> BuildGroundedContext(AgentAnalysisResult? result)
    {
        if (result is null)
        {
            return new List<string> { "No completed analysis is available yet." };
        }

        var context = result.FoundryIqContext.FrameworkGuidanceItems
            .Concat(result.FoundryIqContext.ComplianceItems)
            .Concat(result.FoundryIqContext.PrincipleItems)
            .Concat(result.FoundryIqContext.TradeoffItems)
            .Select(item => string.IsNullOrWhiteSpace(item.SourceLabel)
                ? item.Title
                : $"{item.SourceLabel}: {item.Title}")
            .Concat(result.FoundryIqContext.CitationRefs)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(8)
            .ToList();

        return context.Count > 0
            ? context
            : new List<string> { "Analysis used the configured review setup, but no explicit Foundry IQ citations were captured." };
    }

    private static string BuildRecommendationTitle(string description)
    {
        var trimmed = description.Trim();
        if (trimmed.Length <= 48)
        {
            return trimmed;
        }

        return $"{trimmed[..45].TrimEnd()}...";
    }

    private static string EscapeHtml(string value)
    {
        return value
            .Replace("&", "&amp;", StringComparison.Ordinal)
            .Replace("<", "&lt;", StringComparison.Ordinal)
            .Replace(">", "&gt;", StringComparison.Ordinal)
            .Replace("\"", "&quot;", StringComparison.Ordinal)
            .Replace("'", "&#39;", StringComparison.Ordinal);
    }
}
