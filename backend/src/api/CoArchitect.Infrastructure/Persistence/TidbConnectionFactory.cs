using System.Data.Common;
using MySqlConnector;

namespace CoArchitect.Infrastructure.Persistence;

public sealed class TidbConnectionFactory : IRelationalConnectionFactory
{
    private readonly string _connectionString;

    public TidbConnectionFactory(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }
}
