import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumbs, BuildingIcon, Button, EmptyState, ErrorState, LoadingState, PlusIcon } from '../components';
import type { Organization } from '../api/organizations';
import { useOrganizationSwitcher } from '../hooks/useOrganizationSwitcher';
import { useOrganizations } from '../hooks/useOrganizations';

export function OrganizationListPage() {
  const navigate = useNavigate();
  const { organizationId, setOrganizationId } = useOrganizationSwitcher();
  const { data: organizations, isLoading, isError, refetch } = useOrganizations();
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(organizationId || null);

  const selectedOrganization = useMemo(() => {
    if (!organizations || organizations.length === 0) return null;
    const targetId = selectedOrganizationId ?? organizationId;
    return organizations.find((organization) => organization.id === targetId) ?? organizations[0];
  }, [organizationId, organizations, selectedOrganizationId]);

  if (isLoading) return <LoadingState message="Loading organizations..." />;

  if (isError) {
    return (
      <ErrorState
        title="Failed to load organizations"
        message="An error occurred while fetching organizations."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="page-shell">
        <div className="mb-4">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Organizations' }]} />
        </div>
        <EmptyState
          title="No organizations yet"
          description="Create an organization to start structuring workspaces, diagrams, and architecture reviews."
          action={
            <Button onClick={() => navigate('/organizations/new')} icon={<PlusIcon className="h-4 w-4" />}>
              Create Organization
            </Button>
          }
        />
      </div>
    );
  }

  const handleSelect = (organization: Organization) => {
    setSelectedOrganizationId(organization.id);
    setOrganizationId(organization.id);
  };

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Organizations' }]} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">Organizations</h1>
            <p className="page-description">
              Set the active organization context here, then use the left navigation tree to move into workspaces and diagrams.
            </p>
          </div>
          <Button onClick={() => navigate('/organizations/new')} icon={<PlusIcon className="h-4 w-4" />}>
            Create Organization
          </Button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_360px]">
        <div className="overflow-hidden rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
          <table className="w-full">
            <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Members</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Created</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => {
                const isSelected = selectedOrganization?.id === organization.id;
                return (
                  <tr
                    key={organization.id}
                    onClick={() => handleSelect(organization)}
                    className={`cursor-pointer border-b border-[#eef1f4] transition last:border-0 dark:border-white/10 ${
                      isSelected ? 'bg-primary-50/70 dark:bg-cyan-400/10' : 'hover:bg-[#f8f9fb] dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="glow-icon h-9 w-9">
                          <BuildingIcon className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-secondary-950 dark:text-white">{organization.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{organization.slug}</td>
                    <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{organization.memberCount}</td>
                    <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">
                      {new Date(organization.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside className="space-y-4 rounded-xl border border-[#dde1e6] bg-white p-5 dark:border-white/10 dark:bg-[#08101d]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Selected organization</p>
            <h2 className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">
              {selectedOrganization?.name ?? 'No organization selected'}
            </h2>
          </div>

          {selectedOrganization ? (
            <>
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="Slug" value={selectedOrganization.slug} />
                <InfoItem label="Members" value={String(selectedOrganization.memberCount)} />
                <InfoItem label="Created" value={new Date(selectedOrganization.createdAt).toLocaleDateString()} />
                <InfoItem label="Next step" value="Open a workspace from the sidebar" />
              </dl>

              <div className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4 text-sm leading-6 text-secondary-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-secondary-300">
                The active organization drives the navigation tree in the left sidebar. Once selected, use that tree to browse workspaces and diagrams without bouncing through extra launcher buttons.
              </div>
            </>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-3 dark:border-white/10 dark:bg-white/[0.03]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-secondary-900 dark:text-white">{value}</dd>
    </div>
  );
}
