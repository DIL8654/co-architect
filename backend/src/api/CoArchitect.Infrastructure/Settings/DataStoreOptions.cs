namespace CoArchitect.Infrastructure.Settings;

public sealed class DataStoreOptions
{
    public string Provider { get; init; } = "TiDB";

    public bool UseTiDb => string.Equals(Provider, "TiDB", StringComparison.OrdinalIgnoreCase) ||
                           string.Equals(Provider, "MySql", StringComparison.OrdinalIgnoreCase);

    public bool UseMock => string.Equals(Provider, "Mock", StringComparison.OrdinalIgnoreCase);
}
