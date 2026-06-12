import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumbs, Button, DiagramIcon, EmptyState, ErrorState, IconButton, LoadingState, Modal, TrashIcon, UploadIcon } from '../components';
import { useDeleteDiagram, useDiagrams } from '../hooks/useDiagrams';

export function DiagramListPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { data: diagrams, isLoading, isError, refetch } = useDiagrams(workspaceId);
  const deleteMutation = useDeleteDiagram();
  const [diagramToDelete, setDiagramToDelete] = useState<{ id: string; name: string } | null>(null);

  if (!workspaceId) {
    return <ErrorState title="Invalid workspace" message="Please select a valid workspace." />;
  }

  const uploadRoute = `/app/workspaces/${workspaceId}/diagrams/upload`;

  const handleDeleteDiagram = async () => {
    if (!diagramToDelete) return;

    try {
      await deleteMutation.mutateAsync(diagramToDelete.id);
      setDiagramToDelete(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete diagram:', error);
    }
  };

  if (isLoading) return <LoadingState message="Loading diagrams..." />;

  if (isError) {
    return (
      <ErrorState
        title="Failed to load diagrams"
        message="An error occurred while fetching diagrams."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs items={[{ label: 'Workspaces', to: '/app/workspaces' }, { label: 'Diagrams' }]} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">Diagrams</h1>
            <p className="page-description">
              Upload architecture evidence here. Open a specific diagram from the sidebar tree to work in the detail workspace.
            </p>
          </div>
          <Button onClick={() => navigate(uploadRoute)} icon={<UploadIcon className="h-4 w-4" />}>
            Upload Diagram
          </Button>
        </div>
      </section>

      {!diagrams || diagrams.length === 0 ? (
        <EmptyState
          title="No diagrams yet"
          description="Upload your first architecture image or description to begin the review flow."
          action={
            <Button onClick={() => navigate(uploadRoute)} icon={<UploadIcon className="h-4 w-4" />}>
              Upload Diagram
            </Button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
          <table className="w-full">
            <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Diagram</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Uploaded</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Source</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-secondary-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {diagrams.map((diagram) => (
                <tr key={diagram.id} className="border-b border-[#eef1f4] last:border-0 dark:border-white/10">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="glow-icon h-9 w-9">
                        <DiagramIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium text-secondary-950 dark:text-white">{diagram.name}</p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">Use the sidebar tree to open details</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{scoreLabel(diagram.architectureScore)}</td>
                  <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">
                    {new Date(diagram.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{diagram.originalFileName || 'Description'}</td>
                  <td className="px-4 py-4 text-right">
                    <IconButton
                      label={`Delete ${diagram.name}`}
                      variant="danger"
                      size="sm"
                      onClick={() => setDiagramToDelete({ id: diagram.id, name: diagram.name })}
                      icon={<TrashIcon className="h-4 w-4" />}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <Modal isOpen={!!diagramToDelete} onClose={() => setDiagramToDelete(null)} title="Delete Diagram">
        <div className="space-y-4 p-4">
          <p className="text-sm text-secondary-600 dark:text-secondary-300">
            Delete <strong>{diagramToDelete?.name}</strong> and all comments, analysis runs, and ADR versions?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDiagramToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteDiagram} isLoading={deleteMutation.isPending}>
              Delete Diagram
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function scoreLabel(score?: number) {
  return score !== null && score !== undefined ? `${score.toFixed(1)}/100` : '—';
}
