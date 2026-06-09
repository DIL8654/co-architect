using System.Text.Json;
using Npgsql;
using NpgsqlTypes;

namespace CoArchitect.Infrastructure.Persistence;

public sealed class PostgresObjectStore : IObjectStore
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false,
    };

    private readonly string _connectionString;
    private readonly SemaphoreSlim _schemaLock = new(1, 1);
    private bool _schemaReady;

    public PostgresObjectStore(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<T?> GetAsync<T>(string kind, Guid id, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "select payload from coarchitect_objects where kind = @kind and id = @id",
            connection);
        command.Parameters.AddWithValue("kind", kind);
        command.Parameters.AddWithValue("id", id);

        var value = await command.ExecuteScalarAsync(cancellationToken);
        return value is null || value is DBNull ? default : Deserialize<T>((string)value);
    }

    public async Task<IReadOnlyList<T>> GetAllAsync<T>(string kind, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "select payload from coarchitect_objects where kind = @kind order by updated_at desc",
            connection);
        command.Parameters.AddWithValue("kind", kind);

        return await ReadListAsync<T>(command, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetByOrganizationAsync<T>(string kind, Guid organizationId, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "select payload from coarchitect_objects where kind = @kind and organization_id = @organizationId order by updated_at desc",
            connection);
        command.Parameters.AddWithValue("kind", kind);
        command.Parameters.AddWithValue("organizationId", organizationId);

        return await ReadListAsync<T>(command, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetByWorkspaceAsync<T>(string kind, Guid workspaceId, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "select payload from coarchitect_objects where kind = @kind and workspace_id = @workspaceId order by updated_at desc",
            connection);
        command.Parameters.AddWithValue("kind", kind);
        command.Parameters.AddWithValue("workspaceId", workspaceId);

        return await ReadListAsync<T>(command, cancellationToken);
    }

    public async Task<IReadOnlyList<T>> GetByDiagramAsync<T>(string kind, Guid diagramId, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "select payload from coarchitect_objects where kind = @kind and diagram_id = @diagramId order by updated_at desc",
            connection);
        command.Parameters.AddWithValue("kind", kind);
        command.Parameters.AddWithValue("diagramId", diagramId);

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

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            """
            insert into coarchitect_objects (kind, id, organization_id, workspace_id, diagram_id, payload, updated_at)
            values (@kind, @id, @organizationId, @workspaceId, @diagramId, @payload, now())
            on conflict (kind, id) do update set
              organization_id = excluded.organization_id,
              workspace_id = excluded.workspace_id,
              diagram_id = excluded.diagram_id,
              payload = excluded.payload,
              updated_at = now()
            """,
            connection);
        command.Parameters.AddWithValue("kind", kind);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("organizationId", (object?)organizationId ?? DBNull.Value);
        command.Parameters.AddWithValue("workspaceId", (object?)workspaceId ?? DBNull.Value);
        command.Parameters.AddWithValue("diagramId", (object?)diagramId ?? DBNull.Value);
        command.Parameters.Add("payload", NpgsqlDbType.Jsonb).Value = JsonSerializer.Serialize(value, JsonOptions);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeleteAsync(string kind, Guid id, CancellationToken cancellationToken)
    {
        await EnsureSchemaAsync(cancellationToken);

        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = new NpgsqlCommand(
            "delete from coarchitect_objects where kind = @kind and id = @id",
            connection);
        command.Parameters.AddWithValue("kind", kind);
        command.Parameters.AddWithValue("id", id);

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

            await using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand(
                """
                create table if not exists coarchitect_objects (
                    kind text not null,
                    id uuid not null,
                    organization_id uuid null,
                    workspace_id uuid null,
                    diagram_id uuid null,
                    payload jsonb not null,
                    updated_at timestamptz not null default now(),
                    primary key (kind, id)
                );

                create index if not exists ix_coarchitect_objects_organization
                    on coarchitect_objects (kind, organization_id);

                create index if not exists ix_coarchitect_objects_workspace
                    on coarchitect_objects (kind, workspace_id);

                create index if not exists ix_coarchitect_objects_diagram
                    on coarchitect_objects (kind, diagram_id);
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

    private static async Task<IReadOnlyList<T>> ReadListAsync<T>(NpgsqlCommand command, CancellationToken cancellationToken)
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
