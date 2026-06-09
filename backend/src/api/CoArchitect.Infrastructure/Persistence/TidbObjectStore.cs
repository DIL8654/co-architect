using System.Text.Json;
using MySqlConnector;

namespace CoArchitect.Infrastructure.Persistence;

public sealed class TidbObjectStore : IObjectStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false,
    };

    private readonly string _connectionString;
    private readonly SemaphoreSlim _schemaLock = new(1, 1);
    private bool _schemaReady;

    public TidbObjectStore(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<T?> GetAsync<T>(string kind, Guid id, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(
            "select payload from coarchitect_objects where kind = @kind and id = @id",
            connection);
        command.Parameters.AddWithValue("@kind", kind);
        command.Parameters.AddWithValue("@id", id.ToString());

        var value = await command.ExecuteScalarAsync(cancellationToken);
        return value is null || value is DBNull ? default : Deserialize<T>(value.ToString()!);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync<T>(string kind, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(
            "select payload from coarchitect_objects where kind = @kind order by updated_at desc",
            connection);
        command.Parameters.AddWithValue("@kind", kind);

        return await ReadListAsync<T>(command, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetByOrganizationAsync<T>(string kind, Guid organizationId, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(
            "select payload from coarchitect_objects where kind = @kind and organization_id = @organizationId order by updated_at desc",
            connection);
        command.Parameters.AddWithValue("@kind", kind);
        command.Parameters.AddWithValue("@organizationId", organizationId.ToString());

        return await ReadListAsync<T>(command, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetByWorkspaceAsync<T>(string kind, Guid workspaceId, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(
            "select payload from coarchitect_objects where kind = @kind and workspace_id = @workspaceId order by updated_at desc",
            connection);
        command.Parameters.AddWithValue("@kind", kind);
        command.Parameters.AddWithValue("@workspaceId", workspaceId.ToString());

        return await ReadListAsync<T>(command, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetByDiagramAsync<T>(string kind, Guid diagramId, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(
            "select payload from coarchitect_objects where kind = @kind and diagram_id = @diagramId order by updated_at desc",
            connection);
        command.Parameters.AddWithValue("@kind", kind);
        command.Parameters.AddWithValue("@diagramId", diagramId.ToString());

        return await ReadListAsync<T>(command, cancellationToken);
    }

    public async Task UpsertAsync<T>(
        string kind,
        Guid id,
        T value,
        Guid? organizationId,
        Guid? workspaceId,
        Guid? diagramId,
        CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(
            """
            insert into coarchitect_objects (kind, id, organization_id, workspace_id, diagram_id, payload, updated_at)
            values (@kind, @id, @organizationId, @workspaceId, @diagramId, @payload, utc_timestamp(6))
            on duplicate key update
              organization_id = values(organization_id),
              workspace_id = values(workspace_id),
              diagram_id = values(diagram_id),
              payload = values(payload),
              updated_at = utc_timestamp(6)
            """,
            connection);
        command.Parameters.AddWithValue("@kind", kind);
        command.Parameters.AddWithValue("@id", id.ToString());
        command.Parameters.AddWithValue("@organizationId", organizationId?.ToString() ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@workspaceId", workspaceId?.ToString() ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@diagramId", diagramId?.ToString() ?? (object)DBNull.Value);
        command.Parameters.AddWithValue("@payload", JsonSerializer.Serialize(value, JsonOptions));

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeleteAsync(string kind, Guid id, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new MySqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new MySqlCommand(
            "delete from coarchitect_objects where kind = @kind and id = @id",
            connection);
        command.Parameters.AddWithValue("@kind", kind);
        command.Parameters.AddWithValue("@id", id.ToString());

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task EnsureSchemaAsync(CancellationToken cancellationToken)
    {
        if (_schemaReady)
        {
            return;
        }

        await _schemaLock.WaitAsync(cancellationToken);
        try
        {
            if (_schemaReady)
            {
                return;
            }

            await using var connection = new MySqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new MySqlCommand(
                """
                create table if not exists coarchitect_objects (
                    kind varchar(64) not null,
                    id char(36) not null,
                    organization_id char(36) null,
                    workspace_id char(36) null,
                    diagram_id char(36) null,
                    payload json not null,
                    updated_at datetime(6) not null,
                    primary key (kind, id),
                    key ix_coarchitect_objects_organization (kind, organization_id),
                    key ix_coarchitect_objects_workspace (kind, workspace_id),
                    key ix_coarchitect_objects_diagram (kind, diagram_id)
                );
                """,
                connection);
            await command.ExecuteNonQueryAsync(cancellationToken);
            _schemaReady = true;
        }
        finally
        {
            _schemaLock.Release();
        }
    }

    private static async Task<IReadOnlyList<T>> ReadListAsync<T>(MySqlCommand command, CancellationToken cancellationToken)
    {
        var items = new List<T>();

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(Deserialize<T>(reader.GetString(0)));
        }

        return items;
    }

    private static T Deserialize<T>(string json)
    {
        return JsonSerializer.Deserialize<T>(json, JsonOptions)
            ?? throw new InvalidOperationException($"Could not deserialize {typeof(T).Name}.");
    }
}
