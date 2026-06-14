using System.Data.Common;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class TidbAdrRepository : IAdrRepository
{
    private readonly IRelationalConnectionFactory _connectionFactory;
    private readonly RelationalSchemaInitializer _schemaInitializer;

    public TidbAdrRepository(
        IRelationalConnectionFactory connectionFactory,
        RelationalSchemaInitializer schemaInitializer)
    {
        _connectionFactory = connectionFactory;
        _schemaInitializer = schemaInitializer;
    }

    public async Task<Adr?> GetByIdAsync(Guid adrId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select id, workspace_id, architecture_diagram_id, title, status, latest_version_number, created_by_user_id, created_at, updated_at
            from coarchitect_adrs
            where id = @id
            """;
        AddParameter(command, "@id", adrId.ToString());
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        return await reader.ReadAsync(cancellationToken) ? MapAdr(reader) : null;
    }

    public async Task<IEnumerable<Adr>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var items = new List<Adr>();
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select id, workspace_id, architecture_diagram_id, title, status, latest_version_number, created_by_user_id, created_at, updated_at
            from coarchitect_adrs
            where architecture_diagram_id = @diagramId
            order by updated_at desc
            """;
        AddParameter(command, "@diagramId", diagramId.ToString());
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(MapAdr(reader));
        }

        return items;
    }

    public async Task<IDictionary<Guid, int>> GetCountsByDiagramIdsAsync(IEnumerable<Guid> diagramIds, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var ids = diagramIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }

        var counts = new Dictionary<Guid, int>();
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        var parameterNames = ids.Select((id, index) => AddGuidParameter(command, $"@diagramId{index}", id)).ToList();
        command.CommandText = $"""
            select architecture_diagram_id, count(*)
            from coarchitect_adrs
            where architecture_diagram_id in ({string.Join(", ", parameterNames)})
            group by architecture_diagram_id
            """;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            counts[ParseGuid(reader.GetValue(0))] = reader.GetInt32(1);
        }

        return counts;
    }

    public async Task<AdrVersion?> GetLatestVersionAsync(Guid adrId, CancellationToken cancellationToken)
    {
        var versions = await GetVersionsAsync(adrId, cancellationToken);
        return versions.OrderByDescending(item => item.VersionNumber).FirstOrDefault();
    }

    public async Task<IEnumerable<AdrVersion>> GetVersionsAsync(Guid adrId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var items = new List<AdrVersion>();
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select id, adr_id, version_number, title, status, frameworks, draft_json, markdown, html, summary, created_by_user_id, created_at
            from coarchitect_adr_versions
            where adr_id = @adrId
            order by version_number desc
            """;
        AddParameter(command, "@adrId", adrId.ToString());
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(MapVersion(reader));
        }

        return items;
    }

    public async Task<Adr> AddAsync(Adr adr, CancellationToken cancellationToken)
    {
        await UpdateAsync(adr, cancellationToken);
        return adr;
    }

    public async Task UpdateAsync(Adr adr, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            insert into coarchitect_adrs (
              id, workspace_id, architecture_diagram_id, title, status, latest_version_number, created_by_user_id, created_at, updated_at
            )
            values (
              @id, @workspaceId, @diagramId, @title, @status, @latestVersionNumber, @createdByUserId, @createdAt, @updatedAt
            )
            on duplicate key update
              workspace_id = values(workspace_id),
              architecture_diagram_id = values(architecture_diagram_id),
              title = values(title),
              status = values(status),
              latest_version_number = values(latest_version_number),
              updated_at = values(updated_at)
            """;
        AddParameter(command, "@id", adr.Id.ToString());
        AddParameter(command, "@workspaceId", adr.WorkspaceId.ToString());
        AddParameter(command, "@diagramId", adr.ArchitectureDiagramId.ToString());
        AddParameter(command, "@title", adr.Title);
        AddParameter(command, "@status", adr.Status);
        AddParameter(command, "@latestVersionNumber", adr.LatestVersionNumber);
        AddParameter(command, "@createdByUserId", adr.CreatedByUserId.ToString());
        AddParameter(command, "@createdAt", adr.CreatedAt);
        AddParameter(command, "@updatedAt", adr.UpdatedAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<AdrVersion> AddVersionAsync(AdrVersion version, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            insert into coarchitect_adr_versions (
              id, adr_id, version_number, title, status, frameworks, draft_json, markdown, html, summary, created_by_user_id, created_at
            )
            values (
              @id, @adrId, @versionNumber, @title, @status, @frameworks, @draftJson, @markdown, @html, @summary, @createdByUserId, @createdAt
            )
            on duplicate key update
              title = values(title),
              status = values(status),
              frameworks = values(frameworks),
              draft_json = values(draft_json),
              markdown = values(markdown),
              html = values(html),
              summary = values(summary)
            """;
        AddParameter(command, "@id", version.Id.ToString());
        AddParameter(command, "@adrId", version.AdrId.ToString());
        AddParameter(command, "@versionNumber", version.VersionNumber);
        AddParameter(command, "@title", version.Title);
        AddParameter(command, "@status", version.Status);
        AddParameter(command, "@frameworks", RelationalJsonSerializer.Serialize(version.Frameworks));
        AddParameter(command, "@draftJson", RelationalJsonSerializer.Serialize(version.Draft));
        AddParameter(command, "@markdown", version.Markdown);
        AddParameter(command, "@html", version.Html);
        AddParameter(command, "@summary", version.Summary);
        AddParameter(command, "@createdByUserId", version.CreatedByUserId.ToString());
        AddParameter(command, "@createdAt", version.CreatedAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
        return version;
    }

    public async Task DeleteAsync(Guid adrId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var deleteVersions = connection.CreateCommand();
        deleteVersions.CommandText = "delete from coarchitect_adr_versions where adr_id = @adrId";
        AddParameter(deleteVersions, "@adrId", adrId.ToString());
        await deleteVersions.ExecuteNonQueryAsync(cancellationToken);

        await using var deleteAdr = connection.CreateCommand();
        deleteAdr.CommandText = "delete from coarchitect_adrs where id = @id";
        AddParameter(deleteAdr, "@id", adrId.ToString());
        await deleteAdr.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeleteByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        var adrs = await GetByDiagramIdAsync(diagramId, cancellationToken);
        foreach (var adr in adrs)
        {
            await DeleteAsync(adr.Id, cancellationToken);
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static Adr MapAdr(DbDataReader reader)
    {
        return new Adr
        {
            Id = ParseGuid(reader.GetValue(0)),
            WorkspaceId = ParseGuid(reader.GetValue(1)),
            ArchitectureDiagramId = ParseGuid(reader.GetValue(2)),
            Title = reader.GetString(3),
            Status = reader.GetString(4),
            LatestVersionNumber = reader.GetInt32(5),
            CreatedByUserId = ParseGuid(reader.GetValue(6)),
            CreatedAt = reader.GetDateTime(7),
            UpdatedAt = reader.GetDateTime(8),
        };
    }

    private static AdrVersion MapVersion(DbDataReader reader)
    {
        return new AdrVersion
        {
            Id = ParseGuid(reader.GetValue(0)),
            AdrId = ParseGuid(reader.GetValue(1)),
            VersionNumber = reader.GetInt32(2),
            Title = reader.GetString(3),
            Status = reader.GetString(4),
            Frameworks = RelationalJsonSerializer.Deserialize<List<string>>(reader.GetString(5)),
            Draft = RelationalJsonSerializer.Deserialize<AdrDocument>(reader.GetString(6)),
            Markdown = reader.GetString(7),
            Html = reader.GetString(8),
            Summary = reader.GetString(9),
            CreatedByUserId = ParseGuid(reader.GetValue(10)),
            CreatedAt = reader.GetDateTime(11),
        };
    }

    private static void AddParameter(DbCommand command, string name, object? value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }

    private static string AddGuidParameter(DbCommand command, string name, Guid value)
    {
        AddParameter(command, name, value.ToString());
        return name;
    }

    private static Guid ParseGuid(object value) => value switch
    {
        Guid guid => guid,
        string text => Guid.Parse(text),
        _ => Guid.Parse(value.ToString() ?? throw new InvalidOperationException("Missing GUID value.")),
    };
}
