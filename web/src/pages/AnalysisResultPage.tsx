import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '../api/analysis';
import { ArchitectureScoreCard, Breadcrumbs, Button, ErrorState, LoadingState, SparkIcon } from '../components';
import { MissingComponentsSection } from '../components/AIAnalysisResults';

export function AnalysisResultPage() {
  const { orgId, diagramId, runId } = useParams<{ orgId: string; diagramId: string; runId: string }>();
  const navigate = useNavigate();

  const { data: analysis, isLoading, isError } = useQuery({
    queryKey: ['analysis-run', orgId, diagramId, runId],
    queryFn: () => analysisApi.getAnalysisRun(orgId!, diagramId!, runId!),
    enabled: !!orgId && !!diagramId && !!runId,
  });

  if (!orgId || !diagramId || !runId) {
    return <ErrorState title="Analysis not found" message="The analysis route is missing required IDs." />;
  }

  if (isLoading) return <LoadingState message="Loading analysis result..." />;

  if (isError || !analysis) {
    return (
      <ErrorState
        title="Failed to load analysis"
        message="The analysis run could not be loaded."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  return (
    <div className="page-shell max-w-6xl">
      <section className="page-header">
        <Breadcrumbs
          items={[
            { label: 'Organizations', to: '/organizations' },
            { label: 'Diagram', to: `/orgs/${orgId}/diagrams/${diagramId}` },
            { label: 'Analysis Result' },
          ]}
        />
        <div className="flex items-center gap-4">
          <div className="glow-icon">
            <SparkIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="page-title">Analysis Result</h1>
            <p className="page-description mt-2">Architecture Intelligence Score, missing controls, recommendations, and trade-offs.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ArchitectureScoreCard currentAnalysis={analysis} />

        <div className="space-y-6">
          <MissingComponentsSection controls={analysis.missingControls ?? []} />

          <section className="rounded-2xl border border-secondary-200 bg-white/[0.88] p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="mb-3 text-xl font-semibold text-secondary-950 dark:text-white">Recommendations</h2>
            <div className="space-y-3">
              {analysis.recommendations.map((item) => (
                <div key={item.title} className="border-l-4 border-primary-500 pl-3 dark:border-cyan-300">
                  <p className="font-semibold text-secondary-950 dark:text-white">{item.title}</p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-300">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-secondary-200 bg-white/[0.88] p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <h2 className="mb-3 text-xl font-semibold text-secondary-950 dark:text-white">Trade-offs</h2>
            <div className="space-y-4">
              {analysis.tradeoffs.map((tradeoff) => (
                <div key={tradeoff.scenario}>
                  <p className="font-semibold text-secondary-950 dark:text-white">{tradeoff.scenario}</p>
                  <p className="mt-1 text-sm text-success-700 dark:text-success-500">Pros: {tradeoff.pros.join(', ')}</p>
                  <p className="text-sm text-error-700 dark:text-error-500">Cons: {tradeoff.cons.join(', ')}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
