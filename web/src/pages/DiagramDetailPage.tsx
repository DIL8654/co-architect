import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArchitectureScoreCard,
  Breadcrumbs,
  Button,
  CloseIcon,
  DiagramIcon,
  ErrorState,
  LoadingState,
  RunAnalysisButton,
  SparkIcon,
} from '../components';
import { DiagramViewer } from '../components/DiagramViewer';
import { ArchitectureSummary } from '../components/ArchitectureSummary';
import { CommentsSection } from '../components/CommentsSection';
import { RoadmapSection } from '../components/RoadmapSection';
import { MissingComponentsSection } from '../components/AIAnalysisResults';
import { useDiagram } from '../hooks/useDiagrams';
import { useDiagramAnalysis } from '../hooks/useAnalysis';
import { useDiagramComments, useCreateComment } from '../hooks/useComments';
import type { ArchitectureAnalysisResult } from '../api/analysis';

type DrawerTab = 'score' | 'roadmap' | 'comments' | 'evidence';

export function DiagramDetailPage() {
  const { orgId, organizationId, workspaceId, diagramId } = useParams<{
    orgId: string;
    organizationId: string;
    workspaceId: string;
    diagramId: string;
  }>();
  const resolvedOrgId = orgId ?? organizationId;
  const navigate = useNavigate();
  const latestAnalysisRef = useRef<ArchitectureAnalysisResult | null>(null);
  const [previousAnalysis, setPreviousAnalysis] = useState<ArchitectureAnalysisResult | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<DrawerTab>('score');

  const { data: diagram, isLoading: isDiagramLoading, isError: isDiagramError } = useDiagram(resolvedOrgId!, diagramId!);
  const { data: analysis, refetch: refetchAnalysis } = useDiagramAnalysis(diagramId!);
  const { data: comments = [], refetch: refetchComments } = useDiagramComments(resolvedOrgId!, diagramId!);
  const createCommentMutation = useCreateComment();

  useEffect(() => {
    latestAnalysisRef.current = analysis ?? null;
  }, [analysis]);

  if (!diagramId || !resolvedOrgId) {
    return <ErrorState title="Invalid diagram" message="Diagram ID or organization ID is missing." />;
  }

  if (isDiagramLoading) return <LoadingState message="Loading diagram..." />;

  if (isDiagramError || !diagram) {
    return (
      <ErrorState
        title="Failed to load diagram"
        message="Could not load the diagram details."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  const handleAddComment = async (content: string) => {
    await createCommentMutation.mutateAsync({
      organizationId: resolvedOrgId,
      diagramId,
      content,
    });
    refetchComments();
  };

  const handleAnalysisComplete = (nextAnalysis: ArchitectureAnalysisResult) => {
    setPreviousAnalysis(latestAnalysisRef.current);
    refetchAnalysis();
    setActiveTab('score');
    setIsDrawerOpen(true);
  };

  const workspaceRouteId = workspaceId ?? diagram.workspaceId;
  const imageUrl = diagram.fileUrl ?? '';

  return (
    <div className="min-h-[calc(100vh-112px)]">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Breadcrumbs
            items={[
              { label: 'Organizations', to: '/organizations' },
              { label: 'Workspaces', to: `/orgs/${resolvedOrgId}/workspaces` },
              { label: 'Diagrams', to: `/orgs/${resolvedOrgId}/workspaces/${workspaceRouteId}/diagrams` },
              { label: diagram.name },
            ]}
          />
          <div className="mt-3 flex items-center gap-3">
            <span className="glow-icon h-10 w-10">
              <DiagramIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-normal text-secondary-950 dark:text-white">{diagram.name}</h1>
              <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
                Uploaded {new Date(diagram.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <RunAnalysisButton
            organizationId={resolvedOrgId}
            diagramId={diagramId}
            onAnalysisComplete={handleAnalysisComplete}
            disabled={!diagram}
          />
          <Button variant="secondary" onClick={() => setIsDrawerOpen(true)} icon={<SparkIcon className="h-4 w-4" />}>
            Insights
          </Button>
        </div>
      </div>

      <div className={`grid gap-5 ${isDrawerOpen ? 'xl:grid-cols-[minmax(0,1fr)_430px]' : 'xl:grid-cols-1'}`}>
        <main className="min-w-0 space-y-5">
          <DiagramViewer imageUrl={imageUrl} fileName={diagram.originalFileName} title={diagram.name} />
          <ArchitectureSummary description={diagram.description} />
        </main>

        {isDrawerOpen && (
          <aside className="h-fit max-h-[calc(100vh-132px)] overflow-hidden rounded-2xl border border-secondary-200 bg-white/[0.9] shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#080F1F]/95">
            <div className="flex items-center justify-between border-b border-secondary-200 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Architecture Intelligence</p>
                <h2 className="text-lg font-bold text-secondary-950 dark:text-white">{analysis?.scoreBand ?? 'Ready for analysis'}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-secondary-500 transition hover:bg-secondary-100 dark:text-secondary-300 dark:hover:bg-white/10"
                aria-label="Close insights drawer"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-secondary-200 p-2 dark:border-white/10">
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary-100 p-1 dark:bg-white/5">
                {[
                  ['score', 'Score'],
                  ['roadmap', 'Roadmap'],
                  ['comments', 'Comments'],
                  ['evidence', 'Evidence'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setActiveTab(value as DrawerTab)}
                    className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                      activeTab === value
                        ? 'bg-white text-primary-700 shadow-sm dark:bg-cyan-400/10 dark:text-cyan-100'
                        : 'text-secondary-600 hover:bg-white/70 dark:text-secondary-300 dark:hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[calc(100vh-270px)] overflow-auto p-4">
              {activeTab === 'score' && (
                <div className="space-y-4">
                  {analysis ? (
                    <ArchitectureScoreCard currentAnalysis={analysis} previousAnalysis={previousAnalysis} />
                  ) : (
                    <EmptyDrawerState title="No analysis yet" description="Run AI Analysis to calculate score, dimensions, and maturity level." />
                  )}
                  {analysis?.missingControls && analysis.missingControls.length > 0 && <MissingComponentsSection controls={analysis.missingControls} />}
                  {analysis?.id && (
                    <Button variant="secondary" onClick={() => navigate(`/orgs/${resolvedOrgId}/diagrams/${diagramId}/analysis/${analysis.id}`)}>
                      Open detailed result
                    </Button>
                  )}
                </div>
              )}

              {activeTab === 'roadmap' && (
                <div className="space-y-4">
                  {analysis?.recommendations && analysis.recommendations.length > 0 ? (
                    <RoadmapSection recommendations={analysis.recommendations} />
                  ) : (
                    <EmptyDrawerState title="No roadmap yet" description="Recommendations appear here after a completed analysis." />
                  )}
                  {analysis?.tradeoffs && analysis.tradeoffs.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/orgs/${resolvedOrgId}/workspaces/${workspaceRouteId}/diagrams/${diagramId}/recommendations`)}
                      >
                        Recommendations
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/orgs/${resolvedOrgId}/workspaces/${workspaceRouteId}/diagrams/${diagramId}/tradeoffs`)}
                      >
                        Tradeoffs
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <CommentsSection comments={comments} onAddComment={handleAddComment} isLoading={createCommentMutation.isPending} />
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-3">
                  {analysis?.evidence && analysis.evidence.length > 0 ? (
                    analysis.evidence.map((item, idx) => (
                      <div key={idx} className="rounded-xl border border-secondary-200 bg-secondary-50/70 p-3 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-sm font-semibold text-secondary-950 dark:text-white">{item.summary}</p>
                        <p className="mt-1 text-sm leading-6 text-secondary-600 dark:text-secondary-300">{item.detail}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyDrawerState title="No evidence yet" description="Agent evidence appears after analysis completes." />
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function EmptyDrawerState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-secondary-300 bg-secondary-50/70 p-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <p className="font-semibold text-secondary-950 dark:text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-secondary-600 dark:text-secondary-300">{description}</p>
    </div>
  );
}
