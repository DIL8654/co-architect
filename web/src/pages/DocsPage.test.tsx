import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DocsPage } from './DocsPage';

describe('DocsPage', () => {
  it('renders the simplified knowledge base tabs and score explanation', () => {
    render(
      <MemoryRouter>
        <DocsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Overview' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Workflow' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Capabilities' })).toBeTruthy();
    expect(screen.getByText(/The AI does not invent the final score by itself/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Capabilities' }));
    expect(screen.getByText(/Standards-aware grounding/i)).toBeTruthy();
  });
});
