import { useMutation, useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../api/workspaces';

export function useCreateWorkspace() {
  return useMutation({
    mutationFn: (data: { organizationId: string; name: string }) =>
      workspaceApi.createWorkspace(data),
  });
}

export function useWorkspaces(organizationId?: string) {
  return useQuery({
    queryKey: ['workspaces', organizationId],
    queryFn: () => workspaceApi.listWorkspaces(organizationId),
    enabled: !!organizationId,
  });
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspaceApi.getWorkspace(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useDeleteWorkspace() {
  return useMutation({
    mutationFn: (workspaceId: string) => workspaceApi.deleteWorkspace(workspaceId),
  });
}
