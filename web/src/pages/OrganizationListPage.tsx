import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Table, Badge, EmptyState, LoadingState, ErrorState } from '../components';
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
      <div className="space-y-4">
        <EmptyState
          title="No organizations yet"
          description="Create your first organization to get started."
          action={
            <Button onClick={() => navigate('/organizations/new')} variant="primary">
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
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      header: 'Slug',
      accessor: 'slug' as keyof Organization,
      render: (value: string) => <code className="text-sm bg-secondary-100 px-2 py-1 rounded">{value}</code>,
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-secondary-900">Organizations</h1>
        <Button onClick={() => navigate('/organizations/new')}>
          New Organization
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={organizations} />
      </Card>
    </div>
  );
}
