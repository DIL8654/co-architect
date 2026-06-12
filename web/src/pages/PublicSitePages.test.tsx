import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PublicHomePage } from './PublicHomePage';
import { PublicProductPage } from './PublicProductPage';

describe('Public site pages', () => {
  it('renders the public home page with a Try Now entry point', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<PublicHomePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Turn diagrams into grounded architecture decisions.' })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Try Now' }).length).toBeGreaterThan(0);
  });

  it('renders the public product page with workbench and grounding sections', () => {
    render(
      <MemoryRouter initialEntries={['/product']}>
        <Routes>
          <Route path="/product" element={<PublicProductPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'A compact architecture reasoning platform for engineering teams.' })).toBeTruthy();
    expect(screen.getByText('Foundry IQ-style grounding')).toBeTruthy();
    expect(screen.getAllByText('Diagram Workbench').length).toBeGreaterThan(0);
  });
});
