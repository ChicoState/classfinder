import {
  act,
  cleanup,
  fireEvent,
  render,
  screen
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import App from '../../src/App';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('building selection loading state', () => {
  it('shows the retro loader for two seconds after selecting a building', () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('link', { name: /Acker Gymnasium/i }));

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.getByText('Loading building data...')).toBeTruthy();

    act(() => vi.advanceTimersByTime(1999));
    expect(screen.getByRole('progressbar')).toBeTruthy();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
