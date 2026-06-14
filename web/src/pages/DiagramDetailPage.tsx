import { useMemo, useState } from 'react';
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
  DownloadIcon,
  DiagramIcon,
  DiagramViewer,
  EmptyPanel,
  ErrorState,
  IconButton,
  LoadingState,
  RefreshIcon,
  RunAnalysisButton,
  SegmentedTabs,
  TrashIcon,
} from '../components';
import { analysisApi, type AgentExecutionTrace, type AnalysisRunTimelineItem, type ArchitectureAnalysisResult, type DimensionBreakdown, type FoundryIqContextBundle, type GroundingReferenceSet } from '../api/analysis';
import type { AdrRecord } from '../api/adrs';
import { buildAdrDraft } from '../lib/adrDraft';
import { buildAnalysisComparison, getReviewFreshness, type ReviewFreshness } from '../lib/analysisComparison';
import { escapeHtml, openPrintWindow } from '../lib/printExport';
import { formatScoreBandLabel, getScoreBandMeta } from '../lib/scoreBands';
import { useAdrs, useDeleteAdr, useGenerateAdr, useRegenerateAdr } from '../hooks/useAdrs';
import { useAnalysisRuns, useDiagramAnalysis } from '../hooks/useAnalysis';
import { useCreateComment, useDiagramComments } from '../hooks/useComments';
import { useDiagram } from '../hooks/useDiagrams';

type WorkbenchTab =
  | 'diagram'
  | 'summary'
  | 'findings'
  | 'recommendations'
  | 'trade-offs'
  | 'agent-workflow'
  | 'adrs';
type AdrTab = 'preview' | 'markdown' | 'html' | 'history';

const VALID_TABS: WorkbenchTab[] = [
  'diagram',
  'summary',
  'findings',
  'recommendations',
  'trade-offs',
  'agent-workflow',
  'adrs',
];

export function DiagramDetailPage() {
  const { workspaceId, diagramId } = useParams<{ workspaceId: string; diagramId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const normalizedTab = requestedTab === 'architecture-intelligence' || requestedTab === 'analysis-runs' ? 'summary' : requestedTab;
  const activeTab: WorkbenchTab = VALID_TABS.includes(normalizedTab as WorkbenchTab) ? (normalizedTab as WorkbenchTab) : 'diagram';
  const requestedRunId = searchParams.get('runId');
  const requestedAdrId = searchParams.get('adrId');
  const [activeAdrTab, setActiveAdrTab] = useSearchParamsState<AdrTab>(searchParams, setSearchParams, 'adrView', 'preview');
  const shouldLoadAnalysisRuns = activeTab === 'summary' || activeTab === 'agent-workflow' || Boolean(requestedRunId);
  const shouldLoadComments = activeTab === 'diagram';
  const shouldLoadAdrs = activeTab === 'adrs' || Boolean(requestedAdrId);

  const { data: diagram, isLoading: isDiagramLoading, isError: isDiagramError } = useDiagram(diagramId!);
  const { data: latestAnalysis, refetch: refetchLatestAnalysis } = useDiagramAnalysis(diagramId!);
  const { data: analysisRuns = [], refetch: refetchAnalysisRuns, isLoading: isAnalysisRunsLoading } = useAnalysisRuns(
    shouldLoadAnalysisRuns ? workspaceId! : '',
    shouldLoadAnalysisRuns ? diagramId! : '',
  );
  const { data: comments = [], refetch: refetchComments, isLoading: isCommentsLoading } = useDiagramComments(
    shouldLoadComments ? workspaceId! : '',
    shouldLoadComments ? diagramId! : '',
  );
  const { data: adrs = [], refetch: refetchAdrs, isLoading: isAdrsLoading } = useAdrs(
    shouldLoadAdrs ? workspaceId : undefined,
    shouldLoadAdrs ? diagramId : undefined,
  );
  const createCommentMutation = useCreateComment();
  const generateAdrMutation = useGenerateAdr();
  const regenerateAdrMutation = useRegenerateAdr();
  const deleteAdrMutation = useDeleteAdr();

  const defaultRunId = useMemo(
    () => latestAnalysis?.id ?? diagram?.latestRunId ?? analysisRuns.find((item) => item.status === 'Completed')?.id ?? analysisRuns[0]?.id ?? null,
    [analysisRuns, diagram?.latestRunId, latestAnalysis?.id],
  );

  const effectiveRunId = requestedRunId ?? defaultRunId;

  const { data: selectedRunAnalysis, isLoading: isSelectedRunLoading } = useQuery({
    queryKey: ['diagram-workbench-analysis-run', workspaceId, diagramId, effectiveRunId],
    queryFn: () => analysisApi.getAnalysisRun(workspaceId!, diagramId!, effectiveRunId!),
    enabled: shouldLoadAnalysisRuns && !!workspaceId && !!diagramId && !!effectiveRunId && effectiveRunId !== latestAnalysis?.id,
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

  const isLoadingSelectedAnalysis = Boolean(effectiveRunId && effectiveRunId !== latestAnalysis?.id && isSelectedRunLoading);
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
  const standards = activeAnalysis?.reviewSetup.frameworkSelection.selectedStandards ?? diagram.reviewSetup.frameworkSelection.selectedStandards ?? [];
  const findingRows = buildFindingRows(activeAnalysis);
  const canExportDiagram = Boolean(diagram.fileUrl || diagram.description || activeAnalysis?.executiveSummary);
  const canExportAdr = Boolean(resolvedAdrDraft.html || resolvedAdrDraft.markdown);

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
      tab: 'summary',
      runId: result.id,
    });
  };

  const handleSelectRun = (runId: string, tab: WorkbenchTab = activeTab === 'agent-workflow' ? 'agent-workflow' : 'summary') => {
    updateParams({
      tab,
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

  const handleExportDiagram = () => {
    if (!canExportDiagram) {
      return;
    }

    openPrintWindow(
      `${diagram.name} - Architecture Review`,
      buildDiagramPrintHtml({
        diagram,
        analysis: activeAnalysis,
        scoreLabel: scoreMeta.label,
        freshness: reviewFreshness,
        frameworks: frameworks.length ? frameworks : diagram.reviewSetup.frameworkSelection.selectedFrameworks,
        standards,
      }),
    );
  };

  const handleExportAdr = () => {
    if (!canExportAdr) {
      return;
    }

    openPrintWindow(
      `${resolvedAdrDraft.title} - ADR`,
      buildAdrPrintHtml({
        title: resolvedAdrDraft.title,
        status: resolvedAdrDraft.status,
        date: resolvedAdrDraft.date,
        html: resolvedAdrDraft.html,
        markdown: resolvedAdrDraft.markdown,
      }),
    );
  };

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs
          items={[
            { label: 'Workspaces', to: '/app/workspaces' },
            { label: 'Diagrams', to: `/app/workspaces/${workspaceId}/diagrams` },
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
            <RunAnalysisButton workspaceId={workspaceId} diagramId={diagramId} reviewSetup={diagram?.reviewSetup} onAnalysisComplete={handleAnalysisComplete} disabled={!diagram} />
          </div>
        </div>
      </section>

      <ScoreHeroStrip analysis={activeAnalysis} scoreLabel={scoreMeta.label} freshness={reviewFreshness} selectedRun={selectedRunTimeline} />

      <section className="rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
        <div className="border-b border-[#e5e7eb] p-3 dark:border-white/10">
          <SegmentedTabs
            items={[
              { value: 'diagram', label: 'Diagram' },
              { value: 'summary', label: 'Summary' },
              { value: 'findings', label: `Findings (${findingRows.length})` },
              { value: 'recommendations', label: `Recommendations (${activeAnalysis?.recommendations.length ?? 0})` },
              { value: 'trade-offs', label: `Trade-offs (${activeAnalysis?.tradeoffs.length ?? 0})` },
              { value: 'agent-workflow', label: `Agent Workflow (${activeAnalysis?.agentTrace.length ?? 0})` },
              { value: 'adrs', label: `ADRs (${adrs.length > 0 ? adrs.length : diagram.adrCount ?? 0})` },
            ]}
            activeValue={activeTab}
            onChange={(value) => updateParams({ tab: value, runId: requestedRunId })}
          />
        </div>

        <div className="p-4 md:p-5">
          {activeTab === 'diagram' ? (
            <div className="space-y-4">
              <section className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3 dark:border-white/10">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Diagram</p>
                    <h2 className="mt-1 text-lg font-semibold text-secondary-950 dark:text-white">
                      {diagram.originalFileName || 'Architecture Description'}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {canExportDiagram ? (
                      <IconButton
                        label="Export diagram review as PDF"
                        icon={<DownloadIcon className="h-4 w-4" />}
                        variant="secondary"
                        onClick={handleExportDiagram}
                      />
                    ) : null}
                    <ReviewFreshnessBadge freshness={reviewFreshness} />
                  </div>
                </div>
                <div className="h-[calc(100vh-340px)] min-h-[520px] p-4">
                  <DiagramViewer imageUrl={diagram.fileUrl ?? ''} fileName={diagram.originalFileName} title={diagram.name} />
                </div>
              </section>

              <CommentsSection comments={comments} onAddComment={handleAddComment} isLoading={createCommentMutation.isPending || isCommentsLoading} />
            </div>
          ) : null}

          {activeTab === 'summary' ? (
            isLoadingSelectedAnalysis ? (
              <LoadingState message="Loading selected analysis..." />
            ) : activeAnalysis ? (
              <div className="space-y-4">
                <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
                  <DecisionCard
                    eyebrow="What matters most"
                    title="Executive summary"
                    body={activeAnalysis.executiveSummary}
                  />
                  <ReviewLensCard
                    frameworks={frameworks}
                    standards={standards}
                    completedAt={activeAnalysis.completedAt ?? null}
                    scoreLabel={scoreMeta.label}
                  />
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <CompactInsightList
                    eyebrow="What needs attention"
                    title="Key findings"
                    items={findingRows.slice(0, 4).map((row) => ({
                      label: row.finding,
                      detail: row.recommendation,
                    }))}
                    emptyTitle="No key findings"
                  />
                  <CompactInsightList
                    eyebrow="What to do next"
                    title="Priority moves"
                    items={activeAnalysis.recommendations.slice(0, 4).map((row) => ({
                      label: row.title,
                      detail: `${row.priority} priority · ${row.estimatedEffort}`,
                    }))}
                    emptyTitle="No actions yet"
                  />
                </section>

                <DimensionBreakdownTable breakdowns={activeAnalysis.dimensionBreakdowns ?? []} />
                <FoundryIqContextPanel context={activeAnalysis.foundryIqContext} />
                <AgentSummaryPanel items={activeAnalysis.agentTrace} />
              </div>
            ) : (
              <EmptyPanel title="No summary yet" description="Run architecture analysis to generate the score, findings, and review context." />
            )
          ) : null}

          {activeTab === 'findings' ? (
            isLoadingSelectedAnalysis ? (
              <LoadingState message="Loading selected findings..." />
            ) : activeAnalysis ? (
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
            isLoadingSelectedAnalysis ? (
              <LoadingState message="Loading selected recommendations..." />
            ) : activeAnalysis ? (
              <RecommendationsTable rows={activeAnalysis.recommendations} />
            ) : (
              <EmptyPanel title="No recommendations yet" description="Run analysis to generate improvement recommendations." />
            )
          ) : null}

          {activeTab === 'trade-offs' ? (
            isLoadingSelectedAnalysis ? (
              <LoadingState message="Loading selected trade-offs..." />
            ) : activeAnalysis?.tradeoffs.length ? (
              <TradeoffCompactTable tradeoffs={activeAnalysis.tradeoffs} />
            ) : (
              <EmptyPanel title="No trade-offs yet" description="Trade-off balancing output will appear after a completed analysis run." />
            )
          ) : null}

          {activeTab === 'agent-workflow' ? (
            isAnalysisRunsLoading || isLoadingSelectedAnalysis ? (
              <LoadingState message="Loading selected workflow..." />
            ) : activeAnalysis ? (
              <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                <RunSelectorPanel items={analysisRuns} activeRunId={activeRunId} onSelectRun={(runId) => handleSelectRun(runId, 'agent-workflow')} />
                <AgentWorkflowPipeline items={activeAnalysis.agentTrace} />
              </div>
            ) : (
              <EmptyPanel title="No workflow yet" description="Run analysis to inspect the multi-agent workflow for this diagram." />
            )
          ) : null}

          {activeTab === 'adrs' ? (
            isAdrsLoading ? (
              <LoadingState message="Loading ADRs..." />
            ) : (
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
                  <IconButton
                    label="Regenerate ADR"
                    icon={<RefreshIcon className="h-4 w-4" />}
                    variant="secondary"
                    onClick={handleRegenerateAdr}
                    disabled={regenerateAdrMutation.isPending}
                  />
                  {canExportAdr ? (
                    <IconButton
                      label="Export ADR as PDF"
                      icon={<DownloadIcon className="h-4 w-4" />}
                      variant="secondary"
                      onClick={handleExportAdr}
                    />
                  ) : null}
                  {selectedAdr ? (
                    <IconButton
                      label="Delete ADR"
                      icon={<TrashIcon className="h-4 w-4" />}
                      variant="danger"
                      onClick={handleDeleteAdr}
                      disabled={deleteAdrMutation.isPending}
                    />
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
                  Generated from architecture analysis. Latest version v{selectedAdr.latestVersionNumber}. Export uses a printable browser view for Save as PDF.
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
            )
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
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Summary</p>
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
          {analysis ? (
            <p className="mt-1 text-xs font-medium text-secondary-500 dark:text-secondary-400">
              Final score calculated by CoArchitect scoring engine.
            </p>
          ) : null}
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
  if (items.length === 0) {
    return (
      <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
        <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Agent Summary</p>
        </div>
        <div className="p-4">
          <EmptyPanel title="No agent steps yet" description="The pipeline will appear here after a completed review." />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Agent Summary</p>
      </div>
      <div className="divide-y divide-[#eef1f4] dark:divide-white/10">
        {items.slice(0, 5).map((item) => (
          <div key={`${item.agentName}-${item.startedAt}`} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-secondary-950 dark:text-white">{item.agentName}</p>
              <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-200">{item.summary}</p>
            </div>
            <Badge variant={mapTraceStatus(item.status)}>{item.status}</Badge>
          </div>
        ))}
      </div>
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
  const primarySources = sources.slice(0, 6);

  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Foundry IQ Context</p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
            <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-primary-700 dark:bg-cyan-400/10 dark:text-cyan-100">{context.retrievalProvider}</span>
            {context.fallbackUsed ? <span className="rounded-full bg-warning-50 px-2.5 py-1 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300">Fallback</span> : null}
          </div>
        </div>
        {context.fallbackUsed && context.fallbackReason ? <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-300">{context.fallbackReason}</p> : null}
      </div>
      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="space-y-3">
          {primarySources.map((item) => (
            <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-secondary-950 dark:text-white">{item.title}</p>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-secondary-500">{item.type}</span>
              </div>
              <p className="mt-2 text-sm text-secondary-700 dark:text-secondary-200">{item.reason}</p>
            </div>
          ))}
          {sources.length > primarySources.length ? (
            <details className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#08101d]">
              <summary className="cursor-pointer text-sm font-semibold text-primary-700 dark:text-cyan-200">View details</summary>
              <div className="mt-3 space-y-3">
                {sources.slice(primarySources.length).map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm font-semibold text-secondary-950 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-secondary-500">{item.type}</p>
                    <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-200">{item.reason}</p>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Workspace Memory</p>
          <p className="mt-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">{context.workspaceMemory.architectureEvolutionSummary}</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
            {context.workspaceMemory.recurringFindings.slice(0, 3).map((item) => (
              <li key={item}>• {item}</li>
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
              <td className="px-4 py-3 text-xs leading-6 text-secondary-500 dark:text-secondary-300">
                <details className="group">
                  <summary className="cursor-pointer list-none font-semibold text-primary-700 dark:text-cyan-200">
                    {buildGroundingSummary(row.grounding)}
                  </summary>
                  <div className="mt-2 space-y-2 rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-3 text-secondary-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-secondary-200">
                    <GroundingList label="Frameworks" items={row.grounding.frameworkRefs} />
                    <GroundingList label="Standards" items={row.grounding.standardRefs} />
                    <GroundingList label="Principles" items={row.grounding.principleRefs} />
                    <GroundingList label="Trade-offs" items={row.grounding.tradeoffRefs} />
                    <GroundingList label="History" items={row.grounding.historyRefs} />
                    <GroundingList label="Citations" items={row.grounding.citationRefs} />
                  </div>
                </details>
              </td>
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
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{compact ? 'Next actions' : 'Recommendations'}</p>
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

function RunSelectorPanel({
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
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Run History</p>
      </div>
      <div className="divide-y divide-[#eef1f4] dark:divide-white/10">
        {items.map((item) => {
          const isActive = item.id === activeRunId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectRun(item.id)}
              className={`flex w-full flex-col gap-2 px-4 py-4 text-left transition ${
                isActive ? 'bg-primary-50 dark:bg-cyan-400/10' : 'hover:bg-[#fafafa] dark:hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-secondary-950 dark:text-white">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                <Badge variant={isActive ? 'primary' : 'secondary'}>{isActive ? 'Selected' : item.status}</Badge>
              </div>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                {item.finalScore === null || item.finalScore === undefined ? 'Pending score' : `${item.finalScore.toFixed(1)}/100`}
                {' · '}
                {formatScoreBandLabel(item.scoreBand) || 'No score band'}
              </p>
              <p className="text-sm text-secondary-700 dark:text-secondary-200">{item.executiveSummary}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AgentWorkflowPipeline({ items }: { items: AgentExecutionTrace[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(items[0] ? `${items[0].agentName}-${items[0].startedAt}` : null);

  if (items.length === 0) {
    return <EmptyPanel title="No workflow captured" description="Agent workflow steps will appear after the review pipeline completes." />;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Agent Workflow</p>
      </div>
      <div className="space-y-0 p-5">
        {items.map((item, index) => (
          <div key={`${item.agentName}-${item.startedAt}`} className="relative flex gap-4 pb-5 last:pb-0">
            <div className="relative flex w-8 shrink-0 justify-center">
              {index < items.length - 1 ? <span className="absolute top-7 h-[calc(100%-12px)] w-px bg-[#d7dce2] dark:bg-white/10" /> : null}
              <span className={`relative z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 ${getWorkflowNodeTone(item.status)}`} />
            </div>
            <button
              type="button"
              onClick={() => setExpandedId((current) => (current === `${item.agentName}-${item.startedAt}` ? null : `${item.agentName}-${item.startedAt}`))}
              className="min-w-0 flex-1 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4 text-left dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-secondary-950 dark:text-white">{item.agentName}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-secondary-500">{item.role}</p>
                </div>
                <Badge variant={mapTraceStatus(item.status)}>{item.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-secondary-700 dark:text-secondary-200">{item.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-secondary-500 dark:text-secondary-400">
                {item.framework ? <span className="rounded-full bg-white px-2.5 py-1 dark:bg-white/10">{item.framework}</span> : null}
                {item.usedFoundry ? <span className="rounded-full bg-white px-2.5 py-1 dark:bg-white/10">Azure Foundry</span> : null}
                {item.completedAt ? <span className="rounded-full bg-white px-2.5 py-1 dark:bg-white/10">{new Date(item.completedAt).toLocaleTimeString()}</span> : null}
              </div>
              {expandedId === `${item.agentName}-${item.startedAt}` && item.highlights.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-secondary-700 dark:text-secondary-200">
                  {item.highlights.slice(0, 3).map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              ) : null}
            </button>
          </div>
        ))}
      </div>
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

function ReviewFreshnessBadge({ freshness }: { freshness: ReviewFreshness }) {
  if (freshness === 'fresh') {
    return <span className="rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-400">Fresh review</span>;
  }

  if (freshness === 'aging') {
    return <span className="rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">Aging review</span>;
  }

  return <span className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-xs font-semibold text-secondary-700 dark:bg-white/10 dark:text-secondary-300">Needs review</span>;
}

function DecisionCard({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-semibold text-secondary-950 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">{body}</p>
    </section>
  );
}

function ReviewLensCard({
  frameworks,
  standards,
  completedAt,
  scoreLabel,
}: {
  frameworks: string[];
  standards: string[];
  completedAt: string | null;
  scoreLabel: string;
}) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Review lenses</p>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Score band</p>
          <p className="mt-1 text-sm font-semibold text-secondary-950 dark:text-white">{scoreLabel}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Frameworks</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {frameworks.length ? frameworks.map((item) => (
              <span key={item} className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-xs font-semibold text-secondary-700 dark:bg-white/10 dark:text-secondary-200">
                {item}
              </span>
            )) : <span className="text-sm text-secondary-600 dark:text-secondary-300">None selected</span>}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Standards used</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {standards.length ? standards.map((item) => (
              <span key={item} className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-cyan-400/10 dark:text-cyan-100">
                {formatStandardLabel(item)}
              </span>
            )) : <span className="text-sm text-secondary-600 dark:text-secondary-300">None selected</span>}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Last review</p>
          <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-200">{completedAt ? new Date(completedAt).toLocaleString() : 'Pending'}</p>
        </div>
      </div>
    </section>
  );
}

function CompactInsightList({
  eyebrow,
  title,
  items,
  emptyTitle,
}: {
  eyebrow: string;
  title: string;
  items: { label: string; detail: string }[];
  emptyTitle: string;
}) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <div className="border-b border-[#e5e7eb] bg-[#f8f9fb] px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{eyebrow}</p>
        <h3 className="mt-1 text-base font-semibold text-secondary-950 dark:text-white">{title}</h3>
      </div>
      <div className="p-4">
        {items.length ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.label} className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-sm font-semibold text-secondary-950 dark:text-white">{item.label}</p>
                <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-200">{item.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyPanel title={emptyTitle} description="This section will populate after a completed review." />
        )}
      </div>
    </section>
  );
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
    standards: latest.standards ?? [],
    groundedContext: latest.groundedContext ?? [],
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
    ...context.complianceItems,
    ...context.principleItems,
    ...context.tradeoffItems,
    ...context.adrTemplateItems,
    ...context.workspaceMemoryItems,
  ].map((item) => ({
    id: item.id,
    title: item.title,
    type: `${item.sourceType} · ${item.sourceProvider ?? 'LocalKnowledgeBase'}`,
    reason: item.summary,
  }));
}

function buildGroundingSummary(grounding: GroundingReferenceSet) {
  const parts = [
    grounding.frameworkRefs.length ? `Frameworks: ${grounding.frameworkRefs.join(', ')}` : null,
    grounding.standardRefs.length ? `Standards: ${grounding.standardRefs.join(', ')}` : null,
    grounding.principleRefs.length ? `Principles: ${grounding.principleRefs.join(', ')}` : null,
    grounding.tradeoffRefs.length ? `Trade-offs: ${grounding.tradeoffRefs.join(', ')}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : 'Grounding references will appear after analysis completes.';
}

function GroundingList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="font-semibold text-secondary-900 dark:text-white">{label}</p>
      <p className="mt-1">{items.join(', ')}</p>
    </div>
  );
}

function mapTraceStatus(status: string): 'success' | 'warning' | 'error' | 'secondary' | 'primary' {
  if (status === 'Completed' || status === 'Done') {
    return 'success';
  }
  if (status === 'Running' || status === 'InProgress') {
    return 'primary';
  }
  if (status === 'Failed' || status === 'Error') {
    return 'error';
  }
  return 'secondary';
}

function getWorkflowNodeTone(status: string) {
  if (status === 'Completed' || status === 'Done') {
    return 'border-success-500 bg-success-500';
  }
  if (status === 'Running' || status === 'InProgress') {
    return 'border-primary-500 bg-primary-500 dark:border-cyan-300 dark:bg-cyan-300';
  }
  if (status === 'Failed' || status === 'Error') {
    return 'border-error-500 bg-error-500';
  }
  return 'border-[#c4cad3] bg-white dark:border-white/20 dark:bg-[#08101d]';
}

function buildDiagramPrintHtml({
  diagram,
  analysis,
  scoreLabel,
  freshness,
  frameworks,
  standards,
}: {
  diagram: NonNullable<ReturnType<typeof useDiagram>['data']>;
  analysis: ArchitectureAnalysisResult | null;
  scoreLabel: string;
  freshness: ReviewFreshness;
  frameworks: string[];
  standards: string[];
}) {
  const frameworkChips = frameworks.map((item) => `<span class="print-chip">${escapeHtml(item)}</span>`).join('');
  const standardChips = standards.map((item) => `<span class="print-chip">${escapeHtml(formatStandardLabel(item))}</span>`).join('');
  const imageMarkup = diagram.fileUrl
    ? `<img class="print-image" src="${escapeHtml(diagram.fileUrl)}" alt="${escapeHtml(diagram.name)}" />`
    : '';

  return `
    <h1>${escapeHtml(diagram.name)}</h1>
    <p class="print-meta">Exported from CoArchitect AI · ${escapeHtml(new Date().toLocaleString())}</p>
    <div class="print-card">
      <h2>Architecture Intelligence</h2>
      <table>
        <tbody>
          <tr><th>Score</th><td>${analysis?.finalScore === null || analysis?.finalScore === undefined ? '—' : `${analysis.finalScore.toFixed(1)}/100`}</td></tr>
          <tr><th>Score band</th><td>${escapeHtml(scoreLabel)}</td></tr>
          <tr><th>Review freshness</th><td>${escapeHtml(freshness)}</td></tr>
          <tr><th>Last reviewed</th><td>${escapeHtml(analysis?.completedAt ? new Date(analysis.completedAt).toLocaleString() : 'Not analyzed yet')}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="print-card">
      <h2>Selected Frameworks</h2>
      ${frameworkChips || '<p>No frameworks selected yet.</p>'}
    </div>
    <div class="print-card">
      <h2>Selected Standards</h2>
      ${standardChips || '<p>No additional standards selected yet.</p>'}
    </div>
    <div class="print-card">
      <h2>Architecture Evidence</h2>
      ${imageMarkup}
      ${diagram.description ? `<p>${escapeHtml(diagram.description)}</p>` : ''}
    </div>
    ${
      analysis?.executiveSummary
        ? `<div class="print-card"><h2>Summary</h2><p>${escapeHtml(analysis.executiveSummary)}</p></div>`
        : ''
    }
  `;
}

function formatStandardLabel(value: string) {
  switch (value) {
    case 'Iso27001':
      return 'ISO 27001';
    case 'Gdpr':
      return 'GDPR';
    case 'Soc2':
      return 'SOC 2';
    case 'Togaf':
      return 'TOGAF';
    case 'Safe':
      return 'SAFe';
    default:
      return value;
  }
}

function buildAdrPrintHtml({
  title,
  status,
  date,
  html,
  markdown,
}: {
  title: string;
  status: string;
  date: string;
  html?: string;
  markdown?: string;
}) {
  const body = html && html.trim().length > 0
    ? html
    : `<pre style="white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, monospace;">${escapeHtml(markdown ?? '')}</pre>`;

  return `
    <h1>${escapeHtml(title)}</h1>
    <p class="print-meta">Status: ${escapeHtml(status)} · Date: ${escapeHtml(date)}</p>
    <div class="print-card">${body}</div>
  `;
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
