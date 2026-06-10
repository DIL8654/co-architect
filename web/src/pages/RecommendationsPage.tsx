import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Breadcrumbs, Button, Card, EmptyState, LoadingState } from '../components';
import { useDiagram } from '../hooks/useDiagrams';
import { useDiagramAnalysis } from '../hooks/useAnalysis';
import type { MissingControl } from '../api/analysis';

type RecommendationCategory = 'Security' | 'Scalability' | 'Availability' | 'Compliance' | 'Cost';
type SortField = 'severity' | 'impact';
type SortDirection = 'desc' | 'asc';
type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

interface RecommendationRow {
  id: string;
  category: RecommendationCategory;
  severity: Severity;
  severityRank: number;
  impact: string;
  impactRank: number;
  finding: string;
  recommendation: string;
  suggestedAzureServices: string[];
}

interface CategoryRule {
  category: RecommendationCategory;
  keywords: string[];
  services: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Security',
    keywords: ['security', 'auth', 'authorization', 'authentication', 'secret', 'encryption', 'identity', 'key vault', 'audit', 'tenant'],
    services: ['Microsoft Entra ID', 'Azure Key Vault', 'Azure Firewall', 'Azure Front Door', 'Microsoft Defender for Cloud'],
  },
  {
    category: 'Scalability',
    keywords: ['scal', 'performance', 'throughput', 'cache', 'queue', 'partition', 'load', 'autoscale', 'redis'],
    services: ['Azure Cache for Redis', 'Azure Service Bus', 'Azure Event Hubs', 'Azure App Service Autoscale', 'Azure Kubernetes Service'],
  },
  {
    category: 'Availability',
    keywords: ['availability', 'backup', 'failover', 'disaster recovery', 'dr', 'rto', 'rpo', 'redund', 'replication', 'resilience'],
    services: ['Azure Backup', 'Azure Site Recovery', 'Availability Zones', 'Azure Traffic Manager', 'Azure Application Gateway'],
  },
  {
    category: 'Compliance',
    keywords: ['compliance', 'gdpr', 'soc2', 'iso', 'retention', 'deletion', 'governance', 'privacy', 'audit'],
    services: ['Microsoft Purview', 'Azure Policy', 'Azure Monitor', 'Azure Key Vault', 'Microsoft Defender for Cloud'],
  },
  {
    category: 'Cost',
    keywords: ['cost', 'expense', 'budget', 'optimization', 'rightsize', 'efficiency', 'spend', 'savings'],
    services: ['Azure Cost Management + Billing', 'Azure Advisor', 'Azure Monitor', 'Azure App Service Plans', 'Azure SQL Database Serverless'],
  },
];

const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const CATEGORY_ORDER: RecommendationCategory[] = ['Security', 'Scalability', 'Availability', 'Compliance', 'Cost'];

const SEVERITY_OPTIONS: Severity[] = ['Critical', 'High', 'Medium', 'Low'];

const inferSeverity = (text: string): Severity => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('critical') || lowerText.includes('severe') || lowerText.includes('urgent')) {
    return 'Critical';
  }

  if (lowerText.includes('high') || lowerText.includes('significant') || lowerText.includes('major')) {
    return 'High';
  }

  if (lowerText.includes('medium') || lowerText.includes('moderate')) {
    return 'Medium';
  }

  return 'Low';
};

const inferCategory = (control: MissingControl): RecommendationCategory => {
  const searchableText = `${control.name} ${control.impact} ${control.recommendation}`.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => searchableText.includes(keyword))) {
      return rule.category;
    }
  }

  return 'Security';
};

const inferAzureServices = (category: RecommendationCategory) =>
  CATEGORY_RULES.find((rule) => rule.category === category)?.services ?? [];

const getImpactRank = (impact: string) => {
  const lowerImpact = impact.toLowerCase();

  if (lowerImpact.includes('critical') || lowerImpact.includes('severe')) {
    return 4;
  }

  if (lowerImpact.includes('high')) {
    return 3;
  }

  if (lowerImpact.includes('medium') || lowerImpact.includes('moderate')) {
    return 2;
  }

  return 1;
};

const getSeverityVariant = (severity: Severity) => {
  switch (severity) {
    case 'Critical':
      return 'error';
    case 'High':
      return 'warning';
    case 'Medium':
      return 'primary';
    case 'Low':
    default:
      return 'secondary';
  }
};

const getCategoryVariant = (category: RecommendationCategory) => {
  switch (category) {
    case 'Security':
      return 'error';
    case 'Scalability':
      return 'primary';
    case 'Availability':
      return 'success';
    case 'Compliance':
      return 'warning';
    case 'Cost':
    default:
      return 'secondary';
  }
};

export function RecommendationsPage() {
  const { orgId, organizationId, workspaceId, diagramId } = useParams<{
    orgId: string;
    organizationId: string;
    workspaceId: string;
    diagramId: string;
  }>();
  const resolvedOrgId = orgId ?? organizationId;
  const navigate = useNavigate();

  const [selectedCategories, setSelectedCategories] = useState<RecommendationCategory[]>([]);
  const [sortField, setSortField] = useState<SortField>('severity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data: diagram, isLoading: isDiagramLoading, isError: isDiagramError } = useDiagram(diagramId!);
  const { data: analysis, isLoading: isAnalysisLoading } = useDiagramAnalysis(diagramId!);

  const rows = useMemo<RecommendationRow[]>(() => {
    if (!analysis?.missingControls?.length) {
      return [];
    }

    return analysis.missingControls.map((control, index) => {
      const category = inferCategory(control);
      const severity = inferSeverity(`${control.name} ${control.impact} ${control.recommendation}`);
      return {
        id: `${diagramId}-${index}`,
        category,
        severity,
        severityRank: SEVERITY_RANK[severity],
        impact: control.impact,
        impactRank: getImpactRank(control.impact),
        finding: control.name,
        recommendation: control.recommendation,
        suggestedAzureServices: inferAzureServices(category),
      };
    });
  }, [analysis?.missingControls, diagramId]);

  const filteredRows = useMemo(() => {
    const categoryFiltered = selectedCategories.length > 0
      ? rows.filter((row) => selectedCategories.includes(row.category))
      : rows;

    return [...categoryFiltered].sort((left, right) => {
      const fieldComparison =
        sortField === 'severity'
          ? left.severityRank - right.severityRank
          : left.impactRank - right.impactRank;

      return sortDirection === 'desc' ? fieldComparison * -1 : fieldComparison;
    });
  }, [rows, selectedCategories, sortField, sortDirection]);

  const toggleCategory = (category: RecommendationCategory) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const clearFilters = () => setSelectedCategories([]);

  if (!resolvedOrgId || !workspaceId || !diagramId) {
    return (
      <EmptyState
        title="Invalid recommendations request"
        description="Organization ID, workspace ID, or diagram ID is missing."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  if (isDiagramLoading || isAnalysisLoading) {
    return <LoadingState message="Loading recommendations..." />;
  }

  if (isDiagramError || !diagram) {
    return (
      <EmptyState
        title="Diagram not found"
        description="We could not load the diagram for this recommendations view."
        action={<Button onClick={() => navigate(-1)}>Go Back</Button>}
      />
    );
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs
          items={[
            { label: 'Organizations', to: '/organizations' },
            { label: 'Diagram', to: `/orgs/${resolvedOrgId}/diagrams/${diagramId}` },
            { label: 'Recommendations' },
          ]}
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">Recommendations</h1>
            <p className="page-description">
              Table view of missing components and recommended improvements for {diagram.name}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate(`/orgs/${resolvedOrgId}/diagrams/${diagramId}`)}>
              Back to Diagram
            </Button>
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="kpi-tile">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Missing Components</p>
          <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{rows.length}</p>
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">Findings identified by the analysis</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Filtered Results</p>
          <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{filteredRows.length}</p>
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">Rows shown after filters and sorting</p>
        </div>
        <div className="kpi-tile">
          <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Current Score</p>
          <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{analysis?.finalScore?.toFixed(1) ?? '—'}</p>
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{analysis?.scoreBand ?? 'No score band available'}</p>
        </div>
      </div>

      <Card header="Filters and Sorting">
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-secondary-900">Filter by Category</h2>
              <span className="text-xs text-secondary-500">Multiple categories supported</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ORDER.map((category) => {
                const active = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      active
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-50'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-secondary-900">Sort by</span>
              <select
                value={sortField}
                onChange={(event) => setSortField(event.target.value as SortField)}
                className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900"
              >
                <option value="severity">Severity</option>
                <option value="impact">Impact</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-semibold text-secondary-900">Order</span>
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                className="w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900"
              >
                <option value="desc">Highest first</option>
                <option value="asc">Lowest first</option>
              </select>
            </label>
          </div>
        </div>
      </Card>

      <Card header={`Missing Components (${filteredRows.length})`}>
        {filteredRows.length === 0 ? (
          <EmptyState
            title="No missing components match the current filters"
            description="Try clearing the filters or select another category."
            action={<Button onClick={clearFilters}>Clear Filters</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Finding</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Recommendation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-600">Suggested Azure Services</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200 bg-white">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-secondary-50/70">
                    <td className="px-4 py-4">
                      <Badge variant={getSeverityVariant(row.severity)}>{row.severity}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getCategoryVariant(row.category)}>{row.category}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-secondary-900">{row.finding}</p>
                      <p className="mt-1 text-sm text-secondary-600">Impact: {row.impact}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-secondary-700">{row.recommendation}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {row.suggestedAzureServices.map((service) => (
                          <span
                            key={service}
                            className="rounded-full border border-secondary-200 bg-secondary-50 px-3 py-1 text-xs font-medium text-secondary-700"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
