import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Table, ErrorState, LoadingState, EmptyState, ArrowLeftIcon, DiagramIcon, UploadIcon } from '../components';
import { useDiagrams, useDeleteDiagram } from '../hooks/useDiagrams';
import type { ArchitectureDiagram } from '../api/diagrams';

export function DiagramListPage() {
  const { orgId, organizationId, workspaceId } = useParams<{ orgId: string; organizationId: string; workspaceId: string }>();
  const resolvedOrgId = orgId ?? organizationId;
  const navigate = useNavigate();
  const { data: diagrams, isLoading, isError, refetch } = useDiagrams(resolvedOrgId, workspaceId);
  const deleteMutation = useDeleteDiagram();

  if (!workspaceId || !resolvedOrgId) {
    return (
      <ErrorState
        title="Invalid workspace"
        message="Please select a valid organization and workspace."
      />
    );
  }

  const handleDeleteDiagram = async (diagramId: string) => {
    if (confirm('Are you sure you want to delete this diagram?')) {
      try {
        await deleteMutation.mutateAsync(diagramId);
        refetch();
      } catch (error) {
        console.error('Failed to delete diagram:', error);
      }
    }
  };

  const handleSelectDiagram = (diagram: ArchitectureDiagram) => {
    navigate(`/orgs/${resolvedOrgId}/diagrams/${diagram.id}`);
  };

  if (isLoading) return <LoadingState message="Loading diagrams..." />;

  if (isError)
    return (
      <ErrorState
        title="Failed to load diagrams"
        message="An error occurred while fetching diagrams."
        action={
          <Button variant="primary" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );

  if (!diagrams || diagrams.length === 0) {
    return (
      <EmptyState
        title="No diagrams yet"
        description="Upload your first architecture diagram to get started."
        action={
          <Button
            onClick={() =>
              navigate(`/orgs/${resolvedOrgId}/workspaces/${workspaceId}/diagrams/upload`)
            }
            variant="primary"
            icon={<UploadIcon className="h-4 w-4" />}
          >
            Upload Diagram
          </Button>
        }
      />
    );
  }

  const columns = [
    {
      header: 'Title',
      accessor: 'name' as keyof ArchitectureDiagram,
      render: (value: string) => <span className="font-semibold text-secondary-950 dark:text-white">{value}</span>,
    },
    {
      header: 'Uploaded By',
      accessor: 'uploadedByUserId' as keyof ArchitectureDiagram,
      render: (value: string) => <span className="text-secondary-600 dark:text-secondary-400">{value}</span>,
    },
    {
      header: 'Upload Date',
      accessor: 'uploadedAt' as keyof ArchitectureDiagram,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      header: 'Architecture Score',
      accessor: 'architectureScore' as keyof ArchitectureDiagram,
      render: (value: any) => (
        <span className="rounded-full bg-primary-100 px-2 py-1 text-sm text-primary-800 dark:bg-cyan-400/10 dark:text-cyan-200">
          {value !== null && value !== undefined ? `${value.toFixed(1)}/100` : 'Not scored'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id' as keyof ArchitectureDiagram,
      render: (value: string) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSelectDiagram({ id: value } as any)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteDiagram(value)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-shell">
      <section className="page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate(`/orgs/${resolvedOrgId}/workspaces`)} className="mb-3" icon={<ArrowLeftIcon className="h-4 w-4" />}>
              Back
            </Button>
            <div className="flex items-center gap-4">
              <div className="glow-icon">
                <DiagramIcon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="page-title">Diagrams</h1>
                <p className="page-description mt-2">Upload architecture evidence and open any diagram to run AI analysis.</p>
              </div>
            </div>
          </div>
          <Button
            icon={<UploadIcon className="h-4 w-4" />}
            onClick={() =>
              navigate(`/orgs/${resolvedOrgId}/workspaces/${workspaceId}/diagrams/upload`)
            }
          >
            Upload Diagram
          </Button>
        </div>
      </section>

      <div>
        <Table columns={columns} data={diagrams} />
      </div>
    </div>
  );
}
