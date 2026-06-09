import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analysisApi } from '../api/analysis';

export function useDiagramAnalysis(diagramId: string) {
  return useQuery({
    queryKey: ['diagram-analysis', diagramId],
    queryFn: () => analysisApi.getDiagramAnalysis(diagramId),
    enabled: !!diagramId,
  });
}

export function useRunAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { organizationId: string; diagramId: string }) => analysisApi.runAnalysis(data.organizationId, data.diagramId),
    onSuccess: (data) => {
      // Invalidate and refetch the analysis data
      queryClient.invalidateQueries({
        queryKey: ['diagram-analysis', data.diagramId],
      });
    },
  });
}
