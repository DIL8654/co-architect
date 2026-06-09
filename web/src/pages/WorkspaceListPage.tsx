import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, ErrorState, LoadingState, EmptyState } from '../components';
import { WorkspaceCard } from '../components/WorkspaceCard';
import { useWorkspaces, useCreateWorkspace, useDeleteWorkspace } from '../hooks/useWorkspaces';

export function WorkspaceListPage() {
  const { orgId, organizationId } = useParams<{ orgId: string; organizationId: string }>();
  const resolvedOrgId = orgId ?? organizationId;
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [nameError, setNameError] = useState('');

  const { data: workspaces, isLoading, isError, refetch } = useWorkspaces(resolvedOrgId);
  const createMutation = useCreateWorkspace();
  const deleteMutation = useDeleteWorkspace();

  if (!resolvedOrgId) {
    return (
      <ErrorState
        title="Organization not found"
        message="Please select an organization first."
      />
    );
  }

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      setNameError('Workspace name is required');
      return;
    }

    try {
      await createMutation.mutateAsync({
        organizationId: resolvedOrgId,
        name: workspaceName.trim(),
      });
      setWorkspaceName('');
      setNameError('');
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      setNameError('Failed to create workspace');
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (confirm('Are you sure you want to delete this workspace?')) {
      try {
        await deleteMutation.mutateAsync(workspaceId);
        refetch();
      } catch (error) {
        console.error('Failed to delete workspace:', error);
      }
    }
  };

  const handleSelectWorkspace = (workspace: any) => {
    navigate(`/orgs/${resolvedOrgId}/workspaces/${workspace.id}/diagrams`);
  };

  if (isLoading) return <LoadingState message="Loading workspaces..." />;

  if (isError)
    return (
      <ErrorState
        title="Failed to load workspaces"
        message="An error occurred while fetching workspaces."
        action={
          <Button variant="primary" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" onClick={() => navigate('/organizations')} className="mb-3">
            Back
          </Button>
          <h1 className="text-3xl font-bold text-secondary-900">Workspaces</h1>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>New Workspace</Button>
      </div>

      {!workspaces || workspaces.length === 0 ? (
        <EmptyState
          title="No workspaces yet"
          description="Create your first workspace to start uploading diagrams."
          action={
            <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
              Create Workspace
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onSelect={handleSelectWorkspace}
              onDelete={handleDeleteWorkspace}
            />
          ))}
        </div>
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
            <label className="block text-sm font-medium text-secondary-900 mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => {
                setWorkspaceName(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="E.g., Microservices Architecture"
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={createMutation.isPending}
              autoFocus
            />
            {nameError && <p className="text-error-600 text-sm mt-1">{nameError}</p>}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsCreateModalOpen(false);
                setWorkspaceName('');
                setNameError('');
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              isLoading={createMutation.isPending}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
