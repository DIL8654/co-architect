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
    mutationFn: (data: { workspaceId: string; diagramId: string }) => analysisApi.runAnalysis(data.workspaceId, data.diagramId),
    onSuccess: (data) => {
      // Invalidate and refetch the analysis data
      queryClient.invalidateQueries({
        queryKey: ['diagram-analysis', data.diagramId],
      });
    },
  });
}

export function useAnalysisRuns(workspaceId: string, diagramId: string) {
  return useQuery({
    queryKey: ['analysis-runs', workspaceId, diagramId],
    queryFn: () => analysisApi.listAnalysisRuns(workspaceId, diagramId),
    enabled: !!workspaceId && !!diagramId,
  });
}
