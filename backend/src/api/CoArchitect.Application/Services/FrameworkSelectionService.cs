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
        IEnumerable<ReviewStandard> requestedStandards,
        IEnumerable<QualityAttributeWeight> qualityAttributeWeights)
    {
        var requested = requestedFrameworks.Distinct().ToList();
        var requestedStandardList = requestedStandards.Distinct().ToList();
        var normalizedText = BuildNormalizedText(architectureDescription, reviewContext);
        var weights = qualityAttributeWeights.Any() ? qualityAttributeWeights.ToList() : GetDefaultWeights().ToList();
        var cloudConstraint = CloudProviderConstraint.Resolve(reviewContext.CloudProviderPreference, requested);

        if (mode == FrameworkSelectionMode.Manual && (requested.Count > 0 || requestedStandardList.Count > 0))
        {
            var filteredRequested = cloudConstraint.FilterFrameworks(requested);
            var manualRationale = new List<string>
            {
                "Review frameworks and standards were selected manually by the user.",
                "The system will preserve the chosen review lenses and still show detected cloud and governance context for transparency.",
            };

            if (filteredRequested.Count != requested.Count)
            {
                manualRationale.Add($"Frameworks that conflicted with the selected {cloudConstraint.DisplayLabel} cloud preference were removed.");
            }

            return new FrameworkSelectionResult
            {
                Mode = mode,
                RequestedFrameworks = requested,
                SelectedFrameworks = filteredRequested,
                RequestedStandards = requestedStandardList,
                SelectedStandards = requestedStandardList,
                DetectedCloudProvider = DetectCloudProvider(normalizedText, reviewContext, filteredRequested),
                ConfidenceScore = 0.99,
                SelectionRationale = manualRationale,
            };
        }

        var selected = new List<ReviewFramework>();
        var selectedStandards = new List<ReviewStandard>();
        var rationale = new List<string>();
        var detectedCloudProvider = DetectCloudProvider(normalizedText, reviewContext, requested);

        if (cloudConstraint.AllowsAzure &&
            (ContainsAny(normalizedText, AzureKeywords) || detectedCloudProvider.Equals("Azure", StringComparison.OrdinalIgnoreCase)))
        {
            selected.Add(ReviewFramework.AzureWellArchitected);
            rationale.Add("Azure Well-Architected was prioritized because Azure services or an Azure cloud preference were detected.");
        }

        if (cloudConstraint.AllowsAws &&
            (ContainsAny(normalizedText, AwsKeywords) || detectedCloudProvider.Equals("AWS", StringComparison.OrdinalIgnoreCase)))
        {
            selected.Add(ReviewFramework.AwsWellArchitected);
            rationale.Add("AWS Well-Architected was prioritized because AWS services or an AWS cloud preference were detected.");
        }

        if (cloudConstraint.IsExclusiveAzure && !selected.Contains(ReviewFramework.AzureWellArchitected))
        {
            selected.Add(ReviewFramework.AzureWellArchitected);
            rationale.Add("Azure Well-Architected was retained because the review setup explicitly selected Azure as the only cloud provider.");
        }

        if (cloudConstraint.IsExclusiveAws && !selected.Contains(ReviewFramework.AwsWellArchitected))
        {
            selected.Add(ReviewFramework.AwsWellArchitected);
            rationale.Add("AWS Well-Architected was retained because the review setup explicitly selected AWS as the only cloud provider.");
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

        if (ShouldIncludeIso27001(normalizedText, reviewContext, weights))
        {
            selectedStandards.Add(ReviewStandard.Iso27001);
            rationale.Add("ISO 27001 was included because the review context points to access control, auditability, secrets handling, or broader security governance needs.");
        }

        if (ShouldIncludeGdpr(normalizedText, reviewContext))
        {
            selectedStandards.Add(ReviewStandard.Gdpr);
            rationale.Add("GDPR was included because the architecture appears to handle personal data, European users, or data-retention and deletion responsibilities.");
        }

        if (ShouldIncludeSoc2(normalizedText, reviewContext))
        {
            selectedStandards.Add(ReviewStandard.Soc2);
            rationale.Add("SOC 2 was included because the architecture needs stronger control evidence for security, availability, confidentiality, or audit-ready operations.");
        }

        if (ShouldIncludeTogaf(normalizedText, reviewContext, weights))
        {
            selectedStandards.Add(ReviewStandard.Togaf);
            rationale.Add("TOGAF was included because the architecture signals governance-heavy change planning, capability thinking, or enterprise roadmap coordination.");
        }

        if (ShouldIncludeSafe(normalizedText, reviewContext))
        {
            selectedStandards.Add(ReviewStandard.Safe);
            rationale.Add("SAFe was included because the architecture appears to involve platform coordination, value streams, or multi-team delivery alignment.");
        }

        selected = cloudConstraint.FilterFrameworks(selected);

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
            RequestedStandards = requestedStandardList,
            SelectedStandards = selectedStandards.Distinct().ToList(),
            DetectedCloudProvider = DetectCloudProvider(normalizedText, reviewContext, selected),
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

    private static bool ShouldIncludeIso27001(string normalizedText, ArchitectureReviewContext reviewContext, IEnumerable<QualityAttributeWeight> weights)
    {
        if (ContainsAny(normalizedText, new[] { "audit", "access control", "secrets", "credential", "incident", "risk", "isms", "security controls", "key vault" }))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(reviewContext.ComplianceNeeds) &&
            ContainsAny(reviewContext.ComplianceNeeds.ToLowerInvariant(), new[] { "iso 27001", "security", "audit", "control" }))
        {
            return true;
        }

        return weights.Any(weight =>
            (weight.Key.Equals("security", StringComparison.OrdinalIgnoreCase) ||
             weight.Key.Equals("compliance", StringComparison.OrdinalIgnoreCase)) &&
            weight.Weight >= 20);
    }

    private static bool ShouldIncludeGdpr(string normalizedText, ArchitectureReviewContext reviewContext)
    {
        if (ContainsAny(normalizedText, new[] { "gdpr", "personal data", "pii", "privacy", "retention", "deletion", "europe", "european", "eu" }))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(reviewContext.ComplianceNeeds) &&
               ContainsAny(reviewContext.ComplianceNeeds.ToLowerInvariant(), new[] { "gdpr", "privacy", "retention", "deletion" });
    }

    private static bool ShouldIncludeSoc2(string normalizedText, ArchitectureReviewContext reviewContext)
    {
        if (ContainsAny(normalizedText, new[] { "soc 2", "audit evidence", "availability", "confidentiality", "trust", "controls" }))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(reviewContext.ComplianceNeeds) &&
               ContainsAny(reviewContext.ComplianceNeeds.ToLowerInvariant(), new[] { "soc 2", "audit", "availability", "confidentiality" });
    }

    private static bool ShouldIncludeTogaf(string normalizedText, ArchitectureReviewContext reviewContext, IEnumerable<QualityAttributeWeight> weights)
    {
        if (ContainsAny(normalizedText, new[] { "governance", "architecture board", "enterprise architecture", "roadmap", "capability", "change management" }))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(reviewContext.CurrentPainPoints) &&
            ContainsAny(reviewContext.CurrentPainPoints.ToLowerInvariant(), new[] { "governance", "roadmap", "change management", "enterprise" }))
        {
            return true;
        }

        return weights.Any(weight => weight.Key.Equals("deliverySpeed", StringComparison.OrdinalIgnoreCase) && weight.Weight >= 15)
               && ContainsAny(normalizedText, new[] { "governance", "roadmap", "platform" });
    }

    private static bool ShouldIncludeSafe(string normalizedText, ArchitectureReviewContext reviewContext)
    {
        if (ContainsAny(normalizedText, new[] { "value stream", "release train", "platform team", "system team", "release coordination", "many teams" }))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(reviewContext.TargetUsers) &&
               ContainsAny(reviewContext.TargetUsers.ToLowerInvariant(), new[] { "operations", "partners", "integrators", "enterprise tenants" }) &&
               ContainsAny(normalizedText, new[] { "platform", "shared service", "release", "coordination" });
    }

    private static string DetectCloudProvider(string normalizedText, ArchitectureReviewContext reviewContext, IEnumerable<ReviewFramework>? selectedFrameworks = null)
    {
        var cloudConstraint = CloudProviderConstraint.Resolve(reviewContext.CloudProviderPreference, selectedFrameworks);

        if (cloudConstraint.IsExclusiveAzure)
        {
            return "Azure";
        }

        if (cloudConstraint.IsExclusiveAws)
        {
            return "AWS";
        }

        if (ContainsAny(normalizedText, AzureKeywords) && !ContainsAny(normalizedText, AwsKeywords))
        {
            return "Azure";
        }

        if (ContainsAny(normalizedText, AwsKeywords) && !ContainsAny(normalizedText, AzureKeywords))
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
