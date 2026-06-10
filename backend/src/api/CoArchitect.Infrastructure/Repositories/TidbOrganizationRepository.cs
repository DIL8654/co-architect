using System.Data.Common;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class TidbOrganizationRepository : IOrganizationRepository
{
    private const string LegacyKind = "organization";
    private readonly IRelationalConnectionFactory _connectionFactory;
    private readonly RelationalSchemaInitializer _schemaInitializer;
    private readonly IObjectStore _legacyStore;

    public TidbOrganizationRepository(
        IRelationalConnectionFactory connectionFactory,
        RelationalSchemaInitializer schemaInitializer,
        IObjectStore legacyStore)
    {
        _connectionFactory = connectionFactory;
        _schemaInitializer = schemaInitializer;
        _legacyStore = legacyStore;
    }

    public async Task<Organization?> GetByIdAsync(Guid organizationId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "select id, name, slug, created_at, updated_at from coarchitect_organizations where id = @id";
        AddParameter(command, "@id", organizationId.ToString());

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return Map(reader);
        }

        return await _legacyStore.GetAsync<Organization>(LegacyKind, organizationId, cancellationToken);
    }

    public async Task<Organization?> GetBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "select id, name, slug, created_at, updated_at from coarchitect_organizations where lower(slug) = lower(@slug) limit 1";
        AddParameter(command, "@slug", slug);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return Map(reader);
        }

        var legacy = await _legacyStore.GetAllAsync<Organization>(LegacyKind, cancellationToken);
        return legacy.FirstOrDefault(item => string.Equals(item.Name, slug, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<IEnumerable<Organization>> GetAllAsync(CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);

        var items = new List<Organization>();
        await using (var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken))
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = "select id, name, slug, created_at, updated_at from coarchitect_organizations order by updated_at desc";
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(Map(reader));
            }
        }

        var legacy = await _legacyStore.GetAllAsync<Organization>(LegacyKind, cancellationToken);
        return items
            .Concat(legacy)
            .GroupBy(item => item.Id)
            .Select(group => group.First())
            .OrderByDescending(item => item.UpdatedAt);
    }

    public async Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken)
    {
        return await GetBySlugAsync(slug, cancellationToken) is not null;
    }

    public async Task<Organization> AddAsync(Organization organization, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);

        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            insert into coarchitect_organizations (id, name, slug, created_at, updated_at)
            values (@id, @name, @slug, @createdAt, @updatedAt)
            on duplicate key update
              name = values(name),
              slug = values(slug),
              updated_at = values(updated_at)
            """;
        AddParameter(command, "@id", organization.Id.ToString());
        AddParameter(command, "@name", organization.Name);
        AddParameter(command, "@slug", organization.Name);
        AddParameter(command, "@createdAt", organization.CreatedAt);
        AddParameter(command, "@updatedAt", organization.UpdatedAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
        return organization;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private Organization Map(DbDataReader reader)
    {
        return new Organization
        {
            Id = ParseGuid(reader.GetValue(0)),
            Name = reader.GetString(1),
            CreatedAt = reader.GetDateTime(3),
            UpdatedAt = reader.GetDateTime(4),
        };
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
