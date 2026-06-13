import { Navigate, createBrowserRouter, useLocation, useParams } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { PublicSiteLayout } from '../layouts/PublicSiteLayout';
import { WorkspaceListPage } from '../pages/WorkspaceListPage';
import { DiagramListPage } from '../pages/DiagramListPage';
import { UploadDiagramPage } from '../pages/UploadDiagramPage';
import { DiagramDetailPage } from '../pages/DiagramDetailPage';
import { LandingPage } from '../pages/LandingPage';
import { InfraHealthPage } from '../pages/InfraHealthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DocsPage } from '../pages/DocsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { SettingsPromoPage } from '../pages/SettingsPromoPage';
import { LocalSetupPage } from '../pages/LocalSetupPage';
import { PublicHomePage } from '../pages/PublicHomePage';
import { PublicProductPage } from '../pages/PublicProductPage';
import { useLocalIdentity } from '../hooks/useLocalIdentity';

function AppBootstrapLayout() {
  const identity = useLocalIdentity();

  if (!identity.isConfigured) {
    return <Navigate to="/setup" replace />;
  }

  return <AppLayout />;
}

function LocalSetupRoute() {
  const identity = useLocalIdentity();

  if (identity.isConfigured) {
    return <Navigate to="/app" replace />;
  }

  return <LocalSetupPage />;
}

function WorkspaceLegacyRedirect() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  if (!workspaceId) {
    return <Navigate to="/app/workspaces" replace />;
  }

  return <Navigate to={`/app/workspaces/${workspaceId}/diagrams`} replace />;
}

function AnalysisRunWorkbenchRedirect() {
  const { workspaceId, diagramId, runId } = useParams<{ workspaceId: string; diagramId: string; runId: string }>();

  if (!workspaceId || !diagramId) {
    return <Navigate to="/app/workspaces" replace />;
  }

  const search = runId ? `?tab=analysis-runs&runId=${encodeURIComponent(runId)}` : '?tab=analysis-runs';
  return <Navigate to={`/app/workspaces/${workspaceId}/diagrams/${diagramId}${search}`} replace />;
}

function AppRouteRedirect() {
  const { workspaceId, diagramId } = useParams<{ workspaceId: string; diagramId: string }>();
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname === '/workspaces') {
    return <Navigate to="/app/workspaces" replace />;
  }

  if (pathname.endsWith('/upload') && workspaceId) {
    return <Navigate to={`/app/workspaces/${workspaceId}/diagrams/upload`} replace />;
  }

  if (workspaceId && diagramId) {
    return <Navigate to={`/app/workspaces/${workspaceId}/diagrams/${diagramId}`} replace />;
  }

  if (workspaceId) {
    return <Navigate to={`/app/workspaces/${workspaceId}/diagrams`} replace />;
  }

  return <Navigate to="/app/workspaces" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicSiteLayout />,
    children: [
      {
        index: true,
        element: <PublicHomePage />,
      },
      {
        path: 'product',
        element: <PublicProductPage />,
      },
    ],
  },
  {
    path: '/setup',
    element: <LocalSetupRoute />,
  },
  {
    path: '/dashboard',
    element: <Navigate to="/app/dashboard" replace />,
  },
  {
    path: '/docs',
    element: <Navigate to="/app/docs" replace />,
  },
  {
    path: '/settings',
    element: <Navigate to="/app/settings" replace />,
  },
  {
    path: '/health',
    element: <Navigate to="/app/health" replace />,
  },
  {
    path: '/workspaces',
    element: <Navigate to="/app/workspaces" replace />,
  },
  {
    path: '/workspaces/:workspaceId',
    element: <WorkspaceLegacyRedirect />,
  },
  {
    path: '/workspaces/:workspaceId/diagrams',
    element: <AppRouteRedirect />,
  },
  {
    path: '/workspaces/:workspaceId/diagrams/upload',
    element: <AppRouteRedirect />,
  },
  {
    path: '/workspaces/:workspaceId/diagrams/:diagramId',
    element: <AppRouteRedirect />,
  },
  {
    path: '/workspaces/:workspaceId/diagrams/:diagramId/analysis-runs/:runId',
    element: <AnalysisRunWorkbenchRedirect />,
  },
  {
    path: '/app',
    element: <AppBootstrapLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'docs',
        element: <DocsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'settings/promo',
        element: <SettingsPromoPage />,
      },
      {
        path: 'health',
        element: <InfraHealthPage />,
      },
      {
        path: 'workspaces',
        element: <WorkspaceListPage />,
      },
      {
        path: 'workspaces/:workspaceId',
        element: <WorkspaceLegacyRedirect />,
      },
      {
        path: 'workspaces/:workspaceId/diagrams',
        element: <DiagramListPage />,
      },
      {
        path: 'workspaces/:workspaceId/diagrams/upload',
        element: <UploadDiagramPage />,
      },
      {
        path: 'workspaces/:workspaceId/diagrams/:diagramId',
        element: <DiagramDetailPage />,
      },
      {
        path: 'workspaces/:workspaceId/diagrams/:diagramId/analysis-runs/:runId',
        element: <AnalysisRunWorkbenchRedirect />,
      },
    ],
  },
]);
