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
            <div className="border-b border-secondary-200 pb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
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
              <p className="text-secondary-500 text-sm italic">No comments yet</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-primary-300 pl-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-secondary-900">{comment.userName}</p>
                    <span className="text-xs text-secondary-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-700 mt-1">{comment.content}</p>
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
