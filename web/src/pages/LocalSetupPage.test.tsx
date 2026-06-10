import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { LocalSetupPage } from './LocalSetupPage';

describe('LocalSetupPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists the local profile when setup is completed', () => {
    render(
      <MemoryRouter>
        <LocalSetupPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Jane Architect'), {
      target: { value: 'Dilan Architect' },
    });
    fireEvent.change(screen.getByPlaceholderText('Northwind Platform Team'), {
      target: { value: 'CoArchitect Judges' },
    });
    fireEvent.click(screen.getByText('Continue to CoArchitect'));

    const persisted = localStorage.getItem('coarchitect.local-profile');
    expect(persisted).toContain('Dilan Architect');
    expect(persisted).toContain('CoArchitect Judges');
  });
});
