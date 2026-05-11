import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import APropos from './APropos';

describe('APropos', () => {
  it('renders redesigned sections and contact CTA without crashing', () => {
    render(<APropos />);

    expect(screen.getByRole('heading', { level: 1, name: /Une communication/i })).toBeInTheDocument();
    expect(screen.getByText(/Notre mission/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contacter SMOVE/i })).toHaveAttribute('href', '#/contact');
  });
});
