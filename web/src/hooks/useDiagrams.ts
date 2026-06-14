import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { diagramApi, type ArchitectureDiagram, type DiagramReviewSetupInput } from '../api/diagrams';

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
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDiagram(diagramId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['diagram', diagramId],
    queryFn: () => diagramApi.getDiagram(diagramId),
    enabled: !!diagramId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    initialData: () => {
      const cachedLists = queryClient.getQueriesData<ArchitectureDiagram[]>({ queryKey: ['diagrams'] });
      for (const [, diagrams] of cachedLists) {
        const match = diagrams?.find((item) => item.id === diagramId);
        if (match) {
          return match;
        }
      }

      return undefined;
    },
  });
}

export function useDeleteDiagram() {
  return useMutation({
    mutationFn: (diagramId: string) => diagramApi.deleteDiagram(diagramId),
  });
}
