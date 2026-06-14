using System.Text;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Models;

namespace CoArchitect.Api.Services;

public static class ArchitectureAnalysisPromptBuilder
{
    public static string Build(ArchitectureDiagram diagram)
    {
        var builder = new StringBuilder();

        if (!string.IsNullOrWhiteSpace(diagram.Description))
        {
            builder.AppendLine(diagram.Description.Trim());
        }

        if (!string.IsNullOrWhiteSpace(diagram.ReviewContext.BusinessDomain))
        {
            builder.AppendLine($"Business domain: {diagram.ReviewContext.BusinessDomain}");
        }

        if (!string.IsNullOrWhiteSpace(diagram.ReviewContext.TargetUsers))
        {
            builder.AppendLine($"Target users: {diagram.ReviewContext.TargetUsers}");
        }

        if (!string.IsNullOrWhiteSpace(diagram.ReviewContext.ExpectedTraffic))
        {
            builder.AppendLine($"Expected traffic: {diagram.ReviewContext.ExpectedTraffic}");
        }

        if (!string.IsNullOrWhiteSpace(diagram.ReviewContext.DataSensitivity))
        {
            builder.AppendLine($"Data sensitivity: {diagram.ReviewContext.DataSensitivity}");
        }

        if (!string.IsNullOrWhiteSpace(diagram.ReviewContext.CloudProviderPreference))
        {
            builder.AppendLine($"Cloud provider preference: {diagram.ReviewContext.CloudProviderPreference}");
        }

        if (!string.IsNullOrWhiteSpace(diagram.ReviewContext.ComplianceNeeds))
        {
            builder.AppendLine($"Compliance needs: {diagram.ReviewContext.ComplianceNeeds}");
        }

        if (!string.IsNullOrWhiteSpace(diagram.ReviewContext.CurrentPainPoints))
        {
            builder.AppendLine($"Current pain points: {diagram.ReviewContext.CurrentPainPoints}");
        }

        if (diagram.FrameworkSelection.SelectedFrameworks.Count > 0)
        {
            builder.AppendLine($"Selected review frameworks: {string.Join(", ", diagram.FrameworkSelection.SelectedFrameworks)}");
        }

        var cloudConstraint = CloudProviderConstraint.Resolve(diagram.ReviewContext.CloudProviderPreference, diagram.FrameworkSelection.SelectedFrameworks);
        foreach (var guardrail in cloudConstraint.BuildPromptGuardrails())
        {
            builder.AppendLine(guardrail);
        }

        if (diagram.QualityAttributeWeights.Count > 0)
        {
            builder.AppendLine("Quality attribute weights:");
            foreach (var weight in diagram.QualityAttributeWeights)
            {
                builder.AppendLine($"- {weight.Label}: {weight.Weight}%");
            }
        }

        return builder.ToString().Trim();
    }
}
