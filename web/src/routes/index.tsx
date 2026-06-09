import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { OrganizationListPage } from '../pages/OrganizationListPage';
import { OrganizationSetupPage } from '../pages/OrganizationSetupPage';
import { WorkspaceListPage } from '../pages/WorkspaceListPage';
import { DiagramListPage } from '../pages/DiagramListPage';
import { UploadDiagramPage } from '../pages/UploadDiagramPage';
import { DiagramDetailPage } from '../pages/DiagramDetailPage';
import { RecommendationsPage } from '../pages/RecommendationsPage';
import { TradeoffAnalysisPage } from '../pages/TradeoffAnalysisPage';
import { OrganizationMembersPage } from '../pages/OrganizationMembersPage';
import { LandingPage } from '../pages/LandingPage';
import { AnalysisResultPage } from '../pages/AnalysisResultPage';
import { InfraHealthPage } from '../pages/InfraHealthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DocsPage } from '../pages/DocsPage';
import { SettingsPage } from '../pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
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
        path: 'organizations',
        element: <OrganizationListPage />,
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
        path: 'organizations/new',
        element: <OrganizationSetupPage />,
      },
      {
        path: 'orgs/:orgId/workspaces',
        element: <WorkspaceListPage />,
      },
      {
        path: 'orgs/:orgId/members',
        element: <OrganizationMembersPage />,
      },
      {
        path: 'orgs/:orgId/workspaces/:workspaceId/diagrams',
        element: <DiagramListPage />,
      },
      {
        path: 'orgs/:orgId/workspaces/:workspaceId/diagrams/upload',
        element: <UploadDiagramPage />,
      },
      {
        path: 'orgs/:orgId/diagrams/:diagramId',
        element: <DiagramDetailPage />,
      },
      {
        path: 'orgs/:orgId/diagrams/:diagramId/analysis/:runId',
        element: <AnalysisResultPage />,
      },
      {
        path: 'orgs/:orgId/workspaces/:workspaceId/diagrams/:diagramId',
        element: <DiagramDetailPage />,
      },
      {
        path: 'orgs/:orgId/workspaces/:workspaceId/diagrams/:diagramId/recommendations',
        element: <RecommendationsPage />,
      },
      {
        path: 'orgs/:orgId/workspaces/:workspaceId/diagrams/:diagramId/tradeoffs',
        element: <TradeoffAnalysisPage />,
      },
      {
        path: 'organizations/:organizationId/workspaces',
        element: <WorkspaceListPage />,
      },
      {
        path: 'organizations/:organizationId/workspaces/:workspaceId/diagrams',
        element: <DiagramListPage />,
      },
    ],
  },
]);
