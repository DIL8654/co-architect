import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArchitectureScoreCard, Button, ErrorState, LoadingState, RunAnalysisButton } from '../components';
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          ← Back
        </Button>
        <h1 className="text-4xl font-bold text-secondary-900">{diagram.name}</h1>
        <p className="text-secondary-600 mt-1">
          Uploaded by {diagram.uploadedByUserId} on {new Date(diagram.uploadedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
                  <div className="bg-secondary-100 px-4 py-3 border-b border-secondary-200">
                    <h3 className="font-semibold text-secondary-900">Analysis Evidence</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {analysis.evidence.map((item, idx) => (
                      <div key={idx} className="border-l-4 border-primary-400 pl-3 py-2">
                        <p className="text-sm font-medium text-secondary-900">{item.summary}</p>
                        <p className="text-sm text-secondary-600 mt-1">{item.detail}</p>
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
