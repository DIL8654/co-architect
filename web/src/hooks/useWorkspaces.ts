import { useMutation, useQuery } from '@tanstack/react-query';
import { workspaceApi } from '../api/workspaces';

export function useCreateWorkspace() {
  return useMutation({
    mutationFn: (data: { name: string }) =>
      workspaceApi.createWorkspace(data),
  });
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceApi.listWorkspaces(),
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
