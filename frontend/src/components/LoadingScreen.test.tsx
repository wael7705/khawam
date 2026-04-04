import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingScreen } from './LoadingScreen';

describe('LoadingScreen', () => {
  it('renders brand and headline copy', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('خوام')).toBeInTheDocument();
    expect(screen.getByText('KHAWAM')).toBeInTheDocument();
    expect(screen.getByText(/جاهزون للإبداع/)).toBeInTheDocument();
    expect(screen.getByText(/نحمل طابع طلبك/)).toBeInTheDocument();
    expect(screen.getByText('يرجى الانتظار قليلاً')).toBeInTheDocument();
  });

  it('has status role for accessibility', () => {
    render(<LoadingScreen />);
    expect(screen.getByRole('status', { name: 'جاري التحميل' })).toBeInTheDocument();
  });
});
