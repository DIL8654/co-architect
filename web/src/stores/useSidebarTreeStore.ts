import { create } from 'zustand';

type SidebarTreeState = {
  expandedWorkspaceIds: string[];
  toggleWorkspace: (workspaceId: string) => void;
  ensureWorkspaceExpanded: (workspaceId: string) => void;
};

const storageKey = 'coarchitect.sidebar.expandedWorkspaces';

function loadInitial(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(next: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(next));
}

export const useSidebarTreeStore = create<SidebarTreeState>((set, get) => ({
  expandedWorkspaceIds: loadInitial(),
  toggleWorkspace: (workspaceId) => {
    const next = get().expandedWorkspaceIds.includes(workspaceId)
      ? get().expandedWorkspaceIds.filter((id) => id !== workspaceId)
      : [...get().expandedWorkspaceIds, workspaceId];
    persist(next);
    set({ expandedWorkspaceIds: next });
  },
  ensureWorkspaceExpanded: (workspaceId) => {
    if (get().expandedWorkspaceIds.includes(workspaceId)) {
      return;
    }

    const next = [...get().expandedWorkspaceIds, workspaceId];
    persist(next);
    set({ expandedWorkspaceIds: next });
  },
}));
