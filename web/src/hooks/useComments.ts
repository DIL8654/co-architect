import { useMutation, useQuery } from '@tanstack/react-query';
import { commentsApi } from '../api/comments';

export function useCreateComment() {
  return useMutation({
    mutationFn: (data: { workspaceId: string; diagramId: string; content: string }) =>
      commentsApi.createComment(data),
  });
}

export function useDiagramComments(workspaceId: string, diagramId: string) {
  return useQuery({
    queryKey: ['diagram-comments', workspaceId, diagramId],
    queryFn: () => commentsApi.getDiagramComments(workspaceId, diagramId),
    enabled: !!workspaceId && !!diagramId,
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDeleteComment() {
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteComment(commentId),
  });
}
