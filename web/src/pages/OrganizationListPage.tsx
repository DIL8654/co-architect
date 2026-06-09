import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Table, Badge, EmptyState, LoadingState, ErrorState, BuildingIcon, PlusIcon } from '../components';
import { useOrganizations } from '../hooks/useOrganizations';
import type { Organization } from '../api/organizations';

export function OrganizationListPage() {
  const navigate = useNavigate();
  const { data: organizations, isLoading, isError, refetch } = useOrganizations();

  if (isLoading) return <LoadingState message="Loading organizations..." />;

  if (isError)
    return (
      <ErrorState
        title="Failed to load organizations"
        message="An error occurred while fetching your organizations."
        action={
          <Button variant="primary" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );

  if (!organizations || organizations.length === 0) {
    return (
      <div className="page-shell">
        <EmptyState
          title="No organizations yet"
          description="Create your first organization to get started."
          action={
            <Button onClick={() => navigate('/organizations/new')} variant="primary" icon={<PlusIcon className="h-4 w-4" />}>
              Create Organization
            </Button>
          }
        />
      </div>
    );
  }

  const columns = [
    {
      header: 'Name',
      accessor: 'name' as keyof Organization,
      render: (value: string) => <span className="font-semibold text-secondary-950 dark:text-white">{value}</span>,
    },
    {
      header: 'Slug',
      accessor: 'slug' as keyof Organization,
      render: (value: string) => <code className="rounded-lg bg-secondary-100 px-2 py-1 text-sm text-secondary-700 dark:bg-white/10 dark:text-secondary-200">{value}</code>,
    },
    {
      header: 'Members',
      accessor: 'memberCount' as keyof Organization,
      render: (value: number) => <Badge>{value} member{value !== 1 ? 's' : ''}</Badge>,
    },
    {
      header: 'Created',
      accessor: 'createdAt' as keyof Organization,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: 'id' as keyof Organization,
      render: (value: string) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/orgs/${value}/workspaces`)}
          >
            Workspaces
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-shell">
      <section className="page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="glow-icon">
              <BuildingIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="page-title">Organizations</h1>
              <p className="page-description mt-2">Create an organization, then move into workspaces and architecture diagrams.</p>
            </div>
          </div>
          <Button onClick={() => navigate('/organizations/new')} icon={<PlusIcon className="h-4 w-4" />}>
          New Organization
          </Button>
        </div>
      </section>

      <Card>
        <Table columns={columns} data={organizations} />
      </Card>
    </div>
  );
}
