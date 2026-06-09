import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, DiagramIcon, HealthIcon, LogoMark, SettingsIcon, SparkIcon } from '../components';
import { organizationApi } from '../api/organizations';
import { workspaceApi } from '../api/workspaces';
import { diagramApi, type ArchitectureDiagram } from '../api/diagrams';

const sampleDescription =
  'A B2B SaaS platform with React frontend, .NET API, cloud database, Blob Storage, no API gateway, no monitoring, no tenant isolation, no audit logging, no disaster recovery plan, and no secrets management.';

interface ArchitectureOverview {
  organizationCount: number;
  workspaceCount: number;
  diagrams: Array<ArchitectureDiagram & { organizationId: string; workspaceName: string }>;
}

export function LandingPage() {
  const navigate = useNavigate();
  const { data: overview, isLoading } = useQuery({
    queryKey: ['architecture-overview'],
    queryFn: loadArchitectureOverview,
    refetchOnWindowFocus: false,
  });

  const diagrams = overview?.diagrams ?? [];
  const scoredDiagrams = diagrams.filter((diagram) => diagram.architectureScore !== null && diagram.architectureScore !== undefined);
  const averageScore = scoredDiagrams.length
    ? scoredDiagrams.reduce((total, diagram) => total + (diagram.architectureScore ?? 0), 0) / scoredDiagrams.length
    : null;
  const latestDiagrams = [...diagrams].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).slice(0, 4);

  if (isLoading) {
    return <LandingShell />;
  }

  if (!diagrams.length) {
    return (
      <LandingShell>
        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-secondary-500 dark:text-secondary-400">Start flow</p>
              <h2 className="mt-1 text-2xl font-bold text-secondary-950 dark:text-white">No diagrams yet</h2>
            </div>
            <p className="text-sm leading-6 text-secondary-600 dark:text-secondary-300">
              Create an organization, create a workspace, then upload an architecture description or diagram to generate your first Architecture Intelligence Score.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniFeature icon={<DiagramIcon className="h-4 w-4" />} label="Create" />
              <MiniFeature icon={<SparkIcon className="h-4 w-4" />} label="Analyze" />
              <MiniFeature icon={<HealthIcon className="h-4 w-4" />} label="Improve" />
            </div>
            <div className="rounded-2xl border border-secondary-200 bg-secondary-50/80 p-4 text-sm leading-6 text-secondary-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-secondary-300">
              {sampleDescription}
            </div>
            <Button onClick={() => navigate('/organizations')} icon={<SparkIcon className="h-4 w-4" />}>
              Start architecture review
            </Button>
          </div>
        </Card>
      </LandingShell>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <section className="flex flex-col gap-5 py-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-5 flex items-center gap-4">
            <span className="logo-shell h-12 w-12">
              <LogoMark className="h-10 w-10" />
            </span>
            <Badge variant="secondary">Architecture dashboard</Badge>
          </div>
          <h1 className="text-4xl font-bold tracking-normal text-secondary-950 dark:text-white">Architecture Intelligence</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary-600 dark:text-secondary-300">
            Your active architecture reviews, maturity score coverage, and latest diagrams.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/organizations')} icon={<DiagramIcon className="h-4 w-4" />}>
            Open canvas
          </Button>
          <Button variant="secondary" onClick={() => navigate('/health')}>
            Infra health
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <DashboardMetric label="Organizations" value={overview?.organizationCount ?? 0} />
        <DashboardMetric label="Workspaces" value={overview?.workspaceCount ?? 0} />
        <DashboardMetric label="Diagrams" value={diagrams.length} />
        <DashboardMetric label="Average Score" value={averageScore === null ? '—' : averageScore.toFixed(1)} accent />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card header="Recent Diagrams">
          <div className="grid gap-3">
            {latestDiagrams.map((diagram) => (
              <button
                key={diagram.id}
                type="button"
                onClick={() => navigate(`/orgs/${diagram.organizationId}/diagrams/${diagram.id}`)}
                className="rounded-2xl border border-secondary-200 bg-secondary-50/70 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-secondary-950 dark:text-white">{diagram.name}</p>
                    <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{diagram.workspaceName}</p>
                  </div>
                  <Badge variant={diagram.architectureScore !== null && diagram.architectureScore !== undefined ? 'primary' : 'secondary'}>
                    {diagram.architectureScore !== null && diagram.architectureScore !== undefined ? `${diagram.architectureScore.toFixed(1)}/100` : 'Not scored'}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card header="Maturity Levels">
          <div className="space-y-4">
            <MaturityBar label="Scored coverage" value={diagrams.length ? (scoredDiagrams.length / diagrams.length) * 100 : 0} />
            <MaturityBar label="Average maturity" value={averageScore ?? 0} />
            <p className="text-sm leading-6 text-secondary-600 dark:text-secondary-300">
              Open any diagram to view dimension scores, missing controls, roadmap items, and analysis evidence in the insights drawer.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}

function LandingShell({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="page-shell flex min-h-[calc(100vh-120px)] items-center">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <div className="mb-6 flex items-center gap-4">
            <span className="logo-shell h-14 w-14">
              <LogoMark className="h-11 w-11" />
            </span>
            <span className="rounded-full border border-secondary-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-600 dark:border-white/10 dark:bg-white/5 dark:text-cyan-200">
              Enterprise architecture review
            </span>
          </div>
          <h1 className="max-w-4xl text-5xl font-bold tracking-normal text-secondary-950 dark:text-white">CoArchitect AI</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-secondary-600 dark:text-secondary-300">
            Review a software architecture, calculate its Architecture Intelligence Score, and turn missing capabilities into clear recommendations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/organizations')} icon={<SparkIcon className="h-5 w-5" />}>
              Start
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/settings')}>
              AI Settings
            </Button>
          </div>
        </div>

        {children ?? (
          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-secondary-500 dark:text-secondary-400">Loading</p>
                <h2 className="mt-1 text-2xl font-bold text-secondary-950 dark:text-white">Preparing workspace overview</h2>
              </div>
              <p className="text-sm leading-6 text-secondary-600 dark:text-secondary-300">
                Checking organizations, workspaces, and diagrams.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function MiniFeature({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm font-semibold text-secondary-700 dark:border-white/10 dark:bg-white/[0.05] dark:text-secondary-200">
      <span className="text-primary-600 dark:text-cyan-200">{icon}</span>
      {label}
    </div>
  );
}

function DashboardMetric({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm backdrop-blur-xl ${accent ? 'border-primary-200 bg-primary-50 dark:border-cyan-300/20 dark:bg-cyan-400/10' : 'border-secondary-200 bg-white/[0.84] dark:border-white/10 dark:bg-white/5'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-secondary-950 dark:text-white">{value}</p>
    </div>
  );
}

function MaturityBar({ label, value }: { label: string; value: number }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-secondary-950 dark:text-white">{label}</span>
        <span className="text-secondary-500 dark:text-secondary-400">{bounded.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary-200 dark:bg-white/10">
        <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-cyan-400" style={{ width: `${bounded}%` }} />
      </div>
    </div>
  );
}

async function loadArchitectureOverview(): Promise<ArchitectureOverview> {
  const organizations = await organizationApi.listOrganizations();
  const workspaceGroups = await Promise.all(
    organizations.map(async (organization) => ({
      organization,
      workspaces: await workspaceApi.listWorkspaces(organization.id),
    })),
  );

  const diagramGroups = await Promise.all(
    workspaceGroups.flatMap(({ organization, workspaces }) =>
      workspaces.map(async (workspace) => ({
        organizationId: organization.id,
        workspaceName: workspace.name,
        diagrams: await diagramApi.listDiagrams(organization.id, workspace.id),
      })),
    ),
  );

  return {
    organizationCount: organizations.length,
    workspaceCount: workspaceGroups.reduce((total, group) => total + group.workspaces.length, 0),
    diagrams: diagramGroups.flatMap((group) =>
      group.diagrams.map((diagram) => ({
        ...diagram,
        organizationId: group.organizationId,
        workspaceName: group.workspaceName,
      })),
    ),
  };
}
