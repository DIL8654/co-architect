import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AdrPreview,
  ArchitectureSummary,
  Badge,
  Breadcrumbs,
  Button,
  CodePanel,
  CommentsSection,
  DiagramIcon,
  DiagramViewer,
  EmptyPanel,
  ErrorState,
  LoadingState,
  RunAnalysisButton,
  SegmentedTabs,
} from '../components';
import { analysisApi, type AgentExecutionTrace, type AnalysisRunTimelineItem, type ArchitectureAnalysisResult, type DimensionBreakdown, type FoundryIqContextBundle, type GroundingReferenceSet } from '../api/analysis';
import type { AdrRecord } from '../api/adrs';
import { buildAdrDraft } from '../lib/adrDraft';
import { buildAnalysisComparison, getReviewFreshness, type ReviewFreshness } from '../lib/analysisComparison';
import { formatScoreBandLabel, getScoreBandMeta } from '../lib/scoreBands';
import { useAdrs, useDeleteAdr, useGenerateAdr, useRegenerateAdr } from '../hooks/useAdrs';
import { useAnalysisRuns, useDiagramAnalysis } from '../hooks/useAnalysis';
import { useCreateComment, useDiagramComments } from '../hooks/useComments';
import { useDiagram } from '../hooks/useDiagrams';

type WorkbenchTab = 'diagram' | 'architecture-intelligence' | 'findings' | 'recommendations' | 'trade-offs' | 'analysis-runs' | 'adrs';
type AdrTab = 'preview' | 'markdown' | 'html' | 'history';

const VALID_TABS: WorkbenchTab[] = ['diagram', 'architecture-intelligence', 'findings', 'recommendations', 'trade-offs', 'analysis-runs', 'adrs'];

export function DiagramDetailPage() {
  const { workspaceId, diagramId } = useParams<{ workspaceId: string; diagramId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab: WorkbenchTab = VALID_TABS.includes(requestedTab as WorkbenchTab) ? (requestedTab as WorkbenchTab) : 'diagram';
  const requestedRunId = searchParams.get('runId');
  const requestedAdrId = searchParams.get('adrId');
  const [activeAdrTab, setActiveAdrTab] = useSearchParamsState<AdrTab>(searchParams, setSearchParams, 'adrView', 'preview');

  const { data: diagram, isLoading: isDiagramLoading, isError: isDiagramError } = useDiagram(diagramId!);
  const { data: latestAnalysis, refetch: refetchLatestAnalysis } = useDiagramAnalysis(diagramId!);
  const { data: analysisRuns = [], refetch: refetchAnalysisRuns } = useAnalysisRuns(workspaceId!, diagramId!);
  const { data: comments = [], refetch: refetchComments } = useDiagramComments(workspaceId!, diagramId!);
  const { data: adrs = [], refetch: refetchAdrs } = useAdrs(workspaceId, diagramId);
  const createCommentMutation = useCreateComment();
  const generateAdrMutation = useGenerateAdr();
  const regenerateAdrMutation = useRegenerateAdr();
  const deleteAdrMutation = useDeleteAdr();

  const defaultRunId = useMemo(
    () => latestAnalysis?.id ?? analysisRuns.find((item) => item.status === 'Completed')?.id ?? analysisRuns[0]?.id ?? null,
    [analysisRuns, latestAnalysis?.id],
  );

  const effectiveRunId = requestedRunId ?? defaultRunId;

  const { data: selectedRunAnalysis } = useQuery({
    queryKey: ['diagram-workbench-analysis-run', workspaceId, diagramId, effectiveRunId],
    queryFn: () => analysisApi.getAnalysisRun(workspaceId!, diagramId!, effectiveRunId!),
    enabled: !!workspaceId && !!diagramId && !!effectiveRunId && effectiveRunId !== latestAnalysis?.id,
  });

  if (!workspaceId || !diagramId) {
    return <ErrorState title="Invalid diagram" message="Diagram ID or workspace ID is missing." />;
  }

  if (isDiagramLoading) {
    return <LoadingState message="Loading diagram..." />;
  }

  if (isDiagramError || !diagram) {
    return (
      <ErrorState
        title="Failed to load diagram"
        message="Could not load the diagram details."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  const activeAnalysis = effectiveRunId && effectiveRunId !== latestAnalysis?.id ? selectedRunAnalysis ?? null : latestAnalysis ?? null;
  const activeRunId = effectiveRunId ?? latestAnalysis?.id ?? null;
  const selectedRunTimeline = analysisRuns.find((item) => item.id === activeRunId) ?? null;
  const latestComparison = buildAnalysisComparison(analysisRuns);
  const reviewFreshness = getReviewFreshness(diagram.uploadedAt, latestComparison?.latest);
  const adrDraft = buildAdrDraft({ diagram, analysis: activeAnalysis, comments });
  const selectedAdr = adrs.find((adr) => adr.id === requestedAdrId) ?? adrs[0] ?? null;
  const resolvedAdrDraft = selectedAdr?.latestVersion ? mapAdrRecordToDraft(selectedAdr) : adrDraft;
  const scoreMeta = getScoreBandMeta(activeAnalysis?.finalScore, activeAnalysis?.scoreBand);
  const frameworks = activeAnalysis?.reviewSetup.frameworkSelection.selectedFrameworks ?? [];
  const findingRows = buildFindingRows(activeAnalysis);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    setSearchParams(next, { replace: true });
  };

  const handleAddComment = async (content: string) => {
    await createCommentMutation.mutateAsync({ workspaceId, diagramId, content });
    refetchComments();
  };

  const handleAnalysisComplete = async (result: ArchitectureAnalysisResult) => {
    await refetchLatestAnalysis();
    await refetchAnalysisRuns();
    await refetchAdrs();
    updateParams({
      tab: 'architecture-intelligence',
      runId: result.id,
    });
  };

  const handleSelectRun = (runId: string) => {
    updateParams({
      tab: 'analysis-runs',
      runId,
    });
  };

  const handleGenerateAdr = async () => {
    await generateAdrMutation.mutateAsync({ workspaceId, diagramId });
    await refetchAdrs();
    updateParams({ tab: 'adrs' });
    setActiveAdrTab('preview');
  };

  const handleRegenerateAdr = async () => {
    if (!selectedAdr) {
      await handleGenerateAdr();
      return;
    }

    await regenerateAdrMutation.mutateAsync({ workspaceId, diagramId, adrId: selectedAdr.id });
    await refetchAdrs();
    updateParams({ tab: 'adrs', adrId: selectedAdr.id });
    setActiveAdrTab('preview');
  };

  const handleDeleteAdr = async () => {
    if (!selectedAdr) {
      return;
    }

    await deleteAdrMutation.mutateAsync({ workspaceId, diagramId, adrId: selectedAdr.id });
    await refetchAdrs();
    updateParams({ adrId: adrs.find((item) => item.id !== selectedAdr.id)?.id ?? null });
  };

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs
          items={[
            { label: 'Workspaces', to: '/workspaces' },
            { label: 'Diagrams', to: `/workspaces/${workspaceId}/diagrams` },
            { label: diagram.name },
          ]}
        />
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="glow-icon h-10 w-10 shrink-0">
                <DiagramIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-secondary-950 dark:text-white">{diagram.name}</h1>
                <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
                  Uploaded {new Date(diagram.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <ArchitectureSummary description={diagram.description} />
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <RunAnalysisButton workspaceId={workspaceId} diagramId={diagramId} onAnalysisComplete={handleAnalysisComplete} disabled={!diagram} />
          </div>
        </div>
      </section>

      <ScoreHeroStrip analysis={activeAnalysis} scoreLabel={scoreMeta.label} freshness={reviewFreshness} selectedRun={selectedRunTimeline} />

      <section className="rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
        <div className="border-b border-[#e5e7eb] p-3 dark:border-white/10">
          <SegmentedTabs
            items={[
              { value: 'diagram', label: 'Diagram' },
              { value: 'architecture-intelligence', label: 'Architecture Intelligence' },
              { value: 'findings', label: `Findings (${findingRows.length})` },
              { value: 'recommendations', label: `Recommendations (${activeAnalysis?.recommendations.length ?? 0})` },
              { value: 'trade-offs', label: `Trade-offs (${activeAnalysis?.tradeoffs.length ?? 0})` },
              { value: 'analysis-runs', label: `Analysis Runs (${analysisRuns.length})` },
              { value: 'adrs', label: `ADRs (${adrs.length})` },
            ]}
            activeValue={activeTab}
            onChange={(value) => updateParams({ tab: value, runId: value === 'analysis-runs' ? activeRunId : requestedRunId })}
          />
        </div>

        <div className="p-5">
          {activeTab === 'diagram' ? (
            <div className="space-y-5">
              <section className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3 dark:border-white/10">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Architecture Evidence</p>
                    <h2 className="mt-1 text-lg font-semibold text-secondary-950 dark:text-white">
                      {diagram.originalFileName || 'Architecture Description'}
                    </h2>
                  </div>
                  <ReviewFreshnessBadge freshness={reviewFreshness} />
                </div>
                <div className="h-[calc(100vh-340px)] min-h-[520px] p-4">
                  <DiagramViewer imageUrl={diagram.fileUrl ?? ''} fileName={diagram.originalFileName} title={diagram.name} />
                </div>
              </section>

              <CommentsSection comments={comments} onAddComment={handleAddComment} isLoading={createCommentMutation.isPending} />
            </div>
          ) : null}

          {activeTab === 'architecture-intelligence' ? (
            activeAnalysis ? (
              <div className="space-y-5">
                <section className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Executive Summary</p>
                  <p className="mt-2 text-sm leading-7 text-secondary-700 dark:text-secondary-200">{activeAnalysis.executiveSummary}</p>
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
                    <table className="w-full">
                      <tbody>
                        <MetricRow label="Architecture Intelligence Score" value={activeAnalysis.finalScore === null || activeAnalysis.finalScore === undefined ? 'Pending' : `${activeAnalysis.finalScore.toFixed(1)}/100`} />
                        <MetricRow label="Score Band" value={scoreMeta.label} />
                        <MetricRow label="Frameworks" value={frameworks.length ? frameworks.join(', ') : 'None selected'} />
                        <MetricRow label="Completed" value={activeAnalysis.completedAt ? new Date(activeAnalysis.completedAt).toLocaleString() : 'Pending'} />
                      </tbody>
                    </table>
                  </div>
                  <AgentSummaryPanel items={activeAnalysis.agentTrace} />
                </section>

                <DimensionBreakdownTable breakdowns={activeAnalysis.dimensionBreakdowns ?? []} />
                <FoundryIqContextPanel context={activeAnalysis.foundryIqContext} />
                <RecommendationsTable rows={activeAnalysis.recommendations} compact />
                <TradeoffCompactTable tradeoffs={activeAnalysis.tradeoffs} />
              </div>
            ) : (
              <EmptyPanel title="No analysis yet" description="Run architecture analysis to populate score, frameworks, grounded context, and agent summary." />
            )
          ) : null}

          {activeTab === 'findings' ? (
            activeAnalysis ? (
              findingRows.length > 0 ? (
                <FindingsTable rows={findingRows} />
              ) : (
                <EmptyPanel title="No findings yet" description="Missing controls and architecture findings will appear here after analysis completes." />
              )
            ) : (
              <EmptyPanel title="No findings yet" description="Run analysis to generate findings." />
            )
          ) : null}

          {activeTab === 'recommendations' ? (
            activeAnalysis ? (
              <RecommendationsTable rows={activeAnalysis.recommendations} />
            ) : (
              <EmptyPanel title="No recommendations yet" description="Run analysis to generate improvement recommendations." />
            )
          ) : null}

          {activeTab === 'trade-offs' ? (
            activeAnalysis?.tradeoffs.length ? (
              <TradeoffCompactTable tradeoffs={activeAnalysis.tradeoffs} />
            ) : (
              <EmptyPanel title="No trade-offs yet" description="Trade-off balancing output will appear after a completed analysis run." />
            )
          ) : null}

          {activeTab === 'analysis-runs' ? (
            analysisRuns.length ? (
              <AnalysisRunsTable items={analysisRuns} activeRunId={activeRunId} onSelectRun={handleSelectRun} />
            ) : (
              <EmptyPanel title="No analysis history yet" description="Completed analysis runs will appear here so the team can review changes over time." />
            )
          ) : null}

          {activeTab === 'adrs' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Decision Records</p>
                  <h3 className="mt-1 text-lg font-semibold text-secondary-950 dark:text-white">{resolvedAdrDraft.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={handleGenerateAdr} isLoading={generateAdrMutation.isPending}>
                    {selectedAdr ? 'Generate New ADR' : 'Generate ADR'}
                  </Button>
                  <Button variant="secondary" onClick={handleRegenerateAdr} isLoading={regenerateAdrMutation.isPending}>
                    Regenerate
                  </Button>
                  {selectedAdr ? (
                    <Button variant="danger" onClick={handleDeleteAdr} isLoading={deleteAdrMutation.isPending}>
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>

              {adrs.length > 0 ? (
                <AdrList
                  adrs={adrs}
                  selectedAdrId={selectedAdr?.id ?? null}
                  onSelect={(adrId) => updateParams({ tab: 'adrs', adrId })}
                />
              ) : null}

              {selectedAdr ? (
                <div className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
                  Generated from architecture analysis. Latest version v{selectedAdr.latestVersionNumber}. PDF export coming next.
                </div>
              ) : null}

              <SegmentedTabs
                items={[
                  { value: 'preview', label: 'Preview' },
                  { value: 'markdown', label: 'Markdown' },
                  { value: 'html', label: 'HTML' },
                  { value: 'history', label: 'History' },
                ]}
                activeValue={activeAdrTab}
                onChange={(value) => setActiveAdrTab(value as AdrTab)}
              />

              {activeAdrTab === 'preview' ? <AdrPreview draft={resolvedAdrDraft} /> : null}
              {activeAdrTab === 'markdown' ? <CodePanel title="ADR Markdown" code={resolvedAdrDraft.markdown} /> : null}
              {activeAdrTab === 'html' ? <CodePanel title="ADR HTML" code={resolvedAdrDraft.html} /> : null}
              {activeAdrTab === 'history' ? (
                <AdrHistoryPanel selectedAdr={selectedAdr} history={resolvedAdrDraft.history} />
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ScoreHeroStrip({
  analysis,
  scoreLabel,
  freshness,
  selectedRun,
}: {
  analysis: ArchitectureAnalysisResult | null;
  scoreLabel: string;
  freshness: ReviewFreshness;
  selectedRun: AnalysisRunTimelineItem | null;
}) {
  return (
    <section className="rounded-xl border border-[#dde1e6] bg-white p-4 dark:border-white/10 dark:bg-[#08101d]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Architecture Intelligence</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span className="text-4xl font-bold text-secondary-950 dark:text-white">
              {analysis?.finalScore === null || analysis?.finalScore === undefined ? '—' : analysis.finalScore.toFixed(1)}
            </span>
            <span className="pb-1 text-sm font-medium text-secondary-500 dark:text-secondary-400">/ 100</span>
            <Badge variant={getScoreBandMeta(analysis?.finalScore, analysis?.scoreBand).variant}>{analysis ? scoreLabel : 'Ready for analysis'}</Badge>
          </div>
          <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-300">
            {analysis?.completedAt
              ? `Last reviewed ${new Date(analysis.completedAt).toLocaleString()}`
              : 'Run architecture analysis to generate score, band, and grounded recommendations.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReviewFreshnessBadge freshness={freshness} />
          {selectedRun?.frameworks.length ? (
            <span className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-xs font-semibold text-secondary-700 dark:bg-white/10 dark:text-secondary-300">
              {selectedRun.frameworks.join(', ')}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AgentSummaryPanel({ items }: { items: AgentExecutionTrace[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Agent Summary</p>
      </div>
      <table className="w-full">
        <thead className="sr-only">
          <tr>
            <th>Agent</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 6).map((item) => (
            <tr key={`${item.agentName}-${item.startedAt}`} className="border-b border-[#eef1f4] align-top last:border-0 dark:border-white/10">
              <td className="px-4 py-3 text-sm font-medium text-secondary-950 dark:text-white">{item.agentName}</td>
              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{item.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function DimensionBreakdownTable({ breakdowns }: { breakdowns: DimensionBreakdown[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Dimension Breakdown</p>
      </div>
      {breakdowns.length > 0 ? (
        <table className="w-full">
          <thead className="border-b border-[#eef1f4] bg-white dark:border-white/10 dark:bg-[#08101d]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Dimension</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Maturity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Weight</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Contribution</th>
            </tr>
          </thead>
          <tbody>
            {breakdowns.map((item) => (
              <tr key={item.dimension} className="border-b border-[#eef1f4] last:border-0 dark:border-white/10">
                <td className="px-4 py-3 text-sm font-medium text-secondary-950 dark:text-white">{item.dimension}</td>
                <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{item.maturity}/5</td>
                <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{item.weight.toFixed(0)}%</td>
                <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{item.contribution.toFixed(1)} pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-4">
          <EmptyPanel title="No dimension scores yet" description="Dimension maturity will appear here after the scoring service completes." />
        </div>
      )}
    </section>
  );
}

function FoundryIqContextPanel({ context }: { context: FoundryIqContextBundle }) {
  const sources = getGroundedSources(context);

  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Foundry IQ Context</p>
      </div>
      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="overflow-hidden rounded-lg border border-[#e5e7eb] dark:border-white/10">
          <table className="w-full">
            <thead className="border-b border-[#eef1f4] bg-white dark:border-white/10 dark:bg-[#08101d]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Why used</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((item) => (
                <tr key={item.id} className="border-b border-[#eef1f4] align-top last:border-0 dark:border-white/10">
                  <td className="px-4 py-3 text-sm font-medium text-secondary-950 dark:text-white">{item.title}</td>
                  <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{item.type}</td>
                  <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Workspace Memory</p>
          <p className="mt-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">{context.workspaceMemory.architectureEvolutionSummary}</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
            {context.workspaceMemory.recurringFindings.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {context.workspaceMemory.recurringFindings.length === 0 ? <li>No recurring findings captured yet.</li> : null}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FindingsTable({ rows }: { rows: FindingRow[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <table className="w-full">
        <thead className="border-b border-[#e5e7eb] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Finding</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Dimension</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Recommendation</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Grounding</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[#eef1f4] align-top last:border-0 dark:border-white/10">
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-secondary-950 dark:text-white">{row.finding}</p>
                <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-200">{row.evidence}</p>
              </td>
              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{row.category}</td>
              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{row.recommendation}</td>
              <td className="px-4 py-3 text-xs leading-6 text-secondary-500 dark:text-secondary-300">{buildGroundingSummary(row.grounding)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function RecommendationsTable({
  rows,
  compact = false,
}: {
  rows: ArchitectureAnalysisResult['recommendations'];
  compact?: boolean;
}) {
  if (rows.length === 0) {
    return <EmptyPanel title="No recommendations yet" description="Recommendations will appear here after a completed architecture review." />;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{compact ? 'Recommendation Preview' : 'Recommendations'}</p>
      </div>
      <table className="w-full">
        <thead className="border-b border-[#eef1f4] bg-white dark:border-white/10 dark:bg-[#08101d]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Recommendation</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Effort</th>
          </tr>
        </thead>
        <tbody>
          {(compact ? rows.slice(0, 4) : rows).map((row) => (
            <tr key={row.title} className="border-b border-[#eef1f4] align-top last:border-0 dark:border-white/10">
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-secondary-950 dark:text-white">{row.title}</p>
                <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-200">{row.description}</p>
              </td>
              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{row.priority}</td>
              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{row.estimatedEffort}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TradeoffCompactTable({ tradeoffs }: { tradeoffs: ArchitectureAnalysisResult['tradeoffs'] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Trade-offs</p>
      </div>
      <table className="w-full">
        <thead className="border-b border-[#eef1f4] bg-white dark:border-white/10 dark:bg-[#08101d]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Trade-off</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Pros</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Cons</th>
          </tr>
        </thead>
        <tbody>
          {tradeoffs.map((tradeoff) => (
            <tr key={tradeoff.scenario} className="border-b border-[#eef1f4] align-top last:border-0 dark:border-white/10">
              <td className="px-4 py-3 text-sm font-medium text-secondary-950 dark:text-white">{tradeoff.scenario}</td>
              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{tradeoff.pros.join(', ')}</td>
              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{tradeoff.cons.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function AnalysisRunsTable({
  items,
  activeRunId,
  onSelectRun,
}: {
  items: AnalysisRunTimelineItem[];
  activeRunId: string | null;
  onSelectRun: (runId: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <table className="w-full">
        <thead className="border-b border-[#e5e7eb] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Run</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Score</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Score Band</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Frameworks</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-secondary-500">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={`border-b border-[#eef1f4] last:border-0 dark:border-white/10 ${item.id === activeRunId ? 'bg-primary-50 dark:bg-cyan-400/10' : ''}`}>
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-secondary-950 dark:text-white">{new Date(item.createdAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{item.status}</p>
              </td>
              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">
                {item.finalScore === null || item.finalScore === undefined ? 'Pending' : `${item.finalScore.toFixed(1)}/100`}
              </td>
              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{formatScoreBandLabel(item.scoreBand) || '—'}</td>
              <td className="px-4 py-3 text-sm text-secondary-700 dark:text-secondary-200">{item.frameworks.join(', ') || 'No frameworks'}</td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant={item.id === activeRunId ? 'secondary' : 'primary'} onClick={() => onSelectRun(item.id)}>
                  {item.id === activeRunId ? 'Selected' : 'Open'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function AdrList({
  adrs,
  selectedAdrId,
  onSelect,
}: {
  adrs: AdrRecord[];
  selectedAdrId: string | null;
  onSelect: (adrId: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <table className="w-full">
        <thead className="border-b border-[#e5e7eb] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">ADR</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Latest</th>
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Versions</th>
          </tr>
        </thead>
        <tbody>
          {adrs.map((adr) => (
            <tr
              key={adr.id}
              className={`cursor-pointer border-b border-[#eef1f4] last:border-0 dark:border-white/10 ${
                selectedAdrId === adr.id ? 'bg-primary-50 dark:bg-cyan-400/10' : 'hover:bg-[#fafafa] dark:hover:bg-white/[0.04]'
              }`}
              onClick={() => onSelect(adr.id)}
            >
              <td className="px-3 py-3 text-sm font-medium text-secondary-950 dark:text-white">{adr.title}</td>
              <td className="px-3 py-3 text-sm text-secondary-700 dark:text-secondary-200">v{adr.latestVersionNumber}</td>
              <td className="px-3 py-3 text-sm text-secondary-700 dark:text-secondary-200">{adr.versions.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdrHistoryPanel({
  selectedAdr,
  history,
}: {
  selectedAdr: AdrRecord | null;
  history: string[];
}) {
  return (
    <section className="space-y-4 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      {selectedAdr?.versions.length ? (
        <div className="overflow-hidden rounded-lg border border-[#e5e7eb] dark:border-white/10">
          <table className="w-full">
            <thead className="border-b border-[#e5e7eb] bg-white dark:border-white/10 dark:bg-[#08101d]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Version</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Created</th>
              </tr>
            </thead>
            <tbody>
              {selectedAdr.versions.map((version) => (
                <tr key={version.id} className="border-b border-[#eef1f4] last:border-0 dark:border-white/10">
                  <td className="px-3 py-2 text-sm font-medium text-secondary-950 dark:text-white">v{version.versionNumber}</td>
                  <td className="px-3 py-2 text-sm text-secondary-700 dark:text-secondary-200">{version.status}</td>
                  <td className="px-3 py-2 text-sm text-secondary-700 dark:text-secondary-200">{new Date(version.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <ul className="space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
        {history.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-[#eef1f4] last:border-0 dark:border-white/10">
      <th className="w-[220px] bg-[#f8f9fb] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:bg-white/[0.03]">{label}</th>
      <td className="px-4 py-3 text-sm text-secondary-950 dark:text-white">{value}</td>
    </tr>
  );
}

function ReviewFreshnessBadge({ freshness }: { freshness: ReviewFreshness }) {
  if (freshness === 'fresh') {
    return <span className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-400">Fresh review</span>;
  }

  if (freshness === 'aging') {
    return <span className="rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">Aging review</span>;
  }

  return <span className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-xs font-semibold text-secondary-700 dark:bg-white/10 dark:text-secondary-300">Needs review</span>;
}

function mapAdrRecordToDraft(adr: AdrRecord) {
  const latest = adr.latestVersion!;
  return {
    title: latest.title,
    status: latest.status,
    date: latest.date,
    context: latest.context,
    decision: latest.decision,
    alternatives: latest.alternatives,
    tradeoffs: latest.tradeoffs,
    consequences: latest.consequences,
    risks: latest.risks,
    frameworks: latest.frameworks,
    markdown: latest.markdown,
    html: latest.html,
    history: latest.history,
  };
}

type FindingRow = {
  id: string;
  category: string;
  finding: string;
  recommendation: string;
  evidence: string;
  grounding: GroundingReferenceSet;
};

function buildFindingRows(analysis: ArchitectureAnalysisResult | null): FindingRow[] {
  if (!analysis) {
    return [];
  }

  return analysis.missingControls.map((item, index) => ({
    id: `${item.name}-${index}`,
    category: item.impact,
    finding: item.name,
    recommendation: item.recommendation,
    evidence: item.impact,
    grounding: item.grounding,
  }));
}

function getGroundedSources(context: FoundryIqContextBundle) {
  return [
    ...context.frameworkGuidanceItems,
    ...context.principleItems,
    ...context.tradeoffItems,
    ...context.adrTemplateItems,
    ...context.workspaceMemoryItems,
  ].map((item) => ({
    id: item.id,
    title: item.title,
    type: item.sourceType,
    reason: item.summary,
  }));
}

function buildGroundingSummary(grounding: GroundingReferenceSet) {
  const parts = [
    grounding.frameworkRefs.length ? `Frameworks: ${grounding.frameworkRefs.join(', ')}` : null,
    grounding.principleRefs.length ? `Principles: ${grounding.principleRefs.join(', ')}` : null,
    grounding.tradeoffRefs.length ? `Trade-offs: ${grounding.tradeoffRefs.join(', ')}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : 'Grounding references will appear after analysis completes.';
}

function useSearchParamsState<T extends string>(
  searchParams: URLSearchParams,
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  key: string,
  fallback: T,
) {
  const value = (searchParams.get(key) as T | null) ?? fallback;
  const setter = (nextValue: T) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, nextValue);
    setSearchParams(next, { replace: true });
  };

  return [value, setter] as const;
}
