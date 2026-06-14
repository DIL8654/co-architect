using System.Data.Common;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class TidbDiagramRepository : IDiagramRepository
{
    private const string LegacyKind = "diagram";
    private readonly IRelationalConnectionFactory _connectionFactory;
    private readonly RelationalSchemaInitializer _schemaInitializer;
    private readonly IObjectStore _legacyStore;

    public TidbDiagramRepository(
        IRelationalConnectionFactory connectionFactory,
        RelationalSchemaInitializer schemaInitializer,
        IObjectStore legacyStore)
    {
        _connectionFactory = connectionFactory;
        _schemaInitializer = schemaInitializer;
        _legacyStore = legacyStore;
    }

    public async Task<ArchitectureDiagram?> GetByIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select id, workspace_id, uploaded_by_user_id, name, original_file_name, file_url, description, review_context, framework_selection, quality_attribute_weights, uploaded_at
            from coarchitect_diagrams
            where id = @id
            """;
        AddParameter(command, "@id", diagramId.ToString());

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return Map(reader);
        }

        return await _legacyStore.GetAsync<ArchitectureDiagram>(LegacyKind, diagramId, cancellationToken);
    }

    public async Task<IEnumerable<ArchitectureDiagram>> GetByWorkspaceIdAsync(Guid workspaceId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var items = new List<ArchitectureDiagram>();
        await using (var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken))
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                select id, workspace_id, uploaded_by_user_id, name, original_file_name, file_url, description, review_context, framework_selection, quality_attribute_weights, uploaded_at
                from coarchitect_diagrams
                where workspace_id = @workspaceId
                order by uploaded_at desc
                """;
            AddParameter(command, "@workspaceId", workspaceId.ToString());
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(Map(reader));
            }
        }

        var legacy = await _legacyStore.GetByWorkspaceAsync<ArchitectureDiagram>(LegacyKind, workspaceId, cancellationToken);
        return Merge(items, legacy)
            .Where(item => item.WorkspaceId == workspaceId)
            .OrderByDescending(item => item.UploadedAt);
    }

    public async Task<IEnumerable<ArchitectureDiagram>> GetByWorkspaceIdsAsync(IEnumerable<Guid> workspaceIds, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var ids = workspaceIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return [];
        }

        var items = new List<ArchitectureDiagram>();
        await using (var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken))
        await using (var command = connection.CreateCommand())
        {
            var parameterNames = ids.Select((id, index) => AddGuidParameter(command, $"@workspaceId{index}", id)).ToList();
            command.CommandText = $"""
                select id, workspace_id, uploaded_by_user_id, name, original_file_name, file_url, description, review_context, framework_selection, quality_attribute_weights, uploaded_at
                from coarchitect_diagrams
                where workspace_id in ({string.Join(", ", parameterNames)})
                order by uploaded_at desc
                """;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(Map(reader));
            }
        }

        var legacy = await _legacyStore.GetAllAsync<ArchitectureDiagram>(LegacyKind, cancellationToken);
        var workspaceIdSet = ids.ToHashSet();
        return Merge(items, legacy)
            .Where(item => workspaceIdSet.Contains(item.WorkspaceId))
            .OrderByDescending(item => item.UploadedAt);
    }

    public async Task<IDictionary<Guid, int>> GetDiagramCountsByWorkspaceIdsAsync(IEnumerable<Guid> workspaceIds, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var ids = workspaceIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }

        var counts = new Dictionary<Guid, int>();
        await using (var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken))
        await using (var command = connection.CreateCommand())
        {
            var parameterNames = ids.Select((id, index) => AddGuidParameter(command, $"@workspaceId{index}", id)).ToList();
            command.CommandText = $"""
                select workspace_id, count(*)
                from coarchitect_diagrams
                where workspace_id in ({string.Join(", ", parameterNames)})
                group by workspace_id
                """;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                counts[ParseGuid(reader.GetValue(0))] = reader.GetInt32(1);
            }
        }

        var legacy = await _legacyStore.GetAllAsync<ArchitectureDiagram>(LegacyKind, cancellationToken);
        foreach (var group in legacy.Where(item => ids.Contains(item.WorkspaceId)).GroupBy(item => item.WorkspaceId))
        {
            counts[group.Key] = Math.Max(counts.GetValueOrDefault(group.Key), group.Count());
        }

        return counts;
    }

    public async Task<IEnumerable<ArchitectureDiagram>> GetAllAsync(CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var items = new List<ArchitectureDiagram>();
        await using (var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken))
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                select id, workspace_id, uploaded_by_user_id, name, original_file_name, file_url, description, review_context, framework_selection, quality_attribute_weights, uploaded_at
                from coarchitect_diagrams
                order by uploaded_at desc
                """;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(Map(reader));
            }
        }

        var legacy = await _legacyStore.GetAllAsync<ArchitectureDiagram>(LegacyKind, cancellationToken);
        return Merge(items, legacy).OrderByDescending(item => item.UploadedAt);
    }

    public async Task<ArchitectureDiagram> AddAsync(ArchitectureDiagram diagram, CancellationToken cancellationToken)
    {
        await UpdateAsync(diagram, cancellationToken);
        return diagram;
    }

    public async Task UpdateAsync(ArchitectureDiagram diagram, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            insert into coarchitect_diagrams (
              id, workspace_id, uploaded_by_user_id, name, original_file_name, file_url, description, review_context, framework_selection, quality_attribute_weights, uploaded_at
            )
            values (
              @id, @workspaceId, @uploadedByUserId, @name, @originalFileName, @fileUrl, @description, @reviewContext, @frameworkSelection, @qualityAttributeWeights, @uploadedAt
            )
            on duplicate key update
              workspace_id = values(workspace_id),
              uploaded_by_user_id = values(uploaded_by_user_id),
              name = values(name),
              original_file_name = values(original_file_name),
              file_url = values(file_url),
              description = values(description),
              review_context = values(review_context),
              framework_selection = values(framework_selection),
              quality_attribute_weights = values(quality_attribute_weights),
              uploaded_at = values(uploaded_at)
            """;
        AddParameter(command, "@id", diagram.Id.ToString());
        AddParameter(command, "@workspaceId", diagram.WorkspaceId.ToString());
        AddParameter(command, "@uploadedByUserId", diagram.UploadedByUserId.ToString());
        AddParameter(command, "@name", diagram.Name);
        AddParameter(command, "@originalFileName", diagram.OriginalFileName);
        AddParameter(command, "@fileUrl", diagram.FileUrl);
        AddParameter(command, "@description", diagram.Description);
        AddParameter(command, "@reviewContext", RelationalJsonSerializer.Serialize(diagram.ReviewContext));
        AddParameter(command, "@frameworkSelection", RelationalJsonSerializer.Serialize(diagram.FrameworkSelection));
        AddParameter(command, "@qualityAttributeWeights", RelationalJsonSerializer.Serialize(diagram.QualityAttributeWeights));
        AddParameter(command, "@uploadedAt", diagram.UploadedAt);
        await command.ExecuteNonQueryAsync(cancellationToken);

        await _legacyStore.UpsertAsync(
            LegacyKind,
            diagram.Id,
            diagram,
            null,
            diagram.WorkspaceId,
            diagram.Id,
            cancellationToken);
    }

    public async Task DeleteAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "delete from coarchitect_diagrams where id = @id";
        AddParameter(command, "@id", diagramId.ToString());
        await command.ExecuteNonQueryAsync(cancellationToken);
        await _legacyStore.DeleteAsync(LegacyKind, diagramId, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private ArchitectureDiagram Map(DbDataReader reader)
    {
        return new ArchitectureDiagram
        {
            Id = ParseGuid(reader.GetValue(0)),
            WorkspaceId = ParseGuid(reader.GetValue(1)),
            UploadedByUserId = ParseGuid(reader.GetValue(2)),
            Name = reader.GetString(3),
            OriginalFileName = reader.GetString(4),
            FileUrl = reader.IsDBNull(5) ? null : reader.GetString(5),
            Description = reader.IsDBNull(6) ? null : reader.GetString(6),
            ReviewContext = RelationalJsonSerializer.Deserialize<ArchitectureReviewContext>(reader.GetString(7)),
            FrameworkSelection = RelationalJsonSerializer.Deserialize<FrameworkSelectionResult>(reader.GetString(8)),
            QualityAttributeWeights = RelationalJsonSerializer.Deserialize<List<QualityAttributeWeight>>(reader.GetString(9)),
            UploadedAt = reader.GetDateTime(10),
        };
    }

    private static IEnumerable<ArchitectureDiagram> Merge(IEnumerable<ArchitectureDiagram> current, IEnumerable<ArchitectureDiagram> legacy)
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
