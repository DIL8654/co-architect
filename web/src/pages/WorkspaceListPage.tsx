import { useState } from 'react';
import { Breadcrumbs, Button, EmptyState, ErrorState, IconButton, LoadingState, Modal, PlusIcon, TrashIcon, WorkspaceIcon } from '../components';
import { useCreateWorkspace, useDeleteWorkspace, useWorkspaces } from '../hooks/useWorkspaces';
import { getErrorMessage, getFieldError } from '../api/axios';

export function WorkspaceListPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [nameError, setNameError] = useState('');
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{ id: string; name: string } | null>(null);
  const { data: workspaces, isLoading, isError, refetch } = useWorkspaces();
  const createMutation = useCreateWorkspace();
  const deleteMutation = useDeleteWorkspace();

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      setNameError('Workspace name is required');
      return;
    }

    try {
      await createMutation.mutateAsync({ name: workspaceName.trim() });
      setWorkspaceName('');
      setNameError('');
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      setNameError(getFieldError(error, 'name') ?? getErrorMessage(error));
    }
  };

  const confirmDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    try {
      await deleteMutation.mutateAsync(workspaceToDelete.id);
      setWorkspaceToDelete(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  if (isLoading) return <LoadingState message="Loading workspaces..." />;

  if (isError) {
    return (
      <ErrorState
        title="Failed to load workspaces"
        message="An error occurred while fetching workspaces."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <Breadcrumbs items={[{ label: 'Workspaces' }]} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="page-title">Workspaces</h1>
            <p className="page-description">
              Create top-level architecture workspaces and open diagrams from the left navigation tree.
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<PlusIcon className="h-4 w-4" />}>
            Create Workspace
          </Button>
        </div>
      </section>

      {!workspaces || workspaces.length === 0 ? (
        <EmptyState
          title="No workspaces yet"
          description="Create a workspace to group architecture diagrams by product area, platform, or review scope."
          action={
            <Button onClick={() => setIsCreateModalOpen(true)} icon={<PlusIcon className="h-4 w-4" />}>
              Create Workspace
            </Button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-[#dde1e6] bg-white dark:border-white/10 dark:bg-[#08101d]">
          <table className="w-full">
            <thead className="border-b border-[#dde1e6] bg-[#f8f9fb] dark:border-white/10 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Workspace</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Diagrams</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Updated</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-secondary-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((workspace) => (
                <tr key={workspace.id} className="border-b border-[#eef1f4] last:border-0 dark:border-white/10">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="glow-icon h-9 w-9">
                        <WorkspaceIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-medium text-secondary-950 dark:text-white">{workspace.name}</p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400">Open diagrams from the sidebar or diagrams view</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">{workspace.diagramCount}</td>
                  <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">
                    {new Date(workspace.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-secondary-600 dark:text-secondary-300">
                    {workspace.diagramCount > 0 ? 'Active' : 'Empty'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <IconButton
                      label={`Delete ${workspace.name}`}
                      variant="danger"
                      size="sm"
                      onClick={() => setWorkspaceToDelete({ id: workspace.id, name: workspace.name })}
                      icon={<TrashIcon className="h-4 w-4" />}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setWorkspaceName('');
          setNameError('');
        }}
        title="Create Workspace"
      >
        <div className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-secondary-900 dark:text-secondary-100">Workspace Name</label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => {
                setWorkspaceName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="E.g., Platform Architecture"
              className="w-full rounded-xl border border-secondary-300 bg-white px-3 py-2 text-secondary-950 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              disabled={createMutation.isPending}
              autoFocus
            />
            {nameError && <p className="mt-1 text-sm text-error-600">{nameError}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace} isLoading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!workspaceToDelete}
        onClose={() => setWorkspaceToDelete(null)}
        title="Delete Workspace"
      >
        <div className="space-y-4 p-4">
          <p className="text-sm text-secondary-600 dark:text-secondary-300">
            Delete <strong>{workspaceToDelete?.name}</strong> and all child diagrams, comments, analysis runs, and ADR versions?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setWorkspaceToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteWorkspace} isLoading={deleteMutation.isPending}>
              Delete Workspace
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
