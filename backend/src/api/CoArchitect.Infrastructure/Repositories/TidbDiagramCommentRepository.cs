using System.Data.Common;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class TidbDiagramCommentRepository : IDiagramCommentRepository
{
    private const string LegacyKind = "diagram-comment";
    private readonly IRelationalConnectionFactory _connectionFactory;
    private readonly RelationalSchemaInitializer _schemaInitializer;
    private readonly IObjectStore _legacyStore;

    public TidbDiagramCommentRepository(
        IRelationalConnectionFactory connectionFactory,
        RelationalSchemaInitializer schemaInitializer,
        IObjectStore legacyStore)
    {
        _connectionFactory = connectionFactory;
        _schemaInitializer = schemaInitializer;
        _legacyStore = legacyStore;
    }

    public async Task<DiagramComment?> GetByIdAsync(Guid commentId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "select id, architecture_diagram_id, user_id, content, created_at, updated_at from coarchitect_diagram_comments where id = @id";
        AddParameter(command, "@id", commentId.ToString());
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return Map(reader);
        }

        return await _legacyStore.GetAsync<DiagramComment>(LegacyKind, commentId, cancellationToken);
    }

    public async Task<IEnumerable<DiagramComment>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var items = new List<DiagramComment>();
        await using (var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken))
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                select id, architecture_diagram_id, user_id, content, created_at, updated_at
                from coarchitect_diagram_comments
                where architecture_diagram_id = @diagramId
                order by created_at desc
                """;
            AddParameter(command, "@diagramId", diagramId.ToString());
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(Map(reader));
            }
        }

        var legacy = await _legacyStore.GetByDiagramAsync<DiagramComment>(LegacyKind, diagramId, cancellationToken);
        return items.Concat(legacy)
            .GroupBy(item => item.Id)
            .Select(group => group.First())
            .Where(item => item.ArchitectureDiagramId == diagramId)
            .OrderByDescending(item => item.CreatedAt);
    }

    public async Task<DiagramComment> AddAsync(DiagramComment comment, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            insert into coarchitect_diagram_comments (id, architecture_diagram_id, user_id, content, created_at, updated_at)
            values (@id, @diagramId, @userId, @content, @createdAt, @updatedAt)
            on duplicate key update
              architecture_diagram_id = values(architecture_diagram_id),
              user_id = values(user_id),
              content = values(content),
              updated_at = values(updated_at)
            """;
        AddParameter(command, "@id", comment.Id.ToString());
        AddParameter(command, "@diagramId", comment.ArchitectureDiagramId.ToString());
        AddParameter(command, "@userId", comment.UserId.ToString());
        AddParameter(command, "@content", comment.Content);
        AddParameter(command, "@createdAt", comment.CreatedAt);
        AddParameter(command, "@updatedAt", comment.UpdatedAt);
        await command.ExecuteNonQueryAsync(cancellationToken);
        return comment;
    }

    public async Task DeleteAsync(Guid commentId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "delete from coarchitect_diagram_comments where id = @id";
        AddParameter(command, "@id", commentId.ToString());
        await command.ExecuteNonQueryAsync(cancellationToken);
        await _legacyStore.DeleteAsync(LegacyKind, commentId, cancellationToken);
    }

    public async Task DeleteByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "delete from coarchitect_diagram_comments where architecture_diagram_id = @diagramId";
        AddParameter(command, "@diagramId", diagramId.ToString());
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private DiagramComment Map(DbDataReader reader)
    {
        return new DiagramComment
        {
            Id = ParseGuid(reader.GetValue(0)),
            ArchitectureDiagramId = ParseGuid(reader.GetValue(1)),
            UserId = ParseGuid(reader.GetValue(2)),
            Content = reader.GetString(3),
            CreatedAt = reader.GetDateTime(4),
            UpdatedAt = reader.GetDateTime(5),
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
