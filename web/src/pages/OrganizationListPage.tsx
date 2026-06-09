import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Breadcrumbs, BuildingIcon, Button, EmptyState, ErrorState, LoadingState, PlusIcon, WorkspaceIcon } from '../components';
import { useOrganizations } from '../hooks/useOrganizations';
import type { Organization } from '../api/organizations';

export function OrganizationListPage() {
  const navigate = useNavigate();
  const { data: organizations, isLoading, isError, refetch } = useOrganizations();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);

  const selectedOrganization = useMemo(() => {
    if (!organizations || organizations.length === 0) return null;
    return organizations.find((organization) => organization.id === selectedOrganizationId) ?? organizations[0];
  }, [organizations, selectedOrganizationId]);

  if (isLoading) return <LoadingState message="Loading organizations..." />;

  if (isError) {
    return (
      <ErrorState
        title="Failed to load organizations"
        message="An error occurred while fetching your organizations."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="page-shell">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Organizations' }]} />
        </div>
        <EmptyState
          title="No organizations yet"
          description="Create your first organization to start mapping architecture workspaces."
          action={
            <Button onClick={() => navigate('/organizations/new')} icon={<PlusIcon className="h-4 w-4" />}>
              Create Organization
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mb-2">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Organizations' }]} />
      </div>

      <section className="grid min-h-[calc(100vh-142px)] overflow-hidden rounded-2xl border border-secondary-200 bg-white/[0.74] shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-secondary-200 bg-secondary-50/80 p-4 dark:border-white/10 dark:bg-[#080F1F]/60 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-secondary-950 dark:text-white">Organizations</h1>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">{organizations.length} workspaces hub{organizations.length === 1 ? '' : 's'}</p>
            </div>
            <Button size="sm" onClick={() => navigate('/organizations/new')} aria-label="Create organization" icon={<PlusIcon className="h-4 w-4" />}>
              New
            </Button>
          </div>

          <div className="space-y-2">
            {organizations.map((organization) => (
              <button
                key={organization.id}
                type="button"
                onClick={() => setSelectedOrganizationId(organization.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  selectedOrganization?.id === organization.id
                    ? 'border-primary-200 bg-white shadow-sm dark:border-cyan-300/25 dark:bg-cyan-400/10'
                    : 'border-transparent hover:border-secondary-200 hover:bg-white/80 dark:hover:border-white/10 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="glow-icon h-9 w-9 shrink-0">
                    <BuildingIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-secondary-950 dark:text-white">{organization.name}</p>
                    <p className="truncate text-xs text-secondary-500 dark:text-secondary-400">{organization.slug}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="relative overflow-hidden p-5 lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)]" />

          {selectedOrganization && (
            <div className="relative space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-500 dark:text-secondary-400">Selected organization</p>
                  <h2 className="mt-1 text-4xl font-bold tracking-normal text-secondary-950 dark:text-white">{selectedOrganization.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{selectedOrganization.slug}</Badge>
                    <Badge>{selectedOrganization.memberCount} member{selectedOrganization.memberCount === 1 ? '' : 's'}</Badge>
                    <Badge variant="secondary">Created {new Date(selectedOrganization.createdAt).toLocaleDateString()}</Badge>
                  </div>
                </div>
                <Button onClick={() => navigate(`/orgs/${selectedOrganization.id}/workspaces`)} icon={<WorkspaceIcon className="h-4 w-4" />}>
                  Open workspaces
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MetricTile label="Members" value={selectedOrganization.memberCount.toString()} />
                <MetricTile label="Organization slug" value={selectedOrganization.slug} />
                <MetricTile label="Next step" value="Workspaces" />
              </div>

              <div className="rounded-2xl border border-secondary-200 bg-white/[0.82] p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#080F1F]/70">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-secondary-950 dark:text-white">Architecture workspace canvas</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary-600 dark:text-secondary-300">
                      Open the organization to create workspaces, upload diagrams, and run Architecture Intelligence analysis with maximum diagram viewing space.
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => navigate('/settings')}>
                    AI settings
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-secondary-200 bg-white/[0.84] p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#080F1F]/70">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-secondary-950 dark:text-white">{value}</p>
    </div>
  );
}
