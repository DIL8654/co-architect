import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppLayout } from './AppLayout';

function renderLayout(path = '/') {
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
    expect(screen.getByText('Organizations')).toBeTruthy();
    expect(screen.getByText('Infra Health')).toBeTruthy();
    expect(screen.getByText('Docs')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
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
});
