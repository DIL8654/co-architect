import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppLayout } from './AppLayout';

function renderLayout(path = '/') {
  localStorage.setItem(
    'coarchitect.local-profile',
    JSON.stringify({
      state: {
        isConfigured: true,
        displayName: 'Test Architect',
        organizationLabel: 'Northwind Team',
      },
      version: 0,
    }),
  );

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <h1>Test Landing</h1>,
          },
          {
            path: 'dashboard',
            element: <h1>Dashboard Route</h1>,
          },
          {
            path: 'workspaces',
            element: <h1>Workspaces Route</h1>,
          },
          {
            path: 'workspaces/:workspaceId/diagrams',
            element: <h1>Diagram List Route</h1>,
          },
          {
            path: 'settings',
            element: <h1>Settings Route</h1>,
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    delete document.documentElement.dataset.theme;
  });

  it('renders the enterprise shell navigation', () => {
    renderLayout();

    expect(screen.getByLabelText('CoArchitect AI home')).toBeTruthy();
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Workspaces')).toBeTruthy();
    expect(screen.getByText('Knowledge Base')).toBeTruthy();
    expect(screen.getByText('Health')).toBeTruthy();
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
  });

  it('defaults to dark mode and can switch to light mode', async () => {
    renderLayout();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('dark');

    fireEvent.click(screen.getByLabelText('Light mode'));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('coarchitect.theme')).toBe('light');
  });

  it('uses dashboard as the brand logo destination', () => {
    renderLayout('/settings');

    const brandLink = screen.getByLabelText('CoArchitect AI home') as HTMLAnchorElement;
    expect(brandLink.getAttribute('href')).toBe('/dashboard');
  });

  it('does not highlight Workspaces nav item on nested workspace diagram routes', () => {
    renderLayout('/workspaces/abc-123/diagrams');

    const workspacesLink = screen.getByRole('link', { name: 'Workspaces' });
    expect(workspacesLink.className.includes('active')).toBe(false);
    expect(screen.getByText('Diagram List Route')).toBeTruthy();
  });
});
