import { Fragment, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EmptyState, LoadingState, Button, DiagramIcon } from '../components';
import { workspaceApi } from '../api/workspaces';
import { diagramApi, type ArchitectureDiagram } from '../api/diagrams';
import { analysisApi, type AnalysisRunTimelineItem, type ArchitectureAnalysisResult } from '../api/analysis';
import { buildAnalysisComparison, getReviewFreshness } from '../lib/analysisComparison';

interface ArchitectureOverview {
  workspaceCount: number;
  diagrams: Array<ArchitectureDiagram & {
    workspaceName: string;
    latestAnalysis: ArchitectureAnalysisResult | null;
    analysisRuns: AnalysisRunTimelineItem[];
  }>;
}

export function LandingPage() {
  const navigate = useNavigate();
  const [contextFilter, setContextFilter] = useState<ContextFilter>('all');
  const { data: overview, isLoading } = useQuery({
    queryKey: ['architecture-overview'],
    queryFn: loadArchitectureOverview,
    refetchOnWindowFocus: false,
  });

  const diagrams = overview?.diagrams ?? [];
  const scoredDiagrams = diagrams.filter((diagram) => diagram.latestAnalysis?.finalScore !== null && diagram.latestAnalysis?.finalScore !== undefined);
  const averageScore = scoredDiagrams.length
    ? scoredDiagrams.reduce((total, diagram) => total + (diagram.latestAnalysis?.finalScore ?? 0), 0) / scoredDiagrams.length
    : null;
  const filteredDiagrams = diagrams.filter((diagram) => matchesContextFilter(diagram.latestAnalysis, contextFilter));
  const latestDiagrams = [...filteredDiagrams].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 8);
  const highestRiskDiagrams = [...scoredDiagrams]
    .filter((diagram) => matchesContextFilter(diagram.latestAnalysis, contextFilter))
    .sort((a, b) => (a.latestAnalysis?.finalScore ?? 0) - (b.latestAnalysis?.finalScore ?? 0))
    .slice(0, 5);
  const firstWorkspaceId = useMemo(() => diagrams[0]?.workspaceId ?? null, [diagrams]);

  if (isLoading) {
    return <LoadingState message="Loading architecture overview..." />;
  }

  if (!diagrams.length) {
    return (
      <div className="page-shell">
        <section className="page-header">
          <div>
            <h1 className="page-title">Architecture Intelligence</h1>
            <p className="page-description">Start with a workspace, upload a diagram, and run your first multi-agent architecture review.</p>
          </div>
        </section>
        <EmptyState
          title="No diagrams yet"
          description="Create a workspace, upload architecture evidence, and generate your first Architecture Intelligence Score."
          action={
            <Button onClick={() => navigate(firstWorkspaceId ? `/workspaces/${firstWorkspaceId}/diagrams/upload` : '/workspaces')}>
              Start Demo
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1 className="page-title">Architecture Intelligence</h1>
          <p className="page-description">Recent diagrams, score coverage, and review freshness across the workspace catalog.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <KpiTile label="Workspaces" value={overview?.workspaceCount ?? 0} />
        <KpiTile label="Diagrams" value={diagrams.length} />
        <KpiTile label="Scored" value={scoredDiagrams.length} />
        <KpiTile label="Average Score" value={averageScore === null ? '—' : averageScore.toFixed(1)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_320px]">
        <div className="overflow-hidden rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
          <div className="flex flex-col gap-3 border-b border-[#dde1e6] px-4 py-3 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="panel-header !border-0 !px-0 !py-0">Recent Diagrams</div>
              <span className="text-xs text-secondary-500 dark:text-secondary-400">{filteredDiagrams.length} matching diagrams</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CONTEXT_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setContextFilter(item.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    contextFilter === item.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-[#f4f6f8] text-secondary-700 hover:bg-[#e8ebef] dark:bg-white/10 dark:text-secondary-300 dark:hover:bg-white/15'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full">
            <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Diagram</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Workspace</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {latestDiagrams.map((diagram) => {
                const comparison = buildAnalysisComparison(diagram.analysisRuns);
                const freshness = getReviewFreshness(diagram.uploadedAt, comparison?.latest);
                return (
                  <DiagramTableRow
                    key={diagram.id}
                    diagram={diagram}
                    freshness={freshness}
                    onOpen={() => navigate(`/workspaces/${diagram.workspaceId}/diagrams/${diagram.id}`)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        <aside className="space-y-4 rounded-xl border border-[#dde1e6] bg-white p-5 dark:border-white/10 dark:bg-[#08101d]">
          <div>
            <h2 className="text-lg font-semibold text-secondary-950 dark:text-white">Maturity</h2>
            <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">Score coverage across the current workspaces.</p>
          </div>
          <MaturityBar label="Scored coverage" value={diagrams.length ? (scoredDiagrams.length / diagrams.length) * 100 : 0} />
          <MaturityBar label="Average maturity" value={averageScore ?? 0} />
          <p className="text-sm leading-6 text-secondary-600 dark:text-secondary-300">
            Select a diagram from the sidebar tree or table above to inspect dimension scores, missing controls, and ADR history.
          </p>
        </aside>
      </section>

      {highestRiskDiagrams.length > 0 ? (
        <section className="overflow-hidden rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
          <div className="panel-header">Needs Attention</div>
          <table className="w-full">
            <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Diagram</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Score Band</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Top Gap</th>
              </tr>
            </thead>
            <tbody>
              {highestRiskDiagrams.map((diagram) => (
                <tr
                  key={`attention-${diagram.id}`}
                  onClick={() => navigate(`/workspaces/${diagram.workspaceId}/diagrams/${diagram.id}`)}
                  className="cursor-pointer border-b border-[#eef1f4] transition last:border-0 hover:bg-[#f8f9fb] dark:border-white/10 dark:hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-secondary-950 dark:text-white">{diagram.name}</p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">{diagram.workspaceName}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-300">{diagram.latestAnalysis?.scoreBand ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-error-600 dark:text-error-400">{diagram.latestAnalysis?.finalScore?.toFixed(1) ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-300">{diagram.latestAnalysis?.missingControls?.[0]?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}

type ContextFilter = 'all' | 'framework' | 'principle' | 'tradeoff' | 'history';

const CONTEXT_FILTERS: Array<{ value: ContextFilter; label: string }> = [
  { value: 'all', label: 'All context' },
  { value: 'framework', label: 'Framework' },
  { value: 'principle', label: 'Principle' },
  { value: 'tradeoff', label: 'Trade-off' },
  { value: 'history', label: 'History' },
];

function KpiTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="kpi-tile">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{value}</p>
    </div>
  );
}

function MaturityBar({ label, value }: { label: string; value: number }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-secondary-500">
        <span>{label}</span>
        <span>{bounded.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#e5e7eb] dark:bg-white/10">
        <div className="h-2 rounded-full bg-primary-500" style={{ width: `${bounded}%` }} />
      </div>
    </div>
  );
}

function DiagramTableRow({
  diagram,
  freshness,
  onOpen,
}: {
  diagram: ArchitectureOverview['diagrams'][number];
  freshness: string;
  onOpen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const citations = diagram.latestAnalysis?.foundryIqContext?.citationRefs ?? [];
  const contextSummary = summarizeContext(diagram.latestAnalysis);

  return (
    <Fragment>
      <tr
        onClick={onOpen}
        className="cursor-pointer border-b border-[#eef1f4] transition hover:bg-[#f8f9fb] dark:border-white/10 dark:hover:bg-white/[0.03]"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="glow-icon h-8 w-8">
              <DiagramIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium text-secondary-950 dark:text-white">{diagram.name}</p>
              {diagram.latestAnalysis?.executiveSummary ? (
                <p className="mt-0.5 line-clamp-1 text-xs text-secondary-500 dark:text-secondary-400">{diagram.latestAnalysis.executiveSummary}</p>
              ) : null}
              {contextSummary ? (
                <p className="mt-1 text-[11px] text-secondary-500 dark:text-secondary-400">{contextSummary}</p>
              ) : null}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-300">{diagram.workspaceName}</td>
        <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-300">
          {diagram.latestAnalysis?.finalScore !== null && diagram.latestAnalysis?.finalScore !== undefined
            ? diagram.latestAnalysis.finalScore.toFixed(1)
            : '—'}
        </td>
        <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-300">{freshness}</td>
        <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-300">
          <div className="flex items-center justify-between gap-3">
            <span>{new Date(diagram.uploadedAt).toLocaleDateString()}</span>
            {citations.length > 0 ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setExpanded((value) => !value);
                }}
                className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-[11px] font-semibold text-secondary-700 hover:bg-[#e8ebef] dark:bg-white/10 dark:text-secondary-300 dark:hover:bg-white/15"
              >
                {expanded ? 'Hide citations' : `Citations ${citations.length}`}
              </button>
            ) : null}
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-[#eef1f4] bg-[#fafafa] dark:border-white/10 dark:bg-white/[0.03]">
          <td colSpan={5} className="px-4 py-3">
            <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Foundry IQ context used</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(diagram.latestAnalysis?.foundryIqContext?.frameworkGuidanceItems?.length ?? 0) > 0 ? <ContextPill label="Framework" /> : null}
                  {(diagram.latestAnalysis?.foundryIqContext?.principleItems?.length ?? 0) > 0 ? <ContextPill label="Principle" /> : null}
                  {(diagram.latestAnalysis?.foundryIqContext?.tradeoffItems?.length ?? 0) > 0 ? <ContextPill label="Trade-off" /> : null}
                  {(diagram.latestAnalysis?.foundryIqContext?.workspaceMemoryItems?.length ?? 0) > 0 ? <ContextPill label="History" /> : null}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Citations</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
                  {citations.map((citation) => (
                    <li key={citation}>{citation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

function ContextPill({ label }: { label: string }) {
  return <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700 dark:bg-cyan-400/10 dark:text-cyan-100">{label}</span>;
}

function matchesContextFilter(analysis: ArchitectureAnalysisResult | null, filter: ContextFilter) {
  if (filter === 'all') {
    return true;
  }

  const context = analysis?.foundryIqContext;
  if (!context) {
    return false;
  }

  return (
    (filter === 'framework' && context.frameworkGuidanceItems.length > 0) ||
    (filter === 'principle' && context.principleItems.length > 0) ||
    (filter === 'tradeoff' && context.tradeoffItems.length > 0) ||
    (filter === 'history' && context.workspaceMemoryItems.length > 0)
  );
}

function summarizeContext(analysis: ArchitectureAnalysisResult | null) {
  if (!analysis) {
    return '';
  }

  const labels = [
    analysis.foundryIqContext.frameworkGuidanceItems.length > 0 ? 'Framework' : null,
    analysis.foundryIqContext.principleItems.length > 0 ? 'Principle' : null,
    analysis.foundryIqContext.tradeoffItems.length > 0 ? 'Trade-off' : null,
    analysis.foundryIqContext.workspaceMemoryItems.length > 0 ? 'History' : null,
  ].filter(Boolean);

  return labels.length ? `Foundry IQ context: ${labels.join(', ')}` : '';
}

async function loadArchitectureOverview(): Promise<ArchitectureOverview> {
  const workspaces = await workspaceApi.listWorkspaces();
  const diagramGroups = await Promise.all(
    workspaces.map(async (workspace) => {
      const diagrams = await diagramApi.listDiagrams(workspace.id);
      const enriched = await Promise.all(
        diagrams.map(async (diagram) => ({
          ...diagram,
          workspaceName: workspace.name,
          latestAnalysis: await analysisApi.getDiagramAnalysis(diagram.id),
          analysisRuns: await analysisApi.listAnalysisRuns(workspace.id, diagram.id),
        })),
      );
      return enriched;
    }),
  );

  return {
    workspaceCount: workspaces.length,
    diagrams: diagramGroups.flat(),
  };
}
