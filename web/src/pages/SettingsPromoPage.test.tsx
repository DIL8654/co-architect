import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SettingsPromoPage } from './SettingsPromoPage';

describe('SettingsPromoPage', () => {
  it('renders the screenshot-ready promo surface', () => {
    render(
      <MemoryRouter initialEntries={['/app/settings/promo']}>
        <Routes>
          <Route path="/app/settings/promo" element={<SettingsPromoPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Promo Capture' })).toBeTruthy();
    expect(screen.getByText('CoArchitect AI')).toBeTruthy();
    expect(screen.getByText('Ground Architecture Decisions in Evidence, Context, And AI Reasoning.')).toBeTruthy();
  });
});
