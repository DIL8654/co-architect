import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '../api/analysis';
import { ArchitectureScoreCard, Button, ErrorState, LoadingState } from '../components';
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
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        Back
      </Button>
      <h1 className="mb-6 text-3xl font-bold text-secondary-900">Analysis Result</h1>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ArchitectureScoreCard currentAnalysis={analysis} />

        <div className="space-y-6">
          <MissingComponentsSection controls={analysis.missingControls ?? []} />

          <section className="rounded-lg border border-secondary-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold text-secondary-900">Recommendations</h2>
            <div className="space-y-3">
              {analysis.recommendations.map((item) => (
                <div key={item.title} className="border-l-4 border-primary-500 pl-3">
                  <p className="font-medium text-secondary-900">{item.title}</p>
                  <p className="text-sm text-secondary-600">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-secondary-200 bg-white p-5">
            <h2 className="mb-3 text-xl font-semibold text-secondary-900">Trade-offs</h2>
            <div className="space-y-4">
              {analysis.tradeoffs.map((tradeoff) => (
                <div key={tradeoff.scenario}>
                  <p className="font-medium text-secondary-900">{tradeoff.scenario}</p>
                  <p className="mt-1 text-sm text-success-700">Pros: {tradeoff.pros.join(', ')}</p>
                  <p className="text-sm text-error-700">Cons: {tradeoff.cons.join(', ')}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
