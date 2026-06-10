import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs, Button, LoadingState, WorkspaceIcon } from '../components';
import { diagramApi } from '../api/diagrams';
import { workspaceApi } from '../api/workspaces';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['shell-dashboard-summary'],
    queryFn: loadDashboardSummary,
    refetchOnWindowFocus: false,
  });

  const metrics = useMemo(
    () => [
      { label: 'Workspaces', value: data?.workspaceCount ?? 0 },
      { label: 'Diagrams', value: data?.diagramCount ?? 0 },
      { label: 'Scored diagrams', value: data?.scoredDiagramCount ?? 0 },
      { label: 'Needs review', value: data?.needsReviewCount ?? 0 },
    ],
    [data]
  );

  if (isLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  const busyWorkspaces = data?.workspaceSummaries.filter((workspace) => workspace.diagramCount > 0).length ?? 0;

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs items={[{ label: 'Dashboard' }]} />
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            Platform-wide telemetry and quick actions for your architecture review workflow.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-[#dde1e6] bg-white p-4 dark:border-white/10 dark:bg-[#08101d]">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <div className="overflow-hidden rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
          <div className="panel-header">Workspace Throughput</div>
          <table className="w-full">
            <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Workspace</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Diagrams</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Scored</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Needs review</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-secondary-500">Action</th>
              </tr>
            </thead>
            <tbody>
              {(data?.workspaceSummaries ?? []).map((workspace) => (
                <tr key={workspace.id} className="border-b border-[#eef1f4] last:border-0 dark:border-white/10">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="glow-icon h-9 w-9">
                        <WorkspaceIcon className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-secondary-950 dark:text-white">{workspace.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{workspace.diagramCount}</td>
                  <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{workspace.scoredDiagramCount}</td>
                  <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{workspace.needsReviewCount}</td>
                  <td className="px-4 py-4 text-right">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/workspaces/${workspace.id}/diagrams`)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="space-y-4 rounded-xl border border-[#dde1e6] bg-white p-5 dark:border-white/10 dark:bg-[#08101d]">
          <div>
            <h2 className="text-lg font-semibold text-secondary-950 dark:text-white">Platform Pulse</h2>
            <p className="mt-2 text-sm leading-6 text-secondary-600 dark:text-secondary-300">
              {busyWorkspaces} active workspaces currently contain diagrams. Use this panel to move quickly between overview and deep analysis.
            </p>
          </div>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => navigate('/workspaces')}>
              Manage Workspaces
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => navigate('/')}>
              Open Architecture Intelligence
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => navigate('/health')}>
              Check Platform Health
            </Button>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4 text-sm leading-6 text-secondary-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-secondary-300">
            Professional flow: monitor platform stats here, then drill into workspace diagrams under Architecture to run reviews and inspect results.
          </div>
        </aside>
      </section>
    </div>
  );
}

async function loadDashboardSummary() {
  const workspaces = await workspaceApi.listWorkspaces();
  const workspaceSummaries = await Promise.all(
    workspaces.map(async (workspace) => {
      const diagrams = await diagramApi.listDiagrams(workspace.id);
      const scoredDiagrams = diagrams.filter((diagram) => diagram.architectureScore !== null && diagram.architectureScore !== undefined);
      return {
        id: workspace.id,
        name: workspace.name,
        workspaceCount: 1,
        diagramCount: diagrams.length,
        scoredDiagramCount: scoredDiagrams.length,
        needsReviewCount: diagrams.filter((diagram) => !diagram.architectureScore).length,
      };
    })
  );

  const totals = workspaceSummaries.reduce(
    (total, current) => ({
      workspaceCount: total.workspaceCount + current.workspaceCount,
      diagramCount: total.diagramCount + current.diagramCount,
      scoredDiagramCount: total.scoredDiagramCount + current.scoredDiagramCount,
      needsReviewCount: total.needsReviewCount + current.needsReviewCount,
    }),
    { workspaceCount: 0, diagramCount: 0, scoredDiagramCount: 0, needsReviewCount: 0 }
  );

  return {
    workspaceCount: totals.workspaceCount,
    diagramCount: totals.diagramCount,
    scoredDiagramCount: totals.scoredDiagramCount,
    needsReviewCount: totals.needsReviewCount,
    workspaceSummaries,
  };
}
