using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;

namespace CoArchitect.Application.Services;

public sealed class FrameworkSelectionService : IFrameworkSelectionService
{
    private static readonly IReadOnlyList<QualityAttributeWeight> DefaultWeights = new[]
    {
        new QualityAttributeWeight { Key = "security", Label = "Security", Weight = 25 },
        new QualityAttributeWeight { Key = "availability", Label = "Availability", Weight = 20 },
        new QualityAttributeWeight { Key = "scalability", Label = "Scalability", Weight = 15 },
        new QualityAttributeWeight { Key = "cost", Label = "Cost", Weight = 10 },
        new QualityAttributeWeight { Key = "maintainability", Label = "Maintainability", Weight = 10 },
        new QualityAttributeWeight { Key = "compliance", Label = "Compliance", Weight = 10 },
        new QualityAttributeWeight { Key = "deliverySpeed", Label = "Delivery Speed", Weight = 10 },
    };

    private static readonly string[] AzureKeywords =
    {
        "azure", "app service", "azure functions", "api management", "blob storage", "azure sql",
        "aks", "kubernetes service", "service bus", "entra", "cosmos db", "key vault", "event hub"
    };

    private static readonly string[] AwsKeywords =
    {
        "aws", "api gateway", "lambda", "s3", "rds", "ecs", "eks", "cloudfront", "sqs", "sns", "cognito", "dynamodb"
    };

    public FrameworkSelectionResult Select(
        string? architectureDescription,
        ArchitectureReviewContext reviewContext,
        FrameworkSelectionMode mode,
        IEnumerable<ReviewFramework> requestedFrameworks,
        IEnumerable<QualityAttributeWeight> qualityAttributeWeights)
    {
        var requested = requestedFrameworks.Distinct().ToList();
        var normalizedText = BuildNormalizedText(architectureDescription, reviewContext);
        var weights = qualityAttributeWeights.Any() ? qualityAttributeWeights.ToList() : GetDefaultWeights().ToList();

        if (mode == FrameworkSelectionMode.Manual && requested.Count > 0)
        {
            return new FrameworkSelectionResult
            {
                Mode = mode,
                RequestedFrameworks = requested,
                SelectedFrameworks = requested,
                DetectedCloudProvider = DetectCloudProvider(normalizedText, reviewContext),
                ConfidenceScore = 0.99,
                SelectionRationale = new List<string>
                {
                    "Frameworks were selected manually by the user.",
                    "The system will preserve the chosen frameworks and still show detected cloud context for transparency.",
                },
            };
        }

        var selected = new List<ReviewFramework>();
        var rationale = new List<string>();
        var detectedCloudProvider = DetectCloudProvider(normalizedText, reviewContext);

        if (ContainsAny(normalizedText, AzureKeywords) || string.Equals(reviewContext.CloudProviderPreference, "Azure", StringComparison.OrdinalIgnoreCase))
        {
            selected.Add(ReviewFramework.AzureWellArchitected);
            rationale.Add("Azure Well-Architected was prioritized because Azure services or an Azure cloud preference were detected.");
        }

        if (ContainsAny(normalizedText, AwsKeywords) || string.Equals(reviewContext.CloudProviderPreference, "AWS", StringComparison.OrdinalIgnoreCase))
        {
            selected.Add(ReviewFramework.AwsWellArchitected);
            rationale.Add("AWS Well-Architected was prioritized because AWS services or an AWS cloud preference were detected.");
        }

        if (ShouldIncludeIso(normalizedText, weights))
        {
            selected.Add(ReviewFramework.Iso25010);
            rationale.Add("ISO/IEC 25010 was included because the architecture context emphasizes system quality, maintainability, or broad non-functional fit.");
        }

        if (ShouldIncludeOwasp(normalizedText, reviewContext, weights))
        {
            selected.Add(ReviewFramework.OwaspAsvs);
            rationale.Add("OWASP ASVS was included because the architecture appears to include web APIs, external users, sensitive data, or security-critical access flows.");
        }

        if (selected.Count == 0)
        {
            selected.Add(ReviewFramework.Iso25010);
            rationale.Add("A cloud-neutral baseline starts with ISO/IEC 25010 when no provider-specific evidence is present.");

            if (ShouldIncludeOwasp(normalizedText, reviewContext, weights))
            {
                selected.Add(ReviewFramework.OwaspAsvs);
                rationale.Add("OWASP ASVS was added to the cloud-neutral baseline because security-sensitive application behavior was detected.");
            }
            else
            {
                rationale.Add("Generic reliability, scalability, and operability principles should be compared across provider-neutral options in later reasoning steps.");
            }
        }

        if (selected.Contains(ReviewFramework.AzureWellArchitected) && selected.Contains(ReviewFramework.AwsWellArchitected))
        {
            rationale.Add("Both Azure and AWS frameworks were retained because the architecture signals a hybrid or comparison-oriented cloud context.");
        }

        return new FrameworkSelectionResult
        {
            Mode = FrameworkSelectionMode.AutoDetect,
            RequestedFrameworks = requested,
            SelectedFrameworks = selected.Distinct().ToList(),
            DetectedCloudProvider = detectedCloudProvider,
            ConfidenceScore = CalculateConfidence(selected, detectedCloudProvider, normalizedText),
            SelectionRationale = rationale,
        };
    }

    public IReadOnlyList<QualityAttributeWeight> GetDefaultWeights()
    {
        return DefaultWeights
            .Select(weight => new QualityAttributeWeight
            {
                Key = weight.Key,
                Label = weight.Label,
                Weight = weight.Weight,
            })
            .ToList();
    }

    private static string BuildNormalizedText(string? architectureDescription, ArchitectureReviewContext reviewContext)
    {
        return string.Join(
                ' ',
                architectureDescription,
                reviewContext.BusinessDomain,
                reviewContext.TargetUsers,
                reviewContext.ExpectedTraffic,
                reviewContext.DataSensitivity,
                reviewContext.CloudProviderPreference,
                reviewContext.ComplianceNeeds,
                reviewContext.CurrentPainPoints)
            .ToLowerInvariant();
    }

    private static bool ContainsAny(string text, IEnumerable<string> keywords)
    {
        return keywords.Any(keyword => ContainsPositiveSignal(text, keyword));
    }

    private static bool ContainsPositiveSignal(string text, string keyword)
    {
        if (!text.Contains(keyword, StringComparison.Ordinal))
        {
            return false;
        }

        var negativePhrases = new[]
        {
            $"no {keyword}",
            $"without {keyword}",
            $"missing {keyword}",
            $"lack {keyword}",
            $"lacks {keyword}",
        };

        return !negativePhrases.Any(text.Contains);
    }

    private static bool ShouldIncludeIso(string normalizedText, IEnumerable<QualityAttributeWeight> weights)
    {
        if (ContainsAny(normalizedText, new[] { "maintainability", "usability", "compatibility", "quality", "non-functional", "portability" }))
        {
            return true;
        }

        return weights.Any(weight =>
            (weight.Key.Equals("maintainability", StringComparison.OrdinalIgnoreCase) ||
             weight.Key.Equals("availability", StringComparison.OrdinalIgnoreCase) ||
             weight.Key.Equals("scalability", StringComparison.OrdinalIgnoreCase)) &&
            weight.Weight >= 15);
    }

    private static bool ShouldIncludeOwasp(string normalizedText, ArchitectureReviewContext reviewContext, IEnumerable<QualityAttributeWeight> weights)
    {
        if (ContainsAny(normalizedText, new[] { "api", "authentication", "authorization", "pii", "multi-tenant", "multitenant", "external users", "session", "web app", "admin" }))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(reviewContext.DataSensitivity) &&
            ContainsAny(reviewContext.DataSensitivity.ToLowerInvariant(), new[] { "pii", "sensitive", "regulated", "confidential" }))
        {
            return true;
        }

        return weights.Any(weight =>
            (weight.Key.Equals("security", StringComparison.OrdinalIgnoreCase) ||
             weight.Key.Equals("compliance", StringComparison.OrdinalIgnoreCase)) &&
            weight.Weight >= 15);
    }

    private static string DetectCloudProvider(string normalizedText, ArchitectureReviewContext reviewContext)
    {
        if (string.Equals(reviewContext.CloudProviderPreference, "Azure", StringComparison.OrdinalIgnoreCase) ||
            ContainsAny(normalizedText, AzureKeywords))
        {
            return "Azure";
        }

        if (string.Equals(reviewContext.CloudProviderPreference, "AWS", StringComparison.OrdinalIgnoreCase) ||
            ContainsAny(normalizedText, AwsKeywords))
        {
            return "AWS";
        }

        return "Cloud-neutral";
    }

    private static double CalculateConfidence(ICollection<ReviewFramework> selected, string detectedCloudProvider, string normalizedText)
    {
        if (selected.Count == 0)
        {
            return 0.55;
        }

        if (!string.Equals(detectedCloudProvider, "Cloud-neutral", StringComparison.OrdinalIgnoreCase))
        {
            return selected.Count > 1 || normalizedText.Length > 120 ? 0.9 : 0.82;
        }

        return selected.Contains(ReviewFramework.OwaspAsvs) ? 0.78 : 0.68;
    }
}
