import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArchitectureScoreCard, ArrowLeftIcon, Button, DiagramIcon, ErrorState, LoadingState, RunAnalysisButton } from '../components';
import { DiagramViewer } from '../components/DiagramViewer';
import { ArchitectureSummary } from '../components/ArchitectureSummary';
import { CommentsSection } from '../components/CommentsSection';
import { RoadmapSection } from '../components/RoadmapSection';
import { MissingComponentsSection } from '../components/AIAnalysisResults';
import { useDiagram } from '../hooks/useDiagrams';
import { useDiagramAnalysis } from '../hooks/useAnalysis';
import { useDiagramComments, useCreateComment } from '../hooks/useComments';
import type { ArchitectureAnalysisResult } from '../api/analysis';

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

  const { data: diagram, isLoading: isDiagramLoading, isError: isDiagramError } = useDiagram(resolvedOrgId!, diagramId!);
  const { data: analysis, refetch: refetchAnalysis } = useDiagramAnalysis(diagramId!);
  const { data: comments = [], refetch: refetchComments } = useDiagramComments(resolvedOrgId!, diagramId!);
  const createCommentMutation = useCreateComment();

  useEffect(() => {
    latestAnalysisRef.current = analysis ?? null;
  }, [analysis]);

  if (!diagramId || !resolvedOrgId) {
    return (
      <ErrorState
        title="Invalid diagram"
        message="Diagram ID or organization ID is missing."
      />
    );
  }

  if (isDiagramLoading) return <LoadingState message="Loading diagram..." />;

  if (isDiagramError || !diagram) {
    return (
      <ErrorState
        title="Failed to load diagram"
        message="Could not load the diagram details."
        action={
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        }
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
    navigate(`/orgs/${resolvedOrgId}/diagrams/${diagramId}/analysis/${nextAnalysis.id}`);
  };

  const imageUrl = diagram.fileUrl ?? '';

  return (
    <div className="page-shell">
      <section className="page-header">
        <Button variant="ghost" onClick={() => navigate(-1)} className="w-fit" icon={<ArrowLeftIcon className="h-4 w-4" />}>
          Back
        </Button>
        <div className="flex items-center gap-4">
          <div className="glow-icon">
            <DiagramIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">{diagram.name}</h1>
            <p className="page-description mt-2">
              Uploaded by {diagram.uploadedByUserId} on {new Date(diagram.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Diagram (2 columns on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <DiagramViewer imageUrl={imageUrl} fileName={diagram.originalFileName} title={diagram.name} />
          <ArchitectureSummary description={diagram.description} />
        </div>

        {/* Right Column - Analysis and Comments (1 column on lg) */}
        <div className="space-y-6">
          {/* Run Analysis Button */}
          <RunAnalysisButton
            organizationId={resolvedOrgId}
            diagramId={diagramId!}
            onAnalysisComplete={handleAnalysisComplete}
            disabled={!diagram}
          />

          {/* Architecture Intelligence Score */}
          {analysis && (
            <>
              <ArchitectureScoreCard
                currentAnalysis={analysis}
                previousAnalysis={previousAnalysis}
              />

              {analysis.missingControls && analysis.missingControls.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/orgs/${resolvedOrgId}/workspaces/${workspaceId ?? diagram.workspaceId}/diagrams/${diagramId}/recommendations`)}
                >
                  View Recommendations
                </Button>
              )}

              {analysis.tradeoffs && analysis.tradeoffs.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/orgs/${resolvedOrgId}/workspaces/${workspaceId ?? diagram.workspaceId}/diagrams/${diagramId}/tradeoffs`)}
                >
                  View Tradeoffs
                </Button>
              )}

              {/* Improvement Roadmap */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <RoadmapSection recommendations={analysis.recommendations} />
              )}

              {/* Missing Components */}
              {analysis.missingControls && analysis.missingControls.length > 0 && (
                <MissingComponentsSection controls={analysis.missingControls} />
              )}

              {/* AI Analysis Evidence */}
              {analysis.evidence && analysis.evidence.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white/[0.88] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                  <div className="border-b border-secondary-200 bg-secondary-50/90 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
                    <h3 className="font-semibold text-secondary-950 dark:text-white">Analysis Evidence</h3>
                  </div>
                  <div className="space-y-3 p-4">
                    {analysis.evidence.map((item, idx) => (
                      <div key={idx} className="border-l-4 border-primary-400 py-2 pl-3 dark:border-cyan-300">
                        <p className="text-sm font-semibold text-secondary-950 dark:text-white">{item.summary}</p>
                        <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-300">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Comments Section */}
          <CommentsSection
            comments={comments}
            onAddComment={handleAddComment}
            isLoading={createCommentMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
