namespace CoArchitect.Infrastructure.Settings;

public sealed class ArchitectureStorageOptions
{
    public string Provider { get; init; } = "None";
    public string? ContainerSasUrl { get; init; }

    public bool UseAzureBlobSas =>
        string.Equals(Provider, "AzureBlobSas", StringComparison.OrdinalIgnoreCase) &&
        !string.IsNullOrWhiteSpace(ContainerSasUrl);
}
