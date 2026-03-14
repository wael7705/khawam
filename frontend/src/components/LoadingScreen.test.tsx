import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders loading text', () => {
    render(<LoadingScreen />);
    expect(screen.getByText(/جاري التحميل/)).toBeInTheDocument();
  });

  it('renders logo image with alt', () => {
    render(<LoadingScreen />);
    const img = screen.getByRole('img', { name: /خوام/ });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/images/logo.jpeg');
  });

  it('has status role for accessibility', () => {
    render(<LoadingScreen />);
    expect(screen.getByRole('status', { name: 'جاري التحميل' })).toBeInTheDocument();
  });
});
