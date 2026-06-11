import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState, LoadingState, Button, DiagramIcon, PlusIcon } from '../components';
import { workspaceApi, type Workspace } from '../api/workspaces';
import { diagramApi, type ArchitectureDiagram } from '../api/diagrams';
import { analysisApi, type AnalysisRunTimelineItem, type ArchitectureAnalysisResult } from '../api/analysis';
import { adrApi } from '../api/adrs';
import { buildAnalysisComparison, getReviewFreshness } from '../lib/analysisComparison';
import { DEMO_WORKSPACE_ORDER, isDemoWorkspace, sortWorkspacesForDisplay } from '../lib/demoJourneys';
import { formatScoreBandLabel } from '../lib/scoreBands';
import { SAMPLE_WORKSPACE_NAME } from '../lib/sampleArchitecture';

interface ArchitectureOverview {
  workspaceCount: number;
  workspaces: Workspace[];
  diagrams: Array<ArchitectureDiagram & {
    workspaceName: string;
    latestAnalysis: ArchitectureAnalysisResult | null;
    analysisRuns: AnalysisRunTimelineItem[];
    adrCount: number;
  }>;
}

export function LandingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [contextFilter, setContextFilter] = useState<ContextFilter>('all');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [workspaceName, setWorkspaceName] = useState(SAMPLE_WORKSPACE_NAME);
  const [startError, setStartError] = useState('');
  const { data: overview, isLoading } = useQuery({
    queryKey: ['architecture-overview'],
    queryFn: loadArchitectureOverview,
    refetchOnWindowFocus: false,
  });
  const createWorkspaceMutation = useMutation({
    mutationFn: (name: string) => workspaceApi.createWorkspace({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['architecture-overview'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });

  const diagrams = overview?.diagrams ?? [];
  const workspaces = overview?.workspaces ?? [];
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
  const demoJourneys = useMemo(
    () =>
      diagrams
        .filter((diagram) => isDemoWorkspace(diagram.workspaceName))
        .sort(
          (left, right) =>
            DEMO_WORKSPACE_ORDER.indexOf(left.workspaceName as (typeof DEMO_WORKSPACE_ORDER)[number]) -
            DEMO_WORKSPACE_ORDER.indexOf(right.workspaceName as (typeof DEMO_WORKSPACE_ORDER)[number]),
        )
        .slice(0, 3),
    [diagrams],
  );
  const firstWorkspaceId = useMemo(
    () => demoJourneys[0]?.workspaceId ?? workspaces[0]?.id ?? diagrams[0]?.workspaceId ?? null,
    [demoJourneys, diagrams, workspaces],
  );

  useEffect(() => {
    if (!selectedWorkspaceId && firstWorkspaceId) {
      setSelectedWorkspaceId(firstWorkspaceId);
    }
  }, [firstWorkspaceId, selectedWorkspaceId]);

  const handleStartSampleReview = async () => {
    setStartError('');

    try {
      const workspaceId = selectedWorkspaceId || firstWorkspaceId;
      if (workspaceId) {
        navigate(`/workspaces/${workspaceId}/diagrams/upload?sample=1`);
        return;
      }

      const name = workspaceName.trim();
      if (!name) {
        setStartError('Workspace name is required.');
        return;
      }

      const workspace = await createWorkspaceMutation.mutateAsync(name);
      navigate(`/workspaces/${workspace.id}/diagrams/upload?sample=1`);
    } catch (error) {
      setStartError(error instanceof Error ? error.message : 'Could not start the sample architecture review.');
    }
  };

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
        <GuidedStartPanel
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          workspaceName={workspaceName}
          startError={startError}
          isStarting={createWorkspaceMutation.isPending}
          onSelectWorkspace={setSelectedWorkspaceId}
          onWorkspaceNameChange={setWorkspaceName}
          onStartSample={handleStartSampleReview}
          onCreateBlank={() => navigate(firstWorkspaceId ? `/workspaces/${firstWorkspaceId}/diagrams/upload` : '/workspaces')}
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <div>
          <h1 className="page-title">Architecture Intelligence</h1>
          <p className="page-description">Start with a complete demo architecture review or branch into your own workspace and run a fresh analysis.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleStartSampleReview} isLoading={createWorkspaceMutation.isPending}>
            Use Sample Architecture
          </Button>
          <Button onClick={() => navigate(firstWorkspaceId ? `/workspaces/${firstWorkspaceId}/diagrams/upload` : '/workspaces')} icon={<PlusIcon className="h-4 w-4" />}>
            New Review
          </Button>
        </div>
      </section>

      {demoJourneys.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-secondary-950 dark:text-white">Demo Architecture Journeys</h2>
            <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">
              Open a fully prepared architecture review with real diagram evidence, grounded context, agent workflow, findings, and ADR history.
            </p>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {demoJourneys.map((journey) => (
              <article key={`landing-demo-${journey.id}`} className="overflow-hidden rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
                {journey.fileUrl ? (
                  <button
                    type="button"
                    className="block h-40 w-full bg-[#f8f9fb] dark:bg-white/[0.03]"
                    onClick={() => navigate(`/workspaces/${journey.workspaceId}/diagrams/${journey.id}`)}
                  >
                    <img src={journey.fileUrl} alt={journey.name} className="h-full w-full object-contain p-3" />
                  </button>
                ) : null}
                <div className="space-y-4 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{journey.workspaceName.replace('[Demo] ', '')}</p>
                    <h3 className="mt-1 text-base font-semibold text-secondary-950 dark:text-white">{journey.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-secondary-600 dark:text-secondary-300">{journey.description}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <KpiTile label="Score" value={journey.latestAnalysis?.finalScore === null || journey.latestAnalysis?.finalScore === undefined ? '—' : journey.latestAnalysis.finalScore.toFixed(1)} />
                    <KpiTile label="Status" value={journey.latestAnalysis?.status ?? 'Not run'} />
                    <KpiTile label="ADRs" value={journey.adrCount} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => navigate(`/workspaces/${journey.workspaceId}/diagrams/${journey.id}`)}>
                      Open Diagram
                    </Button>
                    {journey.analysisRuns[0]?.id ? (
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/workspaces/${journey.workspaceId}/diagrams/${journey.id}/analysis-runs/${journey.analysisRuns[0].id}`)}>
                        Open Analysis
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

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
                  <td className="px-4 py-3 text-sm text-secondary-600 dark:text-secondary-300">{formatScoreBandLabel(diagram.latestAnalysis?.scoreBand) || '—'}</td>
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

function GuidedStartPanel({
  workspaces,
  selectedWorkspaceId,
  workspaceName,
  startError,
  isStarting,
  onSelectWorkspace,
  onWorkspaceNameChange,
  onStartSample,
  onCreateBlank,
}: {
  workspaces: Workspace[];
  selectedWorkspaceId: string;
  workspaceName: string;
  startError: string;
  isStarting: boolean;
  onSelectWorkspace: (workspaceId: string) => void;
  onWorkspaceNameChange: (name: string) => void;
  onStartSample: () => void;
  onCreateBlank: () => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="panel">
        <div className="panel-header">Start Architecture Review</div>
        <div className="panel-body space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-secondary-950 dark:text-white">Use the hackathon sample architecture</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary-600 dark:text-secondary-300">
              Prefill a synthetic B2B SaaS architecture with clear security, reliability, operations, and governance gaps. You can edit the evidence before saving or running analysis.
            </p>
          </div>

          {workspaces.length > 0 ? (
            <label className="block">
              <span className="form-label">Workspace</span>
              <select className="form-select" value={selectedWorkspaceId} onChange={(event) => onSelectWorkspace(event.target.value)}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="form-label">Workspace name</span>
              <input
                className="form-input"
                value={workspaceName}
                onChange={(event) => onWorkspaceNameChange(event.target.value)}
                placeholder="Hackathon Architecture Review"
              />
            </label>
          )}

          {startError ? <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-200">{startError}</p> : null}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onStartSample} isLoading={isStarting}>
              Use Sample Architecture
            </Button>
            <Button variant="secondary" onClick={onCreateBlank}>
              Start Blank Review
            </Button>
          </div>
        </div>
      </div>

      <EmptyState
        title="Demo-ready in minutes"
        description="Create a workspace, review the synthetic architecture, run multi-agent analysis, inspect grounding, and generate an ADR."
      />
    </section>
  );
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
  const workspaces = sortWorkspacesForDisplay(await workspaceApi.listWorkspaces());
  const diagramGroups = await Promise.all(
    workspaces.map(async (workspace) => {
      const diagrams = await safeLoad(() => diagramApi.listDiagrams(workspace.id), []);
      const enriched = await Promise.all(
        diagrams.map(async (diagram) => ({
          ...diagram,
          workspaceName: workspace.name,
          latestAnalysis: await safeLoad(() => analysisApi.getDiagramAnalysis(diagram.id), null),
          analysisRuns: await safeLoad(() => analysisApi.listAnalysisRuns(workspace.id, diagram.id), []),
          adrCount: (await safeLoad(() => adrApi.list(workspace.id, diagram.id), [])).length,
        })),
      );
      return enriched;
    }),
  );

  return {
    workspaceCount: workspaces.length,
    workspaces,
    diagrams: diagramGroups.flat(),
  };
}

async function safeLoad<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await Promise.race([
      loader(),
      new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), 4500)),
    ]);
  } catch {
    return fallback;
  }
}
