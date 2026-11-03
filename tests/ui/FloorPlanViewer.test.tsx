import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import FloorPlanViewer from '../../src/components/FloorPlanViewer';
import { oconnellBuilding } from '../../src/buildings/oconnell';
import { toGlobalPosition } from '../../src/graph/coordinates';
import type { Building } from '../../src/buildings/types';
import type { Node, NodeId } from '../../src/lib/graph';

afterEach(cleanup);

it('projects global route nodes onto the correct building floor plan', () => {
  const routeNodes: Node[] = [
    {
      id: 'start' as NodeId,
      buildingId: 'ocon',
      floorId: 1,
      position: toGlobalPosition({ x: 0, y: 0 }, 'ocon')
    },
    {
      id: 'end' as NodeId,
      buildingId: 'ocon',
      floorId: 1,
      position: toGlobalPosition({ x: 10, y: 0 }, 'ocon')
    },
    {
      id: 'other' as NodeId,
      buildingId: 'lang',
      floorId: 1,
      position: toGlobalPosition({ x: 0, y: 0 }, 'lang')
    }
  ];
  const { container } = render(
    <FloorPlanViewer building={oconnellBuilding} routeNodes={routeNodes} />
  );
  const points = container
    .querySelector('polyline')!
    .getAttribute('points')!
    .split(' ')
    .map((point) => point.split(',').map(Number));
  expect(points).toHaveLength(2);
  const plan = oconnellBuilding.floors[0];
  expect(points[0][0]).toBeCloseTo(
    plan.pdfOrigin.x * plan.pdfPointToImageScale
  );
  expect(points[0][1]).toBeCloseTo(
    plan.pdfOrigin.y * plan.pdfPointToImageScale
  );
  expect(points[1][0]).toBeCloseTo(
    (plan.pdfOrigin.x + 10 / plan.feetPerPdfPoint) * plan.pdfPointToImageScale
  );
});

const building: Building = {
  id: 'test',
  graphBuildingId: 'ocon',
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
  {
    id: 'a',
    buildingId: 'ocon',
    floorId: 1,
    position: toGlobalPosition({ x: 0, y: 0 }, 'ocon')
  },
  {
    id: 'b',
    buildingId: 'ocon',
    floorId: 1,
    position: toGlobalPosition({ x: 4, y: 8 }, 'ocon')
  },
  {
    id: 'c',
    buildingId: 'ocon',
    floorId: 2,
    position: toGlobalPosition({ x: 2, y: 2 }, 'ocon')
  }
] as Node[];

it('projects route coordinates and limits the route to the selected floor', () => {
  render(<FloorPlanViewer building={building} routeNodes={routeNodes} />);
  const plan = screen.getByRole('img', { name: 'Test Hall, floor 1' });
  const points = plan
    .querySelector('polyline')!
    .getAttribute('points')!
    .split(' ')
    .map((point) => point.split(',').map(Number));
  expect(points).toHaveLength(2);
  for (const [index, expected] of [
    [30, 60],
    [36, 48]
  ].entries()) {
    expect(points[index][0]).toBeCloseTo(expected[0]);
    expect(points[index][1]).toBeCloseTo(expected[1]);
  }
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
