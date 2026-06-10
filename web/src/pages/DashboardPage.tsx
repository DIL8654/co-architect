import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { Breadcrumbs, DiagramIcon, DocsIcon, HealthIcon, LoadingState, SettingsIcon, WorkspaceIcon } from '../components';
import { diagramApi } from '../api/diagrams';
import { workspaceApi } from '../api/workspaces';

export function DashboardPage() {
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

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Dashboard' }]} />
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            A compact overview of the architecture workbench. Use the left navigation tree to move into workspaces and diagrams.
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
          <table className="w-full">
            <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Area</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Purpose</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Access</th>
              </tr>
            </thead>
            <tbody>
              <DashboardRow icon={<WorkspaceIcon className="h-4 w-4" />} area="Workspaces" purpose="Create architecture containers and branch into diagrams from the tree." access="Sidebar" />
              <DashboardRow icon={<DiagramIcon className="h-4 w-4" />} area="Diagrams" purpose="Upload architecture evidence and open the main review workspace." access="Sidebar" />
              <DashboardRow icon={<HealthIcon className="h-4 w-4" />} area="Health" purpose="Check TiDB, blob storage, and AI connectivity before demos." access="Settings section" />
              <DashboardRow icon={<SettingsIcon className="h-4 w-4" />} area="Configuration" purpose="Store Azure AI Foundry settings used for local and hosted runs." access="Settings section" />
              <DashboardRow icon={<DocsIcon className="h-4 w-4" />} area="Documentation" purpose="Read product usage guidance and architecture planning notes." access="Header + sidebar" />
            </tbody>
          </table>
        </div>

        <aside className="space-y-4 rounded-xl border border-[#dde1e6] bg-white p-5 dark:border-white/10 dark:bg-[#08101d]">
          <div>
            <h2 className="text-lg font-semibold text-secondary-950 dark:text-white">Working model</h2>
            <p className="mt-2 text-sm leading-6 text-secondary-600 dark:text-secondary-300">
              The content area is now focused on information and actions. Navigation lives in the left sidebar, where workspaces and diagrams are organized as a tree.
            </p>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4 text-sm leading-6 text-secondary-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-secondary-300">
            Recommended flow: create a workspace, upload a diagram, and run analysis from the detail workspace.
          </div>
        </aside>
      </section>
    </div>
  );
}

function DashboardRow({
  icon,
  area,
  purpose,
  access,
}: {
  icon: React.ReactNode;
  area: string;
  purpose: string;
  access: string;
}) {
  return (
    <tr className="border-b border-[#eef1f4] last:border-0 dark:border-white/10">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="glow-icon h-9 w-9">{icon}</span>
          <span className="font-medium text-secondary-950 dark:text-white">{area}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{purpose}</td>
      <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{access}</td>
    </tr>
  );
}

async function loadDashboardSummary() {
  const workspaces = await workspaceApi.listWorkspaces();
  const summaries = await Promise.all(
    workspaces.map(async (workspace) => {
      const diagrams = await diagramApi.listDiagrams(workspace.id);
      const scoredDiagrams = diagrams.filter((diagram) => diagram.architectureScore !== null && diagram.architectureScore !== undefined);
      return {
        workspaceCount: 1,
        diagramCount: diagrams.length,
        scoredDiagramCount: scoredDiagrams.length,
        needsReviewCount: diagrams.filter((diagram) => !diagram.architectureScore).length,
      };
    })
  );

  const totals = summaries.reduce(
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
  };
}
