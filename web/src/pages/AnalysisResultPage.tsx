import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { analysisApi, type AgentExecutionTrace, type ArchitectureAnalysisResult, type FoundryIqContextBundle, type GroundingReferenceSet } from '../api/analysis';
import { adrApi } from '../api/adrs';
import { diagramApi } from '../api/diagrams';
import { workspaceApi } from '../api/workspaces';
import { AdrPreview, ArchitectureScoreCard, Breadcrumbs, Button, CodePanel, EmptyPanel, ErrorState, LoadingState, MetaPanel, ReviewSetupSummary, SegmentedTabs } from '../components';
import { buildAdrDraft } from '../lib/adrDraft';
import { formatScoreBandLabel } from '../lib/scoreBands';

type ResultTab = 'findings' | 'tradeoffs' | 'context' | 'agents' | 'adr';
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
  grounding: GroundingReferenceSet;
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

  const { data: workspace } = useQuery({
    queryKey: ['analysis-run-workspace', workspaceId],
    queryFn: () => workspaceApi.getWorkspace(workspaceId!),
    enabled: !!workspaceId,
  });

  const { data: relatedAdrs = [] } = useQuery({
    queryKey: ['analysis-run-adrs', workspaceId, diagramId],
    queryFn: () => adrApi.list(workspaceId!, diagramId!),
    enabled: !!workspaceId && !!diagramId,
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
  const criticalFindings = findings.filter((finding) => finding.severity === 'Critical' || finding.severity === 'High').length;
  const selectedStandards = analysis.reviewSetup.frameworkSelection.selectedStandards ?? [];

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs
          items={[
            { label: 'Workspaces', to: '/app/workspaces' },
            { label: 'Diagram', to: `/app/workspaces/${workspaceId}/diagrams/${diagramId}` },
            { label: 'Analysis Result' },
          ]}
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">{diagram?.name ?? 'Analysis Result'}</h1>
            <p className="page-description">
              {workspace?.name ?? 'Workspace'} • {analysis.status} • {new Date(analysis.createdAt).toLocaleString()} • {analysis.reviewSetup.frameworkSelection.selectedFrameworks.join(', ')}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(`/app/workspaces/${workspaceId}/diagrams/${diagramId}`)}>
              Back to Diagram
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ResultMetric label="Architecture Intelligence Score" value={analysis.finalScore === null || analysis.finalScore === undefined ? 'Pending' : analysis.finalScore.toFixed(1)} />
        <ResultMetric label="Score Band" value={formatScoreBandLabel(analysis.scoreBand) || 'Not scored'} />
        <ResultMetric label="Critical Findings" value={criticalFindings} />
        <ResultMetric label="ADRs Generated" value={relatedAdrs.length} />
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
          <MetaPanel title="Standards Used">
            <div className="flex flex-wrap gap-2">
              {selectedStandards.length > 0 ? (
                selectedStandards.map((standard) => (
                  <span key={standard} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-cyan-400/10 dark:text-cyan-200">
                    {formatStandardLabel(standard)}
                  </span>
                ))
              ) : (
                <p className="text-sm text-secondary-600 dark:text-secondary-300">No additional standards were selected for this run.</p>
              )}
            </div>
          </MetaPanel>
          <MetaPanel title="Foundry IQ">
            <div className="space-y-3 text-sm text-secondary-700 dark:text-secondary-200">
              <p>{analysis.foundryIqContext.workspaceMemory.architectureEvolutionSummary}</p>
              <div className="flex flex-wrap gap-2">
                <ContextCountBadge label="Framework" count={analysis.foundryIqContext.frameworkGuidanceItems.length} />
                <ContextCountBadge label="Compliance" count={analysis.foundryIqContext.complianceItems.length} />
                <ContextCountBadge label="Principle" count={analysis.foundryIqContext.principleItems.length} />
                <ContextCountBadge label="Trade-off" count={analysis.foundryIqContext.tradeoffItems.length} />
                <ContextCountBadge label="Memory" count={analysis.foundryIqContext.workspaceMemoryItems.length} />
              </div>
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
          {relatedAdrs.length > 0 ? (
            <MetaPanel title="Related ADRs">
              <div className="space-y-2">
                {relatedAdrs.map((adr) => (
                  <button
                    key={adr.id}
                    type="button"
                    onClick={() => navigate(`/app/workspaces/${workspaceId}/diagrams/${diagramId}?tab=adrs&adrId=${adr.id}`)}
                    className="block w-full rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-3 py-2 text-left text-sm font-medium text-secondary-950 hover:bg-[#f4f6f8] dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.06]"
                  >
                    {adr.title}
                    <span className="mt-1 block text-xs font-normal text-secondary-500 dark:text-secondary-400">Latest v{adr.latestVersionNumber}</span>
                  </button>
                ))}
              </div>
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
                  { value: 'context', label: 'Context' },
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

              {activeTab === 'context' ? (
                <FoundryIqContextPanel context={analysis.foundryIqContext} />
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
      grounding: control.grounding,
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
              <Fragment key={row.id}>
                <tr
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
                      <div className="mt-4">
                        <GroundingDetails grounding={row.grounding} />
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
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
            <Fragment key={`${item.agentName}-${item.startedAt}`}>
              <tr className="border-b border-[#eef1f4] align-top dark:border-white/10">
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-secondary-900 dark:text-white">{item.agentName}</span>
                    <AgentStageBadge item={item} />
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{item.role}</td>
                <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{item.framework ?? 'General'}</td>
                <td className="px-4 py-4 text-sm text-secondary-700 dark:text-secondary-200">{item.summary}</td>
              </tr>
              <tr className="border-b border-[#eef1f4] bg-[#fafafa] align-top last:border-0 dark:border-white/10 dark:bg-white/[0.03]">
                <td colSpan={4} className="px-4 py-3">
                  <GroundingDetails grounding={item.grounding} compact />
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FoundryIqContextPanel({ context }: { context: FoundryIqContextBundle }) {
  const groundedSources = getGroundedSources(context);
  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ContextMetric title="Framework guidance" count={context.frameworkGuidanceItems.length} />
        <ContextMetric title="Principles" count={context.principleItems.length} />
        <ContextMetric title="Trade-offs" count={context.tradeoffItems.length} />
        <ContextMetric title="Workspace memory" count={context.workspaceMemoryItems.length} />
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <MetaPanel title="Context Sources">
          <GroundedSourceList items={groundedSources} />
        </MetaPanel>
        <MetaPanel title="Workspace Memory">
          <div className="space-y-3">
            <ContextList title="Recurring findings" items={context.workspaceMemory.recurringFindings} />
            <ContextList title="Prior recommendations" items={context.workspaceMemory.priorRecommendations} />
            <ContextList title="ADR history" items={context.workspaceMemory.adrHistory} />
          </div>
        </MetaPanel>
      </div>
    </div>
  );
}

function ContextMetric({ title, count }: { title: string; count: number }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{count}</p>
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#dde1e6] bg-white p-4 dark:border-white/10 dark:bg-[#08101d]">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold text-secondary-950 dark:text-white">{value}</p>
    </div>
  );
}

function ContextCountBadge({ label, count }: { label: string; count: number }) {
  return <span className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-xs font-semibold text-secondary-700 dark:bg-white/10 dark:text-secondary-300">{label} {count}</span>;
}

function AgentStageBadge({ item }: { item: AgentExecutionTrace }) {
  const label = getAgentStageLabel(item);
  const tone = item.usedFoundry ? 'foundry' : label === 'Critic' ? 'critic' : label === 'Specialist' ? 'specialist' : 'default';
  const className = tone === 'foundry'
    ? 'bg-primary-50 text-primary-700 dark:bg-cyan-400/10 dark:text-cyan-100'
    : tone === 'critic'
      ? 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300'
      : tone === 'specialist'
        ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300'
        : 'bg-[#f4f6f8] text-secondary-700 dark:bg-white/10 dark:text-secondary-300';

  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>{label}</span>;
}

function getAgentStageLabel(item: AgentExecutionTrace) {
  const name = item.agentName.toLowerCase();
  if (item.usedFoundry || name.includes('foundry') || name.includes('retrieval')) return 'Foundry IQ';
  if (name.includes('critic') || name.includes('verifier')) return 'Critic';
  if (name.includes('composer')) return 'Composer';
  if (name.includes('scoring')) return 'Scoring';
  if (name.includes('adr')) return 'ADR';
  if (name.includes('well-architected') || name.includes('iso') || name.includes('owasp')) return 'Specialist';
  if (name.includes('context')) return 'Context';
  return 'Agent';
}

function ContextList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">
          {items.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400">No context captured.</p>
      )}
    </div>
  );
}

function GroundedSourceList({ items }: { items: Array<{ id: string; title: string; type: string; reason: string }> }) {
  if (items.length === 0) {
    return <p className="text-sm text-secondary-500 dark:text-secondary-400">No context captured.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-secondary-950 dark:text-white">{item.title}</p>
            <span className="rounded-full bg-[#f4f6f8] px-2 py-0.5 text-[11px] font-semibold text-secondary-700 dark:bg-white/10 dark:text-secondary-300">{item.type}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">{item.reason}</p>
        </div>
      ))}
    </div>
  );
}

function getGroundedSources(context: FoundryIqContextBundle) {
  return [
    ...context.frameworkGuidanceItems,
    ...context.principleItems,
    ...context.tradeoffItems,
    ...context.adrTemplateItems,
    ...context.workspaceMemoryItems,
  ]
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title,
      type: item.sourceType,
      reason: item.summary,
    }));
}

function GroundingDetails({ grounding, compact = false }: { grounding: GroundingReferenceSet; compact?: boolean }) {
  const [showCitations, setShowCitations] = useState(false);
  const sections = [
    { label: 'Frameworks', values: grounding.frameworkRefs },
    { label: 'Standards', values: grounding.standardRefs },
    { label: 'Principles', values: grounding.principleRefs },
    { label: 'Trade-offs', values: grounding.tradeoffRefs },
    { label: 'History', values: grounding.historyRefs },
    { label: 'Citations', values: showCitations ? grounding.citationRefs : grounding.citationRefs.slice(0, compact ? 1 : 2) },
  ].filter((section) => section.values.length > 0);

  if (sections.length === 0) {
    return <p className="text-xs text-secondary-500 dark:text-secondary-400">No grounding references captured.</p>;
  }

  return (
    <div className="space-y-3">
      <div className={`grid gap-3 ${compact ? 'md:grid-cols-2' : 'lg:grid-cols-3'}`}>
        {sections.map((section) => (
          <div key={section.label} className="rounded-lg border border-[#e5e7eb] bg-white p-3 dark:border-white/10 dark:bg-[#060B16]">
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{section.label}</p>
            <p className="mt-2 text-sm leading-6 text-secondary-700 dark:text-secondary-200">{section.values.join(', ')}</p>
          </div>
        ))}
      </div>
      {grounding.citationRefs.length > (compact ? 1 : 2) ? (
        <button
          type="button"
          onClick={() => setShowCitations((value) => !value)}
          className="rounded-full bg-[#f4f6f8] px-3 py-1.5 text-xs font-semibold text-secondary-700 hover:bg-[#e8ebef] dark:bg-white/10 dark:text-secondary-300 dark:hover:bg-white/15"
        >
          {showCitations ? 'Show fewer citations' : `Show all citations (${grounding.citationRefs.length})`}
        </button>
      ) : null}
    </div>
  );
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
