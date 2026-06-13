import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom';
import {
  BellIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DiagramIcon,
  DocsIcon,
  HealthIcon,
  LogoMark,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  SystemIcon,
  UserIcon,
  WorkspaceIcon,
} from '../components';
import { useDiagrams } from '../hooks/useDiagrams';
import { useLocalIdentity } from '../hooks/useLocalIdentity';
import { useTheme, type ThemeMode } from '../hooks/useTheme';
import { useWorkspaces } from '../hooks/useWorkspaces';
import type { Workspace } from '../api/workspaces';
import { sortWorkspacesForDisplay } from '../lib/demoJourneys';
import { useSidebarTreeStore } from '../stores/useSidebarTreeStore';

type RouteContext = {
  workspaceId?: string;
  diagramId?: string;
};

function getRouteContext(pathname: string): RouteContext {
  const patterns = [
    '/app/workspaces/:workspaceId/diagrams/:diagramId/analysis-runs/:runId',
    '/app/workspaces/:workspaceId/diagrams/upload',
    '/app/workspaces/:workspaceId/diagrams/:diagramId',
    '/app/workspaces/:workspaceId/diagrams',
    '/app/workspaces/:workspaceId',
  ];

  for (const pattern of patterns) {
    const match = matchPath(pattern, pathname);
    if (match) {
      return {
        workspaceId: match.params.workspaceId,
        diagramId: match.params.diagramId,
      };
    }
  }

  return {};
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { displayName } = useLocalIdentity();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('coarchitect.sidebarCollapsed') === 'true');
  const routeContext = useMemo(() => getRouteContext(location.pathname), [location.pathname]);
  const { data: workspaces = [] } = useWorkspaces();
  const orderedWorkspaces = useMemo(() => sortWorkspacesForDisplay(workspaces), [workspaces]);
  const currentWorkspace = orderedWorkspaces.find((workspace) => workspace.id === routeContext.workspaceId) ?? null;
  const { expandedWorkspaceIds, ensureWorkspaceExpanded } = useSidebarTreeStore();

  useEffect(() => {
    if (routeContext.workspaceId) {
      ensureWorkspaceExpanded(routeContext.workspaceId);
    }
  }, [ensureWorkspaceExpanded, routeContext.workspaceId]);

  useEffect(() => {
    localStorage.setItem('coarchitect.sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const themeItems: Array<{ value: ThemeMode; label: string; icon: typeof SunIcon }> = [
    { value: 'dark', label: 'Dark mode', icon: MoonIcon },
    { value: 'light', label: 'Light mode', icon: SunIcon },
    { value: 'system', label: 'System mode', icon: SystemIcon },
  ];

  return (
    <div className={`app-shell ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <header className="top-nav">
        <div className="header-left">
          <NavLink to="/app/dashboard" className="brand" aria-label="CoArchitect AI home">
            <span className="logo-shell">
              <LogoMark className="h-9 w-9" />
            </span>
            <span className="brand-copy">
              <span className="brand-title">CoArchitect AI</span>
              <span className="brand-subtitle">Architecture Workbench</span>
            </span>
          </NavLink>
        </div>

        <div className="header-context">
          <div className="context-chip">
            <span className="context-chip-label">Workspace</span>
            <span className="context-chip-value">{currentWorkspace?.name ?? 'Select a workspace'}</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="theme-switcher" aria-label="Theme mode">
            {themeItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  title={item.label}
                  aria-label={item.label}
                  className={`theme-button ${theme === item.value ? 'active' : ''}`}
                  onClick={() => setTheme(item.value)}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          <Link to="/app/docs" className="header-icon-button" aria-label="Documentation" title="Documentation">
            <DocsIcon className="h-4 w-4" />
          </Link>
          <button type="button" className="header-icon-button" aria-label="Notifications" title="Notifications">
            <BellIcon className="h-4 w-4" />
          </button>
          <div className="profile-chip" title={displayName}>
            <UserIcon className="h-5 w-5" />
          </div>
        </div>
      </header>

      <aside className="side-nav" aria-label="Primary navigation">
        <button
          type="button"
          className="sidebar-toggle-button desktop-only"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRightIcon className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>
        <div className="side-nav-scroll">
          <nav className="side-nav-section">
            <NavSectionLabel collapsed={isSidebarCollapsed}>Workspace</NavSectionLabel>
            <NavItem to="/app/dashboard" label="Dashboard" icon={<WorkspaceIcon className="h-4 w-4" />} collapsed={isSidebarCollapsed} />
            <NavItem to="/app/workspaces" label="Workspaces" icon={<WorkspaceIcon className="h-4 w-4" />} collapsed={isSidebarCollapsed} />
          </nav>

          <nav className="side-nav-section">
            <NavSectionLabel collapsed={isSidebarCollapsed}>Architecture</NavSectionLabel>
            <div className="tree-list">
              {orderedWorkspaces.map((workspace) => (
                <WorkspaceTreeNode
                  key={workspace.id}
                  workspace={workspace}
                  collapsed={isSidebarCollapsed}
                  activeWorkspaceId={routeContext.workspaceId}
                  activeDiagramId={routeContext.diagramId}
                  onNavigate={navigate}
                  isExpanded={expandedWorkspaceIds.includes(workspace.id)}
                />
              ))}
            </div>
          </nav>

          <nav className="side-nav-section">
            <NavSectionLabel collapsed={isSidebarCollapsed}>Knowledge</NavSectionLabel>
            <NavItem to="/app/docs" label="Knowledge Base" icon={<DocsIcon className="h-4 w-4" />} collapsed={isSidebarCollapsed} />
          </nav>

          <nav className="side-nav-section">
            <NavSectionLabel collapsed={isSidebarCollapsed}>Settings</NavSectionLabel>
            <NavItem to="/app/health" label="Health" icon={<HealthIcon className="h-4 w-4" />} collapsed={isSidebarCollapsed} />
            <NavItem to="/app/settings" label="Settings" icon={<SettingsIcon className="h-4 w-4" />} collapsed={isSidebarCollapsed} />
          </nav>
        </div>
      </aside>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}

function WorkspaceTreeNode({
  workspace,
  collapsed,
  activeWorkspaceId,
  activeDiagramId,
  onNavigate,
  isExpanded,
}: {
  workspace: Workspace;
  collapsed: boolean;
  activeWorkspaceId?: string;
  activeDiagramId?: string;
  onNavigate: ReturnType<typeof useNavigate>;
  isExpanded: boolean;
}) {
  const toggleWorkspace = useSidebarTreeStore((state) => state.toggleWorkspace);
  const { data: diagrams = [], isLoading } = useDiagrams(isExpanded ? workspace.id : undefined);

  return (
    <div className="tree-node">
      <div className={`tree-row ${workspace.id === activeWorkspaceId ? 'active' : ''}`}>
        <button
          type="button"
          className="tree-toggle"
          aria-label={isExpanded ? `Collapse ${workspace.name}` : `Expand ${workspace.name}`}
          onClick={() => toggleWorkspace(workspace.id)}
        >
          {isExpanded ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          className="tree-link"
          onClick={() => onNavigate(`/app/workspaces/${workspace.id}/diagrams`)}
          title={workspace.name}
        >
          <WorkspaceIcon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">{workspace.name}</span>}
        </button>
      </div>

      {isExpanded && !collapsed ? (
        <div className="tree-children">
          {isLoading ? (
            <div className="space-y-1 px-3 py-2">
              <div className="h-8 rounded-md bg-[#eef1f4] dark:bg-white/[0.06]" />
              <div className="h-8 rounded-md bg-[#eef1f4] dark:bg-white/[0.04]" />
            </div>
          ) : null}
          {diagrams.map((diagram) => (
            <DiagramTreeNode
              key={diagram.id}
              workspaceId={workspace.id}
              diagramId={diagram.id}
              diagramName={diagram.name}
              activeDiagramId={activeDiagramId}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DiagramTreeNode({
  workspaceId,
  diagramId,
  diagramName,
  activeDiagramId,
  onNavigate,
}: {
  workspaceId: string;
  diagramId: string;
  diagramName: string;
  activeDiagramId?: string;
  onNavigate: ReturnType<typeof useNavigate>;
}) {
  const isActive = diagramId === activeDiagramId;

  return (
    <div className="tree-diagram-group">
      <button
        type="button"
        className={`tree-link nested ${isActive ? 'active' : ''}`}
        onClick={() => onNavigate(`/app/workspaces/${workspaceId}/diagrams/${diagramId}`)}
        title={diagramName}
      >
        <DiagramIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{diagramName}</span>
      </button>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
  collapsed,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  collapsed: boolean;
}) {
  return (
    <NavLink to={to} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={label}>
      <span className="nav-icon">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

function NavSectionLabel({ children, collapsed }: { children: ReactNode; collapsed: boolean }) {
  return collapsed ? null : <p className="nav-section-label">{children}</p>;
}
