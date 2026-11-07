import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JourneyPlanner from '../../src/components/JourneyPlanner';

// Leaflet needs a browser renderer; exercise its real marker in the e2e suite.
vi.mock('../../src/components/CampusMap', () => ({
  default: ({
    journey,
    onEnter
  }: {
    journey: { outdoor: object | null } | null;
    onEnter: () => void;
  }) =>
    journey?.outdoor ? (
      <button onClick={onEnter}>Destination building node</button>
    ) : (
      <div>Campus map</div>
    )
}));
afterEach(cleanup);

function chooseRoute(
  destinationBuilding = 'langdon',
  destinationRoom = 'langdon-2-room-206'
) {
  fireEvent.change(screen.getByLabelText('From room'), {
    target: { value: 'ocon-1-room-114' }
  });
  fireEvent.change(screen.getByLabelText('To building'), {
    target: { value: destinationBuilding }
  });
  fireEvent.change(screen.getByLabelText('To room'), {
    target: { value: destinationRoom }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Get directions' }));
}

describe('journey planner', () => {
  it('shows both building maps immediately when directions are generated', () => {
    render(<JourneyPlanner />);
    chooseRoute();
    expect(
      screen.getByRole('img', { name: /O.Connell Technology Center, floor 1/ })
    ).toBeTruthy();
    expect(document.querySelector('details')).toBeNull();
    expect(
      screen.getByRole('heading', { name: /1. Leave O.Connell/ })
    ).toBeTruthy();
    expect(screen.getByRole('heading', { name: /3\. Langdon/ })).toBeTruthy();
    expect(
      screen.getByRole('img', { name: /Langdon Engineering Center, floor 1/ })
    ).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Floor 2' }).at(-1)!);
    expect(
      screen.getByRole('img', { name: /Langdon Engineering Center, floor 2/ })
    ).toBeTruthy();
  });
  it('shows same-building directions immediately and starts at the room floor', () => {
    render(<JourneyPlanner />);
    fireEvent.change(screen.getByLabelText('From room'), {
      target: { value: 'ocon-2-room-208' }
    });
    fireEvent.change(screen.getByLabelText('To room'), {
      target: { value: 'ocon-1-room-114' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Get directions' }));
    expect(
      screen.getByRole('img', { name: /O.Connell Technology Center, floor 2/ })
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Destination building node' })
    ).toBeNull();
  });
  it('clears stale directions and resets the room when its building changes', () => {
    render(<JourneyPlanner />);
    chooseRoute();
    fireEvent.click(
      screen.getByRole('button', { name: 'Destination building node' })
    );
    fireEvent.change(screen.getByLabelText('To building'), {
      target: { value: 'ayres' }
    });
    expect((screen.getByLabelText('To room') as HTMLSelectElement).value).toBe(
      ''
    );
    expect(
      screen.queryByRole('heading', { name: 'Your directions' })
    ).toBeNull();
  });
});
