import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import FloorPlanViewer from '../../src/components/FloorPlanViewer';
import { oconnellBuilding } from '../../src/buildings/oconnell';
import { toGlobalPosition } from '../../src/graph/coordinates';
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
