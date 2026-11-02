import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../../src/App';

afterEach(cleanup);

it.each(['/', '/map'])('renders the campus entry at %s', (path) => {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Enter your class schedule/)).toBeTruthy();
});

it('offers recovery from an unavailable building', () => {
  render(
    <MemoryRouter initialEntries={['/buildings/unknown']}>
      <App />
    </MemoryRouter>
  );
  expect(
    screen.getByRole('heading', { name: 'Building unavailable' })
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('link', { name: 'Back to campus map' }));
  expect(screen.getByText(/Enter your class schedule/)).toBeTruthy();
});

it('limits choices to the building and updates routes when endpoints change', () => {
  render(
    <MemoryRouter initialEntries={['/buildings/oconnell']}>
      <App />
    </MemoryRouter>
  );
  const start = screen.getByLabelText('Starting node') as HTMLSelectElement;
  const end = screen.getByLabelText('Destination node');
  expect(
    [...start.options].every((option) => option.value.startsWith('ocon-'))
  ).toBe(true);
  expect(document.querySelector('.route-line')).not.toBeNull();
  fireEvent.change(end, { target: { value: start.value } });
  expect(document.querySelector('.route-line')).toBeNull();
  expect(screen.queryByText('No route exists between these nodes.')).toBeNull();
  fireEvent.change(start, { target: { value: 'ocon-1-room-114' } });
  expect(document.querySelector('.route-line')).not.toBeNull();
});
