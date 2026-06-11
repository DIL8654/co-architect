using System.Data.Common;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class TidbWorkspaceRepository : IWorkspaceRepository
{
    private const string LegacyKind = "workspace";
    private readonly IRelationalConnectionFactory _connectionFactory;
    private readonly RelationalSchemaInitializer _schemaInitializer;
    private readonly IObjectStore _legacyStore;

    public TidbWorkspaceRepository(
        IRelationalConnectionFactory connectionFactory,
        RelationalSchemaInitializer schemaInitializer,
        IObjectStore legacyStore)
    {
        _connectionFactory = connectionFactory;
        _schemaInitializer = schemaInitializer;
        _legacyStore = legacyStore;
    }

    public async Task<Workspace?> GetByIdAsync(Guid workspaceId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "select id, coalesce(tenant_id, organization_id), name, created_at, updated_at from coarchitect_workspaces where id = @id";
        AddParameter(command, "@id", workspaceId.ToString());

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return Map(reader);
        }

        return await _legacyStore.GetAsync<Workspace>(LegacyKind, workspaceId, cancellationToken);
    }

    public async Task<IEnumerable<Workspace>> GetByOrganizationIdAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        return await GetByTenantIdAsync(organizationId, cancellationToken);
    }

    public async Task<IEnumerable<Workspace>> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var items = new List<Workspace>();

        await using (var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken))
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = "select id, coalesce(tenant_id, organization_id), name, created_at, updated_at from coarchitect_workspaces where coalesce(tenant_id, organization_id) = @tenantId order by updated_at desc";
            AddParameter(command, "@tenantId", tenantId.ToString());
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(Map(reader));
            }
        }

        var legacy = await _legacyStore.GetByOrganizationAsync<Workspace>(LegacyKind, tenantId, cancellationToken);
        return Merge(items, legacy)
            .Where(item => item.TenantId == tenantId)
            .OrderByDescending(item => item.UpdatedAt);
    }

    public async Task<IEnumerable<Workspace>> GetAllAsync(CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var items = new List<Workspace>();

        await using (var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken))
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = "select id, coalesce(tenant_id, organization_id), name, created_at, updated_at from coarchitect_workspaces order by updated_at desc";
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(Map(reader));
            }
        }

        var legacy = await _legacyStore.GetAllAsync<Workspace>(LegacyKind, cancellationToken);
        return Merge(items, legacy).OrderByDescending(item => item.UpdatedAt);
    }

    public async Task<Workspace> AddAsync(Workspace workspace, CancellationToken cancellationToken)
    {
        await UpdateAsync(workspace, cancellationToken);
        return workspace;
    }

    public async Task UpdateAsync(Workspace workspace, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            insert into coarchitect_workspaces (id, organization_id, tenant_id, name, created_at, updated_at)
            values (@id, @organizationId, @tenantId, @name, @createdAt, @updatedAt)
            on duplicate key update
              organization_id = values(organization_id),
              tenant_id = values(tenant_id),
              name = values(name),
              updated_at = values(updated_at)
            """;
        AddParameter(command, "@id", workspace.Id.ToString());
        AddParameter(command, "@organizationId", workspace.TenantId.ToString());
        AddParameter(command, "@tenantId", workspace.TenantId.ToString());
        AddParameter(command, "@name", workspace.Name);
        AddParameter(command, "@createdAt", workspace.CreatedAt);
        AddParameter(command, "@updatedAt", workspace.UpdatedAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid workspaceId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "delete from coarchitect_workspaces where id = @id";
        AddParameter(command, "@id", workspaceId.ToString());
        await command.ExecuteNonQueryAsync(cancellationToken);
        await _legacyStore.DeleteAsync(LegacyKind, workspaceId, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private Workspace Map(DbDataReader reader)
    {
        return new Workspace
        {
            Id = ParseGuid(reader.GetValue(0)),
            TenantId = ParseGuid(reader.GetValue(1)),
            Name = reader.GetString(2),
            CreatedAt = reader.GetDateTime(3),
            UpdatedAt = reader.GetDateTime(4),
        };
    }

    private static IEnumerable<Workspace> Merge(IEnumerable<Workspace> current, IEnumerable<Workspace> legacy)
    {
        return current.Concat(legacy).GroupBy(item => item.Id).Select(group => group.First());
    }

    private static void AddParameter(DbCommand command, string name, object? value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }

    private static Guid ParseGuid(object value) => value switch
    {
        Guid guid => guid,
        string text => Guid.Parse(text),
        _ => Guid.Parse(value.ToString() ?? throw new InvalidOperationException("Missing GUID value.")),
    };
}
