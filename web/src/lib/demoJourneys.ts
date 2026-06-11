import type { Workspace } from '../api/workspaces';

export const DEMO_WORKSPACE_ORDER = [
  '[Demo] Automated Video Analysis Platform',
  '[Demo] Custom Document Processing Platform',
  '[Demo] Enterprise SaaS Platform Baseline',
] as const;

const demoOrderIndex = new Map<string, number>(DEMO_WORKSPACE_ORDER.map((name, index) => [name, index]));

export function isDemoWorkspace(name: string) {
  return demoOrderIndex.has(name);
}

export function sortWorkspacesForDisplay<T extends Pick<Workspace, 'name'>>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftIndex = demoOrderIndex.get(left.name);
    const rightIndex = demoOrderIndex.get(right.name);

    if (leftIndex !== undefined && rightIndex !== undefined) {
      return leftIndex - rightIndex;
    }

    if (leftIndex !== undefined) {
      return -1;
    }

    if (rightIndex !== undefined) {
      return 1;
    }

    return left.name.localeCompare(right.name);
  });
}
