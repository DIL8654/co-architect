using System.Data.Common;
using CoArchitect.Application.Interfaces;
using CoArchitect.Domain.Entities;
using CoArchitect.Domain.Enums;
using CoArchitect.Domain.Models;
using CoArchitect.Infrastructure.Persistence;

namespace CoArchitect.Infrastructure.Repositories;

public sealed class TidbAgentAnalysisRunRepository : IAgentAnalysisRunRepository
{
    private const string LegacyKind = "analysis-run";
    private readonly IRelationalConnectionFactory _connectionFactory;
    private readonly RelationalSchemaInitializer _schemaInitializer;
    private readonly IObjectStore _legacyStore;

    public TidbAgentAnalysisRunRepository(
        IRelationalConnectionFactory connectionFactory,
        RelationalSchemaInitializer schemaInitializer,
        IObjectStore legacyStore)
    {
        _connectionFactory = connectionFactory;
        _schemaInitializer = schemaInitializer;
        _legacyStore = legacyStore;
    }

    public async Task<AgentAnalysisRun?> GetByIdAsync(Guid runId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            select id, workspace_id, architecture_diagram_id, status, requested_at, started_at, completed_at, report_path, suggestions, result_json
            from coarchitect_analysis_runs
            where id = @id
            """;
        AddParameter(command, "@id", runId.ToString());
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return Map(reader);
        }

        return await _legacyStore.GetAsync<AgentAnalysisRun>(LegacyKind, runId, cancellationToken);
    }

    public async Task<AgentAnalysisRun?> GetLatestByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        var runs = await GetByDiagramIdAsync(diagramId, cancellationToken);
        return runs.OrderByDescending(run => run.RequestedAt).FirstOrDefault();
    }

    public async Task<IDictionary<Guid, AgentAnalysisRun>> GetLatestByDiagramIdsAsync(IEnumerable<Guid> diagramIds, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var ids = diagramIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, AgentAnalysisRun>();
        }

        var items = new Dictionary<Guid, AgentAnalysisRun>();
        await using (var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken))
        await using (var command = connection.CreateCommand())
        {
            var parameterNames = ids.Select((id, index) => AddGuidParameter(command, $"@diagramId{index}", id)).ToList();
            command.CommandText = $"""
                select current.id, current.workspace_id, current.architecture_diagram_id, current.status, current.requested_at, current.started_at, current.completed_at, current.report_path, current.suggestions, current.result_json
                from coarchitect_analysis_runs current
                inner join (
                    select architecture_diagram_id, max(requested_at) as requested_at
                    from coarchitect_analysis_runs
                    where architecture_diagram_id in ({string.Join(", ", parameterNames)})
                    group by architecture_diagram_id
                ) latest
                    on latest.architecture_diagram_id = current.architecture_diagram_id
                   and latest.requested_at = current.requested_at
                order by current.requested_at desc
                """;
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                var run = Map(reader);
                items.TryAdd(run.ArchitectureDiagramId, run);
            }
        }

        var legacy = await _legacyStore.GetAllAsync<AgentAnalysisRun>(LegacyKind, cancellationToken);
        foreach (var group in legacy.Where(item => ids.Contains(item.ArchitectureDiagramId)).GroupBy(item => item.ArchitectureDiagramId))
        {
            var latest = group.OrderByDescending(item => item.RequestedAt).First();
            items[latest.ArchitectureDiagramId] = latest;
        }

        return items;
    }

    public async Task<IEnumerable<AgentAnalysisRun>> GetByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        var items = new List<AgentAnalysisRun>();
        await using (var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken))
        await using (var command = connection.CreateCommand())
        {
            command.CommandText = """
                select id, workspace_id, architecture_diagram_id, status, requested_at, started_at, completed_at, report_path, suggestions, result_json
                from coarchitect_analysis_runs
                where architecture_diagram_id = @diagramId
                order by requested_at desc
                """;
            AddParameter(command, "@diagramId", diagramId.ToString());
            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(Map(reader));
            }
        }

        var legacy = await _legacyStore.GetByDiagramAsync<AgentAnalysisRun>(LegacyKind, diagramId, cancellationToken);
        return items.Concat(legacy)
            .GroupBy(item => item.Id)
            .Select(group => group.First())
            .Where(item => item.ArchitectureDiagramId == diagramId)
            .OrderByDescending(item => item.RequestedAt);
    }

    public async Task<AgentAnalysisRun> AddAsync(AgentAnalysisRun run, CancellationToken cancellationToken)
    {
        await UpdateAsync(run, cancellationToken);
        return run;
    }

    public async Task UpdateAsync(AgentAnalysisRun run, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = """
            insert into coarchitect_analysis_runs (
              id, workspace_id, architecture_diagram_id, status, requested_at, started_at, completed_at, report_path, suggestions, result_json
            )
            values (
              @id, @workspaceId, @diagramId, @status, @requestedAt, @startedAt, @completedAt, @reportPath, @suggestions, @resultJson
            )
            on duplicate key update
              workspace_id = values(workspace_id),
              architecture_diagram_id = values(architecture_diagram_id),
              status = values(status),
              requested_at = values(requested_at),
              started_at = values(started_at),
              completed_at = values(completed_at),
              report_path = values(report_path),
              suggestions = values(suggestions),
              result_json = values(result_json)
            """;
        AddParameter(command, "@id", run.Id.ToString());
        AddParameter(command, "@workspaceId", run.WorkspaceId.ToString());
        AddParameter(command, "@diagramId", run.ArchitectureDiagramId.ToString());
        AddParameter(command, "@status", run.Status.ToString());
        AddParameter(command, "@requestedAt", run.RequestedAt);
        AddParameter(command, "@startedAt", run.StartedAt);
        AddParameter(command, "@completedAt", run.CompletedAt);
        AddParameter(command, "@reportPath", run.ReportPath);
        AddParameter(command, "@suggestions", RelationalJsonSerializer.Serialize(run.Suggestions));
        AddParameter(command, "@resultJson", run.Result is null ? DBNull.Value : RelationalJsonSerializer.Serialize(run.Result));
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task DeleteByDiagramIdAsync(Guid diagramId, CancellationToken cancellationToken)
    {
        await _schemaInitializer.EnsureSchemaAsync(cancellationToken);
        await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = "delete from coarchitect_analysis_runs where architecture_diagram_id = @diagramId";
        AddParameter(command, "@diagramId", diagramId.ToString());
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private AgentAnalysisRun Map(DbDataReader reader)
    {
        var statusText = reader.GetString(3);
        var suggestions = reader.IsDBNull(8)
            ? new List<AgentSuggestion>()
            : RelationalJsonSerializer.Deserialize<List<AgentSuggestion>>(reader.GetString(8));
        var result = reader.IsDBNull(9)
            ? null
            : RelationalJsonSerializer.Deserialize<AgentAnalysisResult>(reader.GetString(9));

        return new AgentAnalysisRun
        {
            Id = ParseGuid(reader.GetValue(0)),
            WorkspaceId = ParseGuid(reader.GetValue(1)),
            ArchitectureDiagramId = ParseGuid(reader.GetValue(2)),
            Status = Enum.TryParse<AnalysisRunStatus>(statusText, out var status) ? status : AnalysisRunStatus.Completed,
            RequestedAt = reader.GetDateTime(4),
            StartedAt = reader.IsDBNull(5) ? null : reader.GetDateTime(5),
            CompletedAt = reader.IsDBNull(6) ? null : reader.GetDateTime(6),
            ReportPath = reader.IsDBNull(7) ? null : reader.GetString(7),
            Suggestions = suggestions,
            Result = result,
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
