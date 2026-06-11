import { Navigate, createBrowserRouter, useParams } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { WorkspaceListPage } from '../pages/WorkspaceListPage';
import { DiagramListPage } from '../pages/DiagramListPage';
import { UploadDiagramPage } from '../pages/UploadDiagramPage';
import { DiagramDetailPage } from '../pages/DiagramDetailPage';
import { LandingPage } from '../pages/LandingPage';
import { InfraHealthPage } from '../pages/InfraHealthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DocsPage } from '../pages/DocsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { LocalSetupPage } from '../pages/LocalSetupPage';
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
    return <Navigate to="/" replace />;
  }

  return <LocalSetupPage />;
}

function WorkspaceLegacyRedirect() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  if (!workspaceId) {
    return <Navigate to="/workspaces" replace />;
  }

  return <Navigate to={`/workspaces/${workspaceId}/diagrams`} replace />;
}

function AnalysisRunWorkbenchRedirect() {
  const { workspaceId, diagramId, runId } = useParams<{ workspaceId: string; diagramId: string; runId: string }>();

  if (!workspaceId || !diagramId) {
    return <Navigate to="/workspaces" replace />;
  }

  const search = runId ? `?tab=analysis-runs&runId=${encodeURIComponent(runId)}` : '?tab=analysis-runs';
  return <Navigate to={`/workspaces/${workspaceId}/diagrams/${diagramId}${search}`} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/setup',
    element: <LocalSetupRoute />,
  },
  {
    path: '/',
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
