import { useMutation, useQuery } from '@tanstack/react-query';
import { commentsApi } from '../api/comments';

export function useCreateComment() {
  return useMutation({
    mutationFn: (data: { organizationId: string; diagramId: string; content: string }) =>
      commentsApi.createComment(data),
  });
}

export function useDiagramComments(organizationId: string, diagramId: string) {
  return useQuery({
    queryKey: ['diagram-comments', organizationId, diagramId],
    queryFn: () => commentsApi.getDiagramComments(organizationId, diagramId),
    enabled: !!organizationId && !!diagramId,
  });
}

export function useDeleteComment() {
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.deleteComment(commentId),
  });
}
