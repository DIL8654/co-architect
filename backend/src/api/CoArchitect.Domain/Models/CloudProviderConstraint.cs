using CoArchitect.Domain.Enums;

namespace CoArchitect.Domain.Models;

public sealed class CloudProviderConstraint
{
    private static readonly string[] AzureOnlyMarkers =
    [
        "azure",
        "azure well-architected",
        "azure app service",
        "azure functions",
        "azure sql",
        "azure monitor",
        "azure key vault",
        "azure blob",
        "blob storage",
        "service bus",
        "entra",
        "cosmos db",
        "event hub",
        "managed identity",
        "aks",
    ];

    private static readonly string[] AwsOnlyMarkers =
    [
        "aws",
        "aws well-architected",
        "lambda",
        "s3",
        "rds",
        "ecs",
        "eks",
        "cloudfront",
        "sqs",
        "sns",
        "cognito",
        "dynamodb",
        "cloudwatch",
        "iam",
        "kms",
    ];

    private CloudProviderConstraint(bool allowsAzure, bool allowsAws, string displayLabel)
    {
        AllowsAzure = allowsAzure;
        AllowsAws = allowsAws;
        DisplayLabel = displayLabel;
    }

    public bool AllowsAzure { get; }
    public bool AllowsAws { get; }
    public string DisplayLabel { get; }

    public bool IsExclusiveAzure => AllowsAzure && !AllowsAws;
    public bool IsExclusiveAws => AllowsAws && !AllowsAzure;
    public bool IsCloudNeutral => AllowsAzure && AllowsAws;

    public static CloudProviderConstraint Resolve(string? preference, IEnumerable<ReviewFramework>? frameworks = null)
    {
        var selections = ParseSelections(preference);
        var preferenceHasAzure = selections.Contains("azure", StringComparer.OrdinalIgnoreCase);
        var preferenceHasAws = selections.Contains("aws", StringComparer.OrdinalIgnoreCase);

        if (preferenceHasAzure && !preferenceHasAws)
        {
            return new CloudProviderConstraint(allowsAzure: true, allowsAws: false, "Azure");
        }

        if (preferenceHasAws && !preferenceHasAzure)
        {
            return new CloudProviderConstraint(allowsAzure: false, allowsAws: true, "AWS");
        }

        var frameworkList = frameworks?.Distinct().ToList() ?? [];
        var hasAzureSelection = preferenceHasAzure || frameworkList.Contains(ReviewFramework.AzureWellArchitected);
        var hasAwsSelection = preferenceHasAws || frameworkList.Contains(ReviewFramework.AwsWellArchitected);

        return (hasAzureSelection, hasAwsSelection) switch
        {
            (true, false) => new CloudProviderConstraint(allowsAzure: true, allowsAws: false, "Azure"),
            (false, true) => new CloudProviderConstraint(allowsAzure: false, allowsAws: true, "AWS"),
            (true, true) => new CloudProviderConstraint(allowsAzure: true, allowsAws: true, "Hybrid"),
            _ => new CloudProviderConstraint(allowsAzure: true, allowsAws: true, "Cloud-neutral"),
        };
    }

    public IEnumerable<string> BuildPromptGuardrails()
    {
        if (IsExclusiveAws)
        {
            yield return "Use only AWS-oriented cloud guidance.";
            yield return "Do not mention Azure services, Azure Well-Architected, Azure-specific controls, or Azure-specific recommendations.";
        }
        else if (IsExclusiveAzure)
        {
            yield return "Use only Azure-oriented cloud guidance.";
            yield return "Do not mention AWS services, AWS Well-Architected, AWS-specific controls, or AWS-specific recommendations.";
        }
    }

    public bool AllowsFramework(ReviewFramework framework)
    {
        return framework switch
        {
            ReviewFramework.AzureWellArchitected => AllowsAzure,
            ReviewFramework.AwsWellArchitected => AllowsAws,
            _ => true,
        };
    }

    public bool AllowsFrameworkKey(string? frameworkKey)
    {
        if (string.IsNullOrWhiteSpace(frameworkKey))
        {
            return true;
        }

        return NormalizeFrameworkKey(frameworkKey) switch
        {
            "AzureWellArchitected" => AllowsAzure,
            "AwsWellArchitected" => AllowsAws,
            _ => true,
        };
    }

    public List<ReviewFramework> FilterFrameworks(IEnumerable<ReviewFramework> frameworks)
    {
        return frameworks
            .Where(AllowsFramework)
            .Distinct()
            .ToList();
    }

    public List<string> FilterFrameworkKeys(IEnumerable<string> frameworks)
    {
        return frameworks
            .Where(AllowsFrameworkKey)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public bool ContainsForbiddenCloudReference(string? text)
    {
        if (string.IsNullOrWhiteSpace(text) || IsCloudNeutral)
        {
            return false;
        }

        var normalized = text.ToLowerInvariant();
        var forbiddenMarkers = IsExclusiveAws ? AzureOnlyMarkers : AwsOnlyMarkers;
        return forbiddenMarkers.Any(marker => normalized.Contains(marker, StringComparison.Ordinal));
    }

    private static HashSet<string> ParseSelections(string? preference)
    {
        return (preference ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(item => item.Trim().ToLowerInvariant())
            .Where(item => item.Length > 0)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    private static string NormalizeFrameworkKey(string frameworkKey)
    {
        return frameworkKey.Trim() switch
        {
            "Azure" => "AzureWellArchitected",
            "AWS" => "AwsWellArchitected",
            _ => frameworkKey.Trim(),
        };
    }
}
