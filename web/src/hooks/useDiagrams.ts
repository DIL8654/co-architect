import { useMutation, useQuery } from '@tanstack/react-query';
import { diagramApi, type DiagramReviewSetupInput } from '../api/diagrams';

export function useUploadDiagram() {
  return useMutation({
    mutationFn: (data: { workspaceId: string; name: string; description?: string; file?: File; reviewSetup: DiagramReviewSetupInput }) =>
      diagramApi.uploadDiagram(data),
  });
}

export function useDiagrams(workspaceId?: string) {
  return useQuery({
    queryKey: ['diagrams', workspaceId],
    queryFn: () => diagramApi.listDiagrams(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useDiagram(diagramId: string) {
  return useQuery({
    queryKey: ['diagram', diagramId],
    queryFn: () => diagramApi.getDiagram(diagramId),
    enabled: !!diagramId,
  });
}

export function useDeleteDiagram() {
  return useMutation({
    mutationFn: (diagramId: string) => diagramApi.deleteDiagram(diagramId),
  });
}
