using System.Data.Common;

namespace CoArchitect.Infrastructure.Persistence;

public sealed class RelationalSchemaInitializer
{
    private readonly IRelationalConnectionFactory _connectionFactory;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private bool _ready;

    public RelationalSchemaInitializer(IRelationalConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task EnsureSchemaAsync(CancellationToken cancellationToken)
    {
        if (_ready)
        {
            return;
        }

        await _lock.WaitAsync(cancellationToken);
        try
        {
            if (_ready)
            {
                return;
            }

            await using var connection = await _connectionFactory.OpenConnectionAsync(cancellationToken);
            foreach (var statement in TidbStatements)
            {
                await using var command = connection.CreateCommand();
                command.CommandText = statement;
                await command.ExecuteNonQueryAsync(cancellationToken);
            }

            _ready = true;
        }
        finally
        {
            _lock.Release();
        }
    }

    private static readonly string[] TidbStatements =
    [
        """
        create table if not exists coarchitect_organizations (
            id char(36) not null primary key,
            name varchar(255) not null,
            slug varchar(255) not null,
            created_at datetime(6) not null,
            updated_at datetime(6) not null,
            unique key ux_coarchitect_organizations_slug (slug)
        );
        """,
        """
        create table if not exists coarchitect_workspaces (
            id char(36) not null primary key,
            organization_id char(36) not null,
            tenant_id char(36) null,
            name varchar(255) not null,
            created_at datetime(6) not null,
            updated_at datetime(6) not null,
            key ix_coarchitect_workspaces_org (organization_id, updated_at),
            key ix_coarchitect_workspaces_tenant (tenant_id, updated_at)
        );
        """,
        """
        alter table coarchitect_workspaces add column if not exists tenant_id char(36) null;
        """,
        """
        update coarchitect_workspaces set tenant_id = organization_id where tenant_id is null and organization_id is not null;
        """,
        """
        create table if not exists coarchitect_diagrams (
            id char(36) not null primary key,
            workspace_id char(36) not null,
            uploaded_by_user_id char(36) not null,
            name varchar(255) not null,
            original_file_name varchar(512) not null,
            file_url text null,
            description longtext null,
            review_context json not null,
            framework_selection json not null,
            quality_attribute_weights json not null,
            uploaded_at datetime(6) not null,
            key ix_coarchitect_diagrams_workspace (workspace_id, uploaded_at)
        );
        """,
        """
        create table if not exists coarchitect_diagram_comments (
            id char(36) not null primary key,
            architecture_diagram_id char(36) not null,
            user_id char(36) not null,
            content longtext not null,
            created_at datetime(6) not null,
            updated_at datetime(6) not null,
            key ix_coarchitect_comments_diagram (architecture_diagram_id, created_at)
        );
        """,
        """
        create table if not exists coarchitect_analysis_runs (
            id char(36) not null primary key,
            workspace_id char(36) not null,
            architecture_diagram_id char(36) not null,
            status varchar(32) not null,
            requested_at datetime(6) not null,
            started_at datetime(6) null,
            completed_at datetime(6) null,
            report_path varchar(512) null,
            suggestions json not null,
            result_json json null,
            key ix_coarchitect_analysis_runs_diagram (architecture_diagram_id, requested_at)
        );
        """,
        """
        create table if not exists coarchitect_adrs (
            id char(36) not null primary key,
            workspace_id char(36) not null,
            architecture_diagram_id char(36) not null,
            title varchar(255) not null,
            status varchar(64) not null,
            latest_version_number int not null,
            created_by_user_id char(36) not null,
            created_at datetime(6) not null,
            updated_at datetime(6) not null,
            key ix_coarchitect_adrs_diagram (architecture_diagram_id, updated_at)
        );
        """,
        """
        create table if not exists coarchitect_adr_versions (
            id char(36) not null primary key,
            adr_id char(36) not null,
            version_number int not null,
            title varchar(255) not null,
            status varchar(64) not null,
            frameworks json not null,
            draft_json json not null,
            markdown longtext not null,
            html longtext not null,
            summary longtext not null,
            created_by_user_id char(36) not null,
            created_at datetime(6) not null,
            unique key ux_coarchitect_adr_versions (adr_id, version_number),
            key ix_coarchitect_adr_versions_adr (adr_id, version_number)
        );
        """,
        """
        alter table coarchitect_adr_versions add column if not exists draft_json json not null;
        """,
    ];
}
