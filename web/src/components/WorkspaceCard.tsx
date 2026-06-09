import React from 'react';
import { Card } from './Card';
import { CloseIcon, DiagramIcon } from './Icons';
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
        className="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg"
        header={
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-950 dark:text-white">{workspace.name}</h3>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(workspace.id);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-error-600 transition hover:bg-error-50 hover:text-error-700 dark:hover:bg-error-500/10"
                title="Delete workspace"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        }
      >
        <div onClick={() => onSelect?.(workspace)} className="space-y-4 p-1">
          <div className="flex items-center gap-3">
            <div className="glow-icon h-10 w-10">
              <DiagramIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-secondary-950 dark:text-white">{workspace.diagramCount} diagrams</p>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">Architecture inventory</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-secondary-200 pt-3 text-sm dark:border-white/10">
            <span className="text-secondary-600 dark:text-secondary-400">Last updated</span>
            <span className="font-medium text-secondary-700 dark:text-secondary-200">{lastUpdated}</span>
          </div>
        </div>
      </Card>
    );
  }
);

WorkspaceCard.displayName = 'WorkspaceCard';
