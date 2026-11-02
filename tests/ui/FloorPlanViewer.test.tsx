import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import FloorPlanViewer from '../../src/components/FloorPlanViewer';
import type { Building } from '../../src/buildings/types';
import type { Node } from '../../src/lib/graph';

afterEach(cleanup);
const building: Building = {
  id: 'test',
  graphBuildingId: 'test',
  name: 'Test Hall',
  demoRoute: { startNodeId: 'a', destinationNodeId: 'b' },
  floors: [1, 2].map((floor) => ({
    floor,
    image: `/floor-${floor}.png`,
    imageWidth: 200,
    imageHeight: 300,
    pdfOrigin: { x: 10, y: 20 },
    feetPerPdfPoint: 2,
    pdfPointToImageScale: 3
  }))
};
const routeNodes = [
  { id: 'a', buildingId: 'test', floorId: 1, position: { x: 0, y: 0 } },
  { id: 'b', buildingId: 'test', floorId: 1, position: { x: 4, y: 8 } },
  { id: 'c', buildingId: 'test', floorId: 2, position: { x: 2, y: 2 } }
] as Node[];

it('projects route coordinates and limits the route to the selected floor', () => {
  render(<FloorPlanViewer building={building} routeNodes={routeNodes} />);
  const plan = screen.getByRole('img', { name: 'Test Hall, floor 1' });
  expect(plan.querySelector('polyline')?.getAttribute('points')).toBe(
    '30,60 36,48'
  );
  fireEvent.click(screen.getByRole('tab', { name: 'Floor 2' }));
  expect(
    screen.getByRole('tab', { name: 'Floor 2' }).getAttribute('aria-selected')
  ).toBe('true');
  const second = screen.getByRole('img', { name: 'Test Hall, floor 2' });
  expect(second.querySelector('image')?.getAttribute('href')).toBe(
    '/floor-2.png'
  );
  expect(second.querySelector('polyline')).toBeNull();
});

it('removes the overlay when the route is cleared', () => {
  const { rerender } = render(
    <FloorPlanViewer building={building} routeNodes={routeNodes} />
  );
  rerender(<FloorPlanViewer building={building} routeNodes={[]} />);
  expect(screen.getByRole('img').querySelector('polyline')).toBeNull();
});
