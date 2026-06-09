namespace CoArchitect.Infrastructure.Settings;

public sealed class DataStoreOptions
{
    public string Provider { get; init; } = "Mock";

    public bool UsePostgres => string.Equals(Provider, "Postgres", StringComparison.OrdinalIgnoreCase);

    public bool UseTiDb => string.Equals(Provider, "TiDB", StringComparison.OrdinalIgnoreCase) ||
                           string.Equals(Provider, "MySql", StringComparison.OrdinalIgnoreCase);
}
