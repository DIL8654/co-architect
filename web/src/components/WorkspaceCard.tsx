import React from 'react';
import { Card } from './Card';
import type { Workspace } from '../api/workspaces';

export interface WorkspaceCardProps {
  workspace: Workspace;
  onSelect?: (workspace: Workspace) => void;
  onDelete?: (workspaceId: string) => void;
}

export const WorkspaceCard = React.forwardRef<HTMLDivElement, WorkspaceCardProps>(
  ({ workspace, onSelect, onDelete }, ref) => {
    const lastUpdated = new Date(workspace.updatedAt).toLocaleDateString();

    return (
      <Card
        ref={ref}
        className="cursor-pointer hover:shadow-lg transition-shadow"
        header={
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900">{workspace.name}</h3>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(workspace.id);
                }}
                className="text-error-600 hover:text-error-700 transition"
                title="Delete workspace"
              >
                ✕
              </button>
            )}
          </div>
        }
      >
        <div
          onClick={() => onSelect?.(workspace)}
          className="space-y-3 p-2"
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-600">Diagrams:</span>
            <span className="font-medium text-secondary-900">{workspace.diagramCount}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-600">Last updated:</span>
            <span className="text-secondary-700">{lastUpdated}</span>
          </div>
        </div>
      </Card>
    );
  }
);

WorkspaceCard.displayName = 'WorkspaceCard';
