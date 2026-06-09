import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumbs, Button, ErrorState, LoadingState, EmptyState, DiagramIcon, UploadIcon } from '../components';
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

  return (
    <div className="page-shell">
      <section className="page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-4">
              <Breadcrumbs
                items={[
                  { label: 'Organizations', to: '/organizations' },
                  { label: 'Workspaces', to: `/orgs/${resolvedOrgId}/workspaces` },
                  { label: 'Diagrams' },
                ]}
              />
            </div>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {diagrams.map((diagram) => (
          <article
            key={diagram.id}
            className="group overflow-hidden rounded-2xl border border-secondary-200 bg-white/[0.86] shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
          >
            <button type="button" onClick={() => handleSelectDiagram(diagram)} className="block w-full p-5 text-left">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="glow-icon">
                  <DiagramIcon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-800 dark:bg-cyan-400/10 dark:text-cyan-200">
                  {diagram.architectureScore !== null && diagram.architectureScore !== undefined ? `${diagram.architectureScore.toFixed(1)}/100` : 'Not scored'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-secondary-950 dark:text-white">{diagram.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-secondary-600 dark:text-secondary-300">
                {diagram.description || diagram.originalFileName || 'Architecture diagram'}
              </p>
              <p className="mt-4 text-xs text-secondary-500 dark:text-secondary-400">
                Uploaded {new Date(diagram.uploadedAt).toLocaleDateString()}
              </p>
            </button>
            <div className="flex items-center justify-between border-t border-secondary-200 px-5 py-3 dark:border-white/10">
              <Button size="sm" variant="ghost" onClick={() => handleSelectDiagram(diagram)}>
                Open
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDeleteDiagram(diagram.id)}>
                Delete
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
