import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { router as appRouter } from './index';

describe('public/app route split', () => {
  it('renders the public site on root', async () => {
    const router = createMemoryRouter(appRouter.routes, {
      initialEntries: ['/'],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { name: 'Turn diagrams into grounded architecture decisions.' })).toBeTruthy();
  });

  it('keeps legacy product redirects registered', () => {
    const routePaths = appRouter.routes.map((route) => route.path);

    expect(routePaths).toContain('/dashboard');
    expect(routePaths).toContain('/docs');
    expect(routePaths).toContain('/settings');
    expect(routePaths).toContain('/health');
    expect(routePaths).toContain('/workspaces');
  });
});
