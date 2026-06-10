import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { analysisApi, type AgentExecutionTrace, type ArchitectureAnalysisResult } from '../api/analysis';
import { diagramApi } from '../api/diagrams';
import { AdrPreview, ArchitectureScoreCard, Breadcrumbs, Button, CodePanel, EmptyPanel, ErrorState, LoadingState, MetaPanel, ReviewSetupSummary, SegmentedTabs } from '../components';
import { buildAdrDraft } from '../lib/adrDraft';

type ResultTab = 'findings' | 'tradeoffs' | 'agents' | 'adr';
type AdrTab = 'preview' | 'markdown' | 'html' | 'history';

interface FindingRow {
  id: string;
  severity: string;
  category: string;
  finding: string;
  recommendation: string;
  evidence: string;
  tradeoff: string;
  frameworkReferences: string[];
}

export function AnalysisResultPage() {
  const { workspaceId, diagramId, runId } = useParams<{ workspaceId: string; diagramId: string; runId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ResultTab>('findings');
  const [activeAdrTab, setActiveAdrTab] = useState<AdrTab>('preview');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const { data: analysis, isLoading, isError } = useQuery({
    queryKey: ['analysis-run', workspaceId, diagramId, runId],
    queryFn: () => analysisApi.getAnalysisRun(workspaceId!, diagramId!, runId!),
    enabled: !!workspaceId && !!diagramId && !!runId,
  });

  const { data: diagram } = useQuery({
    queryKey: ['analysis-run-diagram', diagramId],
    queryFn: () => diagramApi.getDiagram(diagramId!),
    enabled: !!diagramId,
  });

  if (!workspaceId || !diagramId || !runId) {
    return <ErrorState title="Analysis not found" message="The analysis route is missing required IDs." />;
  }

  if (isLoading) {
    return <LoadingState message="Loading analysis result..." />;
  }

  if (isError || !analysis) {
    return (
      <ErrorState
        title="Failed to load analysis"
        message="The analysis run could not be loaded."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  const findings = buildFindingRows(analysis);
  const adrDraft = diagram ? buildAdrDraft({ diagram, analysis, comments: [] }) : null;

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs
          items={[
            { label: 'Workspaces', to: '/workspaces' },
            { label: 'Diagram', to: `/workspaces/${workspaceId}/diagrams/${diagramId}` },
            { label: 'Analysis Result' },
          ]}
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">Analysis Result</h1>
            <p className="page-description">
              Structured architecture findings, trade-offs, agent evidence, and ADR draft output for this completed review.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(`/workspaces/${workspaceId}/diagrams/${diagramId}`)}>
              Back to Diagram
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <ArchitectureScoreCard currentAnalysis={analysis} />
          <ReviewSetupSummary reviewSetup={analysis.reviewSetup} compact />
          <MetaPanel title="Frameworks">
            <div className="flex flex-wrap gap-2">
              {analysis.reviewSetup.frameworkSelection.selectedFrameworks.map((framework) => (
                <span key={framework} className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-xs font-semibold text-secondary-700 dark:bg-white/10 dark:text-secondary-300">
                  {framework}
                </span>
              ))}
            </div>
          </MetaPanel>
          {analysis.openQuestions.length > 0 ? (
            <MetaPanel title="Open Questions">
              <ul className="space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
                {analysis.openQuestions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </MetaPanel>
          ) : null}
          {analysis.criticNotes.length > 0 ? (
            <MetaPanel title="Critic Notes">
              <ul className="space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
                {analysis.criticNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </MetaPanel>
          ) : null}
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="rounded-xl border border-[#dde1e6] bg-white p-4 dark:border-white/10 dark:bg-[#08101d]">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Executive Summary</p>
            <p className="mt-2 text-sm leading-7 text-secondary-700 dark:text-secondary-200">{analysis.executiveSummary}</p>
          </section>

          <section className="rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
            <div className="border-b border-[#e5e7eb] p-2 dark:border-white/10">
              <SegmentedTabs
                items={[
                  { value: 'findings', label: `Findings (${findings.length})` },
                  { value: 'tradeoffs', label: `Trade-offs (${analysis.tradeoffs.length})` },
                  { value: 'agents', label: `Agents (${analysis.agentTrace.length})` },
                  { value: 'adr', label: 'ADR' },
                ]}
                activeValue={activeTab}
                onChange={(value) => setActiveTab(value as ResultTab)}
              />
            </div>

            <div className="p-4">
              {activeTab === 'findings' ? (
                findings.length > 0 ? (
                  <FindingsTable rows={findings} expandedRowId={expandedRowId} onToggleRow={setExpandedRowId} />
                ) : (
                  <EmptyPanel title="No findings generated" description="This analysis run did not return any structured findings." />
                )
              ) : null}

              {activeTab === 'tradeoffs' ? (
                analysis.tradeoffs.length > 0 ? (
                  <TradeoffTable tradeoffs={analysis.tradeoffs} />
                ) : (
                  <EmptyPanel title="No trade-offs generated" description="Trade-off balancing output will appear here when the analysis includes competing options." />
                )
              ) : null}

              {activeTab === 'agents' ? (
                analysis.agentTrace.length > 0 ? (
                  <AgentTraceTable items={analysis.agentTrace} />
                ) : (
                  <EmptyPanel title="No agent trace recorded" description="Agent orchestration output will appear here after a completed run." />
                )
              ) : null}

              {activeTab === 'adr' ? (
                adrDraft ? (
                  <div className="space-y-4">
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
                    {activeAdrTab === 'preview' ? <AdrPreview draft={adrDraft} /> : null}
                    {activeAdrTab === 'markdown' ? <CodePanel title="ADR Markdown" code={adrDraft.markdown} /> : null}
                    {activeAdrTab === 'html' ? <CodePanel title="ADR HTML" code={adrDraft.html} /> : null}
                    {activeAdrTab === 'history' ? (
                      <MetaPanel title="Document History">
                        <ul className="space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
                          {adrDraft.history.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </MetaPanel>
                    ) : null}
                  </div>
                ) : (
                  <EmptyPanel title="ADR preview unavailable" description="The diagram context could not be loaded for the ADR draft." />
                )
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function buildFindingRows(analysis: ArchitectureAnalysisResult): FindingRow[] {
  return analysis.missingControls.map((control, index) => {
    const evidence = analysis.evidence[index]?.detail ?? analysis.evidence[0]?.detail ?? 'No evidence detail provided.';
    const tradeoff = analysis.tradeoffs[index]?.scenario ?? analysis.tradeoffs[0]?.scenario ?? 'No explicit trade-off linked.';
    const frameworkReferences = analysis.reviewSetup.frameworkSelection.selectedFrameworks;
    const severity = inferSeverity(`${control.name} ${control.impact}`);
    const category = inferCategory(control.name, control.recommendation);

    return {
      id: `${control.name}-${index}`,
      severity,
      category,
      finding: control.name,
      recommendation: control.recommendation,
      evidence,
      tradeoff,
      frameworkReferences,
    };
  });
}

function inferSeverity(text: string) {
  const value = text.toLowerCase();
  if (value.includes('critical') || value.includes('severe') || value.includes('urgent')) return 'Critical';
  if (value.includes('high') || value.includes('major')) return 'High';
  if (value.includes('medium') || value.includes('moderate')) return 'Medium';
  return 'Low';
}

function inferCategory(finding: string, recommendation: string) {
  const value = `${finding} ${recommendation}`.toLowerCase();
  if (value.includes('security') || value.includes('tenant') || value.includes('secret') || value.includes('audit')) return 'Security';
  if (value.includes('monitor') || value.includes('logging') || value.includes('observability')) return 'Operations';
  if (value.includes('recovery') || value.includes('backup') || value.includes('failover')) return 'Reliability';
  if (value.includes('gateway') || value.includes('queue') || value.includes('scale')) return 'Scalability';
  return 'Architecture';
}

function FindingsTable({
  rows,
  expandedRowId,
  onToggleRow,
}: {
  rows: FindingRow[];
  expandedRowId: string | null;
  onToggleRow: (rowId: string | null) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <table className="w-full">
        <thead className="border-b border-[#e5e7eb] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Severity</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Category</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Finding</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const expanded = expandedRowId === row.id;
            return (
              <>
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-[#eef1f4] align-top dark:border-white/10"
                  onClick={() => onToggleRow(expanded ? null : row.id)}
                >
                  <td className="px-4 py-4 text-sm font-medium text-secondary-900 dark:text-white">{row.severity}</td>
                  <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{row.category}</td>
                  <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{row.finding}</td>
                  <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{row.recommendation}</td>
                </tr>
                {expanded ? (
                  <tr className="border-b border-[#eef1f4] bg-[#fafafa] dark:border-white/10 dark:bg-white/[0.03]">
                    <td colSpan={4} className="px-4 py-4">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <DetailBlock title="Evidence" value={row.evidence} />
                        <DetailBlock title="Trade-off Link" value={row.tradeoff} />
                        <DetailBlock title="Framework References" value={row.frameworkReferences.join(', ') || 'No framework reference'} />
                      </div>
                    </td>
                  </tr>
                ) : null}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 dark:border-white/10 dark:bg-[#060B16]">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">{value}</p>
    </div>
  );
}

function TradeoffTable({ tradeoffs }: { tradeoffs: ArchitectureAnalysisResult['tradeoffs'] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <table className="w-full">
        <thead className="border-b border-[#e5e7eb] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Scenario</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Pros</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Cons</th>
          </tr>
        </thead>
        <tbody>
          {tradeoffs.map((tradeoff) => (
            <tr key={tradeoff.scenario} className="border-b border-[#eef1f4] align-top last:border-0 dark:border-white/10">
              <td className="px-4 py-4 text-sm font-medium text-secondary-900 dark:text-white">{tradeoff.scenario}</td>
              <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{tradeoff.pros.join(', ')}</td>
              <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{tradeoff.cons.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgentTraceTable({ items }: { items: AgentExecutionTrace[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] dark:border-white/10">
      <table className="w-full">
        <thead className="border-b border-[#e5e7eb] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Agent</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Framework</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Summary</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={`${item.agentName}-${item.startedAt}`} className="border-b border-[#eef1f4] align-top last:border-0 dark:border-white/10">
              <td className="px-4 py-4 text-sm font-medium text-secondary-900 dark:text-white">{item.agentName}</td>
              <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{item.role}</td>
              <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{item.framework ?? 'General'}</td>
              <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{item.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
