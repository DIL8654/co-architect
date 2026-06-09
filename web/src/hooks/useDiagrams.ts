import { useMutation, useQuery } from '@tanstack/react-query';
import { diagramApi } from '../api/diagrams';

export function useUploadDiagram() {
  return useMutation({
    mutationFn: (data: { organizationId: string; workspaceId: string; name: string; description?: string; file?: File }) =>
      diagramApi.uploadDiagram(data),
  });
}

export function useDiagrams(organizationId?: string, workspaceId?: string) {
  return useQuery({
    queryKey: ['diagrams', organizationId, workspaceId],
    queryFn: () => diagramApi.listDiagrams(organizationId!, workspaceId!),
    enabled: !!organizationId && !!workspaceId,
  });
}

export function useDiagram(organizationId: string, diagramId: string) {
  return useQuery({
    queryKey: ['diagram', organizationId, diagramId],
    queryFn: () => diagramApi.getDiagram(organizationId, diagramId),
    enabled: !!organizationId && !!diagramId,
  });
}

export function useDeleteDiagram() {
  return useMutation({
    mutationFn: (diagramId: string) => diagramApi.deleteDiagram(diagramId),
  });
}
