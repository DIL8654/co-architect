import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArchitectureScoreCard,
  AdrPreview,
  Breadcrumbs,
  Button,
  CodePanel,
  DiagramIcon,
  EmptyPanel,
  ErrorState,
  LoadingState,
  MetaPanel,
  ReviewSetupSummary,
  RunAnalysisButton,
  SegmentedTabs,
  SparkIcon,
} from '../components';
import { MissingComponentsSection } from '../components/AIAnalysisResults';
import { ArchitectureSummary } from '../components/ArchitectureSummary';
import { CommentsSection } from '../components/CommentsSection';
import { DiagramViewer } from '../components/DiagramViewer';
import { RoadmapSection } from '../components/RoadmapSection';
import { useAnalysisRuns, useDiagramAnalysis } from '../hooks/useAnalysis';
import { useAdrs, useDeleteAdr, useGenerateAdr, useRegenerateAdr } from '../hooks/useAdrs';
import { useCreateComment, useDiagramComments } from '../hooks/useComments';
import { useDiagram } from '../hooks/useDiagrams';
import { buildAdrDraft } from '../lib/adrDraft';
import { buildAnalysisComparison, getReviewFreshness, type ReviewFreshness } from '../lib/analysisComparison';
import type { AgentExecutionTrace, AnalysisRunTimelineItem, ArchitectureAnalysisResult, DimensionBreakdown } from '../api/analysis';
import type { AdrRecord } from '../api/adrs';

type WorkspaceTab = 'summary' | 'findings' | 'comments' | 'adr';
type FindingsTab = 'missing' | 'dimensions' | 'roadmap' | 'agents' | 'history';
type AdrTab = 'preview' | 'markdown' | 'html' | 'history';

export function DiagramDetailPage() {
  const { workspaceId, diagramId } = useParams<{
    workspaceId: string;
    diagramId: string;
  }>();
  const navigate = useNavigate();
  const latestAnalysisRef = useRef<ArchitectureAnalysisResult | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<ArchitectureAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('summary');
  const [activeFindingsTab, setActiveFindingsTab] = useState<FindingsTab>('missing');
  const [activeAdrTab, setActiveAdrTab] = useState<AdrTab>('preview');

  const { data: diagram, isLoading: isDiagramLoading, isError: isDiagramError } = useDiagram(diagramId!);
  const { data: analysis, refetch: refetchAnalysis } = useDiagramAnalysis(diagramId!);
  const { data: analysisRuns = [], refetch: refetchAnalysisRuns } = useAnalysisRuns(workspaceId!, diagramId!);
  const { data: comments = [], refetch: refetchComments } = useDiagramComments(workspaceId!, diagramId!);
  const { data: adrs = [], refetch: refetchAdrs } = useAdrs(workspaceId, diagramId);
  const generateAdrMutation = useGenerateAdr();
  const regenerateAdrMutation = useRegenerateAdr();
  const deleteAdrMutation = useDeleteAdr();
  const createCommentMutation = useCreateComment();

  useEffect(() => {
    latestAnalysisRef.current = analysis ?? null;
  }, [analysis]);

  if (!diagramId || !workspaceId) {
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

  const latestComparison = buildAnalysisComparison(analysisRuns);
  const reviewFreshness = getReviewFreshness(diagram.uploadedAt, latestComparison?.latest);
  const localAdrDraft = buildAdrDraft({ diagram, analysis: analysis ?? null, comments });
  const latestAdr = adrs[0] ?? null;
  const adrDraft = latestAdr?.latestVersion ? mapAdrRecordToDraft(latestAdr) : localAdrDraft;

  const handleAddComment = async (content: string) => {
    await createCommentMutation.mutateAsync({
      workspaceId,
      diagramId,
      content,
    });
    refetchComments();
  };

  const handleAnalysisComplete = () => {
    setPreviousAnalysis(latestAnalysisRef.current);
    refetchAnalysis();
    refetchAnalysisRuns();
    refetchAdrs();
    setActiveTab('summary');
  };

  const handleGenerateAdr = async () => {
    await generateAdrMutation.mutateAsync({ workspaceId, diagramId });
    refetchAdrs();
    setActiveAdrTab('preview');
  };

  const handleRegenerateAdr = async () => {
    if (!latestAdr) {
      await handleGenerateAdr();
      return;
    }

    await regenerateAdrMutation.mutateAsync({ workspaceId, diagramId, adrId: latestAdr.id });
    refetchAdrs();
    setActiveAdrTab('preview');
  };

  const handleDeleteAdr = async () => {
    if (!latestAdr) {
      return;
    }

    await deleteAdrMutation.mutateAsync({ workspaceId, diagramId, adrId: latestAdr.id });
    refetchAdrs();
    setActiveAdrTab('preview');
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
            <RunAnalysisButton
              workspaceId={workspaceId}
              diagramId={diagramId}
              onAnalysisComplete={handleAnalysisComplete}
              disabled={!diagram}
            />
            {analysis?.id ? (
              <Button variant="secondary" onClick={() => navigate(`/workspaces/${workspaceId}/diagrams/${diagramId}/analysis-runs/${analysis.id}`)}>
                Detailed Result
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="min-w-0 rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Architecture Evidence</p>
              <h2 className="mt-1 text-lg font-semibold text-secondary-950 dark:text-white">
                {diagram.originalFileName || 'Architecture Description'}
              </h2>
            </div>
            <ReviewFreshnessBadge freshness={reviewFreshness} />
          </div>
          <div className="h-[calc(100vh-240px)] min-h-[560px] p-4">
            <DiagramViewer imageUrl={diagram.fileUrl ?? ''} fileName={diagram.originalFileName} title={diagram.name} />
          </div>
        </section>

        <aside className="min-w-0 rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d] xl:sticky xl:top-[84px] xl:max-h-[calc(100vh-104px)] xl:overflow-hidden">
          <div className="border-b border-[#e5e7eb] px-4 py-3 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Architecture Intelligence</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h2 className="truncate text-lg font-semibold text-secondary-950 dark:text-white">
                {analysis?.scoreBand ?? 'Ready for analysis'}
              </h2>
              {analysis?.finalScore !== null && analysis?.finalScore !== undefined ? (
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-cyan-400/10 dark:text-cyan-100">
                  {analysis.finalScore.toFixed(1)}/100
                </span>
              ) : null}
            </div>
          </div>

          <div className="border-b border-[#e5e7eb] p-2 dark:border-white/10">
            <SegmentedTabs
              items={[
                { value: 'summary', label: 'Summary' },
                { value: 'findings', label: 'Findings' },
                { value: 'comments', label: `Comments (${comments.length})` },
                { value: 'adr', label: 'ADR' },
              ]}
              activeValue={activeTab}
              onChange={(value) => setActiveTab(value as WorkspaceTab)}
            />
          </div>

          <div className="overflow-auto p-4 xl:max-h-[calc(100vh-210px)]">
            {activeTab === 'summary' ? (
              <div className="space-y-4">
                {analysis?.executiveSummary ? (
                  <InfoPanel title="Executive Summary">
                    <p className="text-sm leading-6 text-secondary-700 dark:text-secondary-200">{analysis.executiveSummary}</p>
                  </InfoPanel>
                ) : (
                  <EmptyPanel
                    title="No analysis yet"
                    description="Run architecture analysis to generate score, framework findings, and a recommendation roadmap."
                  />
                )}
                <AnalysisComparisonPanel comparison={latestComparison} freshness={reviewFreshness} compact />
                {analysis ? <ArchitectureScoreCard currentAnalysis={analysis} previousAnalysis={previousAnalysis} showDimensions={false} /> : null}
                <ReviewSetupSummary reviewSetup={diagram.reviewSetup} compact />
              </div>
            ) : null}

            {activeTab === 'findings' ? (
              <div className="space-y-4">
                <SegmentedTabs
                  items={[
                    { value: 'missing', label: `Missing (${analysis?.missingControls?.length ?? 0})` },
                    { value: 'dimensions', label: 'Dimensions' },
                    { value: 'roadmap', label: 'Roadmap' },
                    { value: 'agents', label: `Agents (${analysis?.agentTrace?.length ?? 0})` },
                    { value: 'history', label: `History (${analysisRuns.length})` },
                  ]}
                  activeValue={activeFindingsTab}
                  onChange={(value) => setActiveFindingsTab(value as FindingsTab)}
                />

                {activeFindingsTab === 'missing' ? (
                  analysis?.missingControls.length ? (
                    <MissingComponentsSection controls={analysis.missingControls} />
                  ) : (
                    <EmptyPanel title="No missing components yet" description="Missing controls and architecture gaps will appear here after analysis completes." />
                  )
                ) : null}

                {activeFindingsTab === 'dimensions' ? (
                  analysis?.dimensionBreakdowns?.length ? (
                    <DimensionScoresPanel breakdowns={analysis.dimensionBreakdowns} />
                  ) : (
                    <EmptyPanel title="No dimension scores yet" description="Dimension maturity will appear here after the scoring service completes." />
                  )
                ) : null}

                {activeFindingsTab === 'roadmap' ? (
                  <div className="space-y-4">
                    {analysis?.recommendations.length ? (
                      <RoadmapSection recommendations={analysis.recommendations} />
                    ) : (
                      <EmptyPanel title="No roadmap yet" description="Recommendations will appear here after a completed architecture review." />
                    )}
                  </div>
                ) : null}

                {activeFindingsTab === 'agents' ? (
                  analysis?.agentTrace.length ? (
                    <div className="space-y-4">
                      <AgentTraceTable items={analysis.agentTrace} />
                      {(analysis.openQuestions.length > 0 || analysis.criticNotes.length > 0) && (
                        <div className="grid gap-4">
                          <InsightList title="Open Questions" items={analysis.openQuestions} />
                          <InsightList title="Critic Notes" items={analysis.criticNotes} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmptyPanel title="No agent trace yet" description="Planner, specialists, and critic output will appear after a completed run." />
                  )
                ) : null}

                {activeFindingsTab === 'history' ? (
                  analysisRuns.length ? (
                    <AnalysisHistoryTimeline
                      items={analysisRuns}
                      onOpenRun={(runId) => navigate(`/workspaces/${workspaceId}/diagrams/${diagramId}/analysis-runs/${runId}`)}
                    />
                  ) : (
                    <EmptyPanel title="No history yet" description="Completed analysis runs will appear here so the team can compare review changes over time." />
                  )
                ) : null}
              </div>
            ) : null}

            {activeTab === 'comments' ? (
              <CommentsSection comments={comments} onAddComment={handleAddComment} isLoading={createCommentMutation.isPending} />
            ) : null}

            {activeTab === 'adr' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Decision Record</p>
                    <h3 className="mt-1 text-lg font-semibold text-secondary-950 dark:text-white">{adrDraft.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={handleGenerateAdr} isLoading={generateAdrMutation.isPending}>
                      {latestAdr ? 'Generate New ADR' : 'Generate ADR'}
                    </Button>
                    <Button variant="secondary" onClick={handleRegenerateAdr} isLoading={regenerateAdrMutation.isPending}>
                      Regenerate
                    </Button>
                    {latestAdr ? (
                      <Button variant="danger" onClick={handleDeleteAdr} isLoading={deleteAdrMutation.isPending}>
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>

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

                {activeAdrTab === 'preview' ? (
                  <AdrPreview draft={adrDraft} />
                ) : null}

                {activeAdrTab === 'markdown' ? (
                  <CodePanel title="ADR Markdown" code={adrDraft.markdown} />
                ) : null}

                {activeAdrTab === 'html' ? (
                  <CodePanel title="ADR HTML" code={adrDraft.html} />
                ) : null}

                {activeAdrTab === 'history' ? (
                  <InfoPanel title="Document History">
                    <ul className="space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
                      {adrDraft.history.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </InfoPanel>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <h3 className="text-sm font-semibold text-secondary-950 dark:text-white">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function DimensionScoresPanel({ breakdowns }: { breakdowns: DimensionBreakdown[] }) {
  const maxContribution = Math.max(...breakdowns.map((item) => item.contribution), 1);

  return (
    <div className="space-y-3">
      {breakdowns.map((breakdown) => {
        const maturityPercent = Math.max(0, Math.min(100, (breakdown.maturity / 5) * 100));
        const contributionPercent = Math.max(0, Math.min(100, (breakdown.contribution / maxContribution) * 100));

        return (
          <article key={breakdown.dimension} className="rounded-xl border border-[#e5e7eb] bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold text-secondary-950 dark:text-white">{breakdown.dimension}</h4>
                <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                  Maturity {breakdown.maturity}/5 | Weight {breakdown.weight.toFixed(0)}%
                </p>
              </div>
              <div className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-cyan-400/10 dark:text-cyan-100">
                {breakdown.contribution.toFixed(1)} pts
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <ProgressRow label="Maturity" percent={maturityPercent} tone="primary" />
              <ProgressRow label="Contribution" percent={contributionPercent} tone="success" />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProgressRow({ label, percent, tone }: { label: string; percent: number; tone: 'primary' | 'success' }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] font-medium text-secondary-500 dark:text-secondary-400">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#e5e7eb] dark:bg-white/10">
        <div className={`h-2 rounded-full ${tone === 'primary' ? 'bg-primary-500' : 'bg-success-500'}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function AgentTraceTable({ items }: { items: AgentExecutionTrace[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <table className="w-full">
        <thead className="border-b border-[#e5e7eb] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Agent</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Framework</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.agentName}-${item.startedAt}`} className="border-b border-[#eef1f4] align-top last:border-0 dark:border-white/10">
              <td className="px-4 py-4">
                <p className="font-medium text-secondary-950 dark:text-white">{item.agentName}</p>
                <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{item.summary}</p>
              </td>
              <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{item.role}</td>
              <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{item.framework ?? 'General'}</td>
              <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <InfoPanel title={title}>
      <ul className="space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </InfoPanel>
  );
}

function AnalysisHistoryTimeline({
  items,
  onOpenRun,
}: {
  items: AnalysisRunTimelineItem[];
  onOpenRun: (runId: string) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpenRun(item.id)}
          className="w-full rounded-xl border border-[#e5e7eb] bg-white p-4 text-left transition hover:bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-secondary-950 dark:text-white">
                {item.finalScore !== null && item.finalScore !== undefined ? `${item.finalScore.toFixed(1)}/100` : item.status}
              </p>
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
            <span className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-[11px] font-semibold text-secondary-700 dark:bg-white/10 dark:text-secondary-300">
              {item.frameworks.slice(0, 2).join(', ') || 'No frameworks'}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
            {item.executiveSummary || 'Open this run to inspect the completed analysis.'}
          </p>
        </button>
      ))}
    </div>
  );
}

function AnalysisComparisonPanel({
  comparison,
  freshness,
  compact = false,
}: {
  comparison: ReturnType<typeof buildAnalysisComparison>;
  freshness: ReviewFreshness;
  compact?: boolean;
}) {
  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className={`flex ${compact ? 'flex-col gap-3' : 'flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'}`}>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Latest Review Comparison</p>
          <h3 className="mt-1 text-base font-semibold text-secondary-950 dark:text-white">
            {comparison ? 'Latest two runs compared' : 'Only one run available'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-secondary-600 dark:text-secondary-300">
            {comparison?.previous
              ? `Compared ${new Date(comparison.latest.createdAt).toLocaleDateString()} with ${new Date(comparison.previous.createdAt).toLocaleDateString()}.`
              : 'Run analysis again after diagram updates to unlock score and finding deltas.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReviewFreshnessBadge freshness={freshness} />
          {comparison?.scoreDelta !== null && comparison?.scoreDelta !== undefined ? (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                comparison.scoreDelta >= 0
                  ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
                  : 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400'
              }`}
            >
              {comparison.scoreDelta >= 0 ? '+' : ''}
              {comparison.scoreDelta.toFixed(1)} points
            </span>
          ) : null}
        </div>
      </div>
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
