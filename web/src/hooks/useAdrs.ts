import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adrApi } from '../api/adrs';

export function useAdrs(workspaceId?: string, diagramId?: string) {
  return useQuery({
    queryKey: ['adrs', workspaceId, diagramId],
    queryFn: () => adrApi.list(workspaceId!, diagramId!),
    enabled: !!workspaceId && !!diagramId,
  });
}

export function useGenerateAdr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { workspaceId: string; diagramId: string }) => adrApi.generate(data.workspaceId, data.diagramId),
    onSuccess: (adr) => {
      queryClient.invalidateQueries({ queryKey: ['adrs', adr.workspaceId, adr.diagramId] });
    },
  });
}

export function useRegenerateAdr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { workspaceId: string; diagramId: string; adrId: string }) =>
      adrApi.regenerate(data.workspaceId, data.diagramId, data.adrId),
    onSuccess: (adr) => {
      queryClient.invalidateQueries({ queryKey: ['adrs', adr.workspaceId, adr.diagramId] });
    },
  });
}

export function useDeleteAdr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { workspaceId: string; diagramId: string; adrId: string }) =>
      adrApi.delete(data.workspaceId, data.diagramId, data.adrId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adrs', variables.workspaceId, variables.diagramId] });
    },
  });
}
