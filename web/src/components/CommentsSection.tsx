import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import type { DiagramComment } from '../api/comments';

interface CommentsSectionProps {
  comments: DiagramComment[];
  onAddComment: (content: string) => Promise<void>;
  isLoading?: boolean;
  allowComments?: boolean;
}

export const CommentsSection = React.forwardRef<HTMLDivElement, CommentsSectionProps>(
  ({ comments, onAddComment, isLoading, allowComments = true }, ref) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!newComment.trim()) return;

      setIsSubmitting(true);
      try {
        await onAddComment(newComment.trim());
        setNewComment('');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Card ref={ref} header={`Comments (${comments.length})`}>
        <div className="space-y-4">
          {/* Add Comment Form - Only show if allowed */}
          {allowComments && (
            <div className="border-b border-secondary-200 pb-4 dark:border-white/10">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full rounded-xl border border-secondary-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isSubmitting}
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Post
                </Button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm italic text-secondary-500 dark:text-secondary-400">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-primary-300 py-2 pl-3 dark:border-cyan-300/70">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-secondary-950 dark:text-white">{comment.userName}</p>
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-200">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    );
  }
);

CommentsSection.displayName = 'CommentsSection';
