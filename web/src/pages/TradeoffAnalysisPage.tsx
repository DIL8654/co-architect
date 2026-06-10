import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Breadcrumbs, Button, Card, EmptyState, LoadingState } from '../components';
import { useDiagram } from '../hooks/useDiagrams';
import { useDiagramAnalysis } from '../hooks/useAnalysis';
import type { Tradeoff } from '../api/analysis';

type TradeoffCategory =
  | 'Security'
  | 'Scalability'
  | 'Availability'
  | 'Compliance'
  | 'Cost'
  | 'Operational Excellence'
  | 'Other';

interface TradeoffViewModel extends Tradeoff {
  category: TradeoffCategory;
  alternatives: string[];
}

const CATEGORY_ORDER: TradeoffCategory[] = [
  'Security',
  'Scalability',
  'Availability',
  'Operational Excellence',
  'Compliance',
  'Cost',
  'Other',
];

const CATEGORY_RULES: Array<{ category: TradeoffCategory; keywords: string[] }> = [
  { category: 'Security', keywords: ['security', 'auth', 'authorization', 'authentication', 'secret', 'encryption', 'tenant', 'key vault'] },
  { category: 'Scalability', keywords: ['scale', 'scalability', 'cache', 'queue', 'partition', 'throughput', 'load', 'redis', 'performance'] },
  { category: 'Availability', keywords: ['availability', 'backup', 'failover', 'disaster recovery', 'rto', 'rpo', 'redund', 'resilience', 'zone'] },
  { category: 'Operational Excellence', keywords: ['operat', 'monitor', 'logging', 'observability', 'runbook', 'automation', 'deployment'] },
  { category: 'Compliance', keywords: ['compliance', 'gdpr', 'soc2', 'iso', 'governance', 'retention', 'privacy', 'audit'] },
  { category: 'Cost', keywords: ['cost', 'budget', 'spend', 'optimization', 'rightsizing', 'efficiency', 'expense'] },
];

const CATEGORY_VARIANTS: Record<TradeoffCategory, 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
  Security: 'error',
  Scalability: 'primary',
  Availability: 'success',
  Compliance: 'warning',
  Cost: 'secondary',
  'Operational Excellence': 'primary',
  Other: 'secondary',
};

const CATEGORY_ALTERNATIVES: Record<TradeoffCategory, string[]> = {
  Security: ['Managed identity and Key Vault', 'Zero-trust network segmentation', 'Policy-as-code guardrails'],
  Scalability: ['Redis caching', 'CDN caching', 'Queue-based scale-out', 'Database tuning and indexing'],
  Availability: ['Zone-redundant deployment', 'Active-active failover', 'Azure Backup + Site Recovery'],
  Compliance: ['Azure Policy enforcement', 'Microsoft Purview data governance', 'Centralized audit logging'],
  Cost: ['Database tuning before scale-out', 'Serverless tiers', 'Reserved capacity planning'],
  'Operational Excellence': ['Managed services over self-hosted components', 'Automated deployment pipelines', 'Centralized monitoring and runbooks'],
  Other: ['Prototype both options', 'Validate with a small pilot', 'Revisit after workload metrics stabilize'],
};

const categoryColor = (category: TradeoffCategory) => CATEGORY_VARIANTS[category];

const normalizeText = (value: string) => value.toLowerCase();

const inferCategory = (tradeoff: Tradeoff): TradeoffCategory => {
  const text = normalizeText(tradeoff.scenario);

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.category;
    }
  }

  return 'Other';
};

const getAlternatives = (tradeoff: Tradeoff, category: TradeoffCategory) => {
  const scenario = normalizeText(tradeoff.scenario);

  if (scenario.includes('redis') || scenario.includes('cache')) {
    return ['Database tuning', 'CDN caching', 'Query optimization'];
  }

  if (scenario.includes('failover') || scenario.includes('backup')) {
    return ['Zone redundancy', 'Cross-region replication', 'Disaster recovery runbooks'];
  }

  if (scenario.includes('security') || scenario.includes('encryption') || scenario.includes('auth')) {
    return ['Managed identity', 'Azure Key Vault', 'Network segmentation'];
  }

  return CATEGORY_ALTERNATIVES[category];
};

export function TradeoffAnalysisPage() {
  const { orgId, organizationId, workspaceId, diagramId } = useParams<{
    orgId: string;
    organizationId: string;
    workspaceId: string;
    diagramId: string;
  }>();
  const resolvedOrgId = orgId ?? organizationId;
  const navigate = useNavigate();

  const { data: diagram, isLoading: isDiagramLoading, isError: isDiagramError } = useDiagram(diagramId!);
  const { data: analysis, isLoading: isAnalysisLoading } = useDiagramAnalysis(diagramId!);

  const groupedTradeoffs = useMemo(() => {
    const tradeoffs = analysis?.tradeoffs ?? [];

    const mapped = tradeoffs.map((tradeoff) => ({
      ...tradeoff,
      category: inferCategory(tradeoff),
      alternatives: getAlternatives(tradeoff, inferCategory(tradeoff)),
    }));

    return CATEGORY_ORDER.reduce<Record<TradeoffCategory, TradeoffViewModel[]>>((accumulator, category) => {
      accumulator[category] = mapped.filter((tradeoff) => tradeoff.category === category);
      return accumulator;
    }, {
      Security: [],
      Scalability: [],
      Availability: [],
      'Operational Excellence': [],
      Compliance: [],
      Cost: [],
      Other: [],
    });
  }, [analysis?.tradeoffs]);

  if (!resolvedOrgId || !workspaceId || !diagramId) {
    return (
      <EmptyState
        title="Invalid tradeoff analysis request"
        description="Organization ID, workspace ID, or diagram ID is missing."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  if (isDiagramLoading || isAnalysisLoading) {
    return <LoadingState message="Loading tradeoffs..." />;
  }

  if (isDiagramError || !diagram) {
    return (
      <EmptyState
        title="Diagram not found"
        description="We could not load the diagram for this tradeoff view."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  const tradeoffCount = analysis?.tradeoffs?.length ?? 0;
  const categoryCount = Object.values(groupedTradeoffs).filter((items) => items.length > 0).length;

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs
          items={[
            { label: 'Organizations', to: '/organizations' },
            { label: 'Diagram', to: `/orgs/${resolvedOrgId}/diagrams/${diagramId}` },
            { label: 'Trade-off Analysis' },
          ]}
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">Trade-off Analysis</h1>
            <p className="page-description">
              Decision, pros, cons, and alternatives for {diagram.name}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/orgs/${resolvedOrgId}/diagrams/${diagramId}`)}
            >
              Back to Diagram
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/orgs/${resolvedOrgId}/workspaces/${workspaceId}/diagrams/${diagramId}/recommendations`)}
            >
              Recommendation Table
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="kpi-tile">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Tradeoffs</p>
          <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{tradeoffCount}</p>
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">Total tradeoff decisions identified</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Categories</p>
          <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{categoryCount}</p>
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">Grouped by architectural concern</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Analysis Status</p>
          <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{analysis?.status ?? '—'}</p>
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">Latest diagram analysis state</p>
        </div>
      </div>

      {tradeoffCount === 0 ? (
        <EmptyState
          title="No tradeoffs detected"
          description="Run analysis to see architectural tradeoffs, alternatives, and decision notes."
          action={
            <Button onClick={() => navigate(`/orgs/${resolvedOrgId}/diagrams/${diagramId}`)}>
              Go to Diagram
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {CATEGORY_ORDER.map((category) => {
            const items = groupedTradeoffs[category];

            if (items.length === 0) {
              return null;
            }

            return (
              <Card key={category} header={category}>
                <div className="space-y-4">
                  {items.map((tradeoff, index) => (
                    <div key={`${category}-${index}`} className="rounded-xl border border-secondary-200 bg-white p-4">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 pb-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Decision</p>
                          <h3 className="text-lg font-semibold text-secondary-900">{tradeoff.scenario}</h3>
                        </div>
                        <Badge variant={categoryColor(category)}>{category}</Badge>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-3">
                        <div>
                          <p className="mb-2 text-sm font-semibold text-secondary-900">Pros</p>
                          <ul className="space-y-2 text-sm text-secondary-700">
                            {tradeoff.pros.map((item, prosIndex) => (
                              <li key={`${item}-${prosIndex}`} className="flex gap-2">
                                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-success-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-semibold text-secondary-900">Cons</p>
                          <ul className="space-y-2 text-sm text-secondary-700">
                            {tradeoff.cons.map((item, consIndex) => (
                              <li key={`${item}-${consIndex}`} className="flex gap-2">
                                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-error-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-semibold text-secondary-900">Alternatives</p>
                          <ul className="space-y-2 text-sm text-secondary-700">
                            {tradeoff.alternatives.map((item, altIndex) => (
                              <li key={`${item}-${altIndex}`} className="flex gap-2">
                                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
