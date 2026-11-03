import { beforeEach, expect, it, vi } from 'vitest';
import type { EdgeKind, Graph, NodeId, Nodes } from '../../src/lib/graph';

const { graph, nodes } = vi.hoisted(() => ({
  graph: new Map() as Graph,
  nodes: new Map() as Nodes
}));
vi.mock('../../src/graph/graphLoader', () => ({
  loadGraphFromData: () => [graph, nodes]
}));
import { getReadableInstructions } from '../../src/pathingAdapter';

beforeEach(() => {
  graph.clear();
  nodes.clear();
});

function route(points: number[][], types: EdgeKind[]) {
  points.forEach(([x, y, floorId = 1], index) => {
    const id = String(index) as NodeId;
    nodes.set(id, { id, position: { x, y }, floorId, buildingId: 'test' });
    graph.set(
      id,
      index < types.length
        ? [
            {
              to: String(index + 1) as NodeId,
              type: types[index],
              distance: 1,
              weight: 1
            }
          ]
        : []
    );
  });
  const [x, y, floor = 1] = points[0];
  const [endX, endY, endFloor = 1] = points.at(-1)!;
  return getReadableInstructions(x, y, floor, endX, endY, endFloor);
}

it('groups a straight corridor into one instruction', () => {
  expect(
    route(
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0]
      ],
      ['corridor', 'corridor', 'corridor']
    )?.map((node) => node.instruction)
  ).toEqual(['Continue along the corridor.', 'You have arrived.']);
});

it('places a sharp turn at the junction instead of the start', () => {
  expect(
    route(
      [
        [0, 0],
        [1, 0],
        [1, 1]
      ],
      ['corridor', 'corridor']
    )
  ).toEqual([
    {
      position: { x: 0, y: 0 },
      floorId: 1,
      instruction: 'Continue along the corridor.'
    },
    {
      position: { x: 1, y: 0 },
      floorId: 1,
      instruction: 'Turn left and continue along the corridor.'
    },
    { position: { x: 1, y: 1 }, floorId: 1, instruction: 'You have arrived.' }
  ]);
});

it('groups gradual bends without turning early', () => {
  const points = [[0, 0]];
  for (const degrees of [0, 20, 40, 60]) {
    const [x, y] = points.at(-1)!;
    points.push([
      x + Math.cos((degrees * Math.PI) / 180),
      y + Math.sin((degrees * Math.PI) / 180)
    ]);
  }
  expect(
    route(points, Array<EdgeKind>(4).fill('corridor'))?.map(
      (node) => node.instruction
    )
  ).toEqual(['Continue along the corridor.', 'You have arrived.']);
});

it('groups an elevator ride to its final floor', () => {
  expect(
    route(
      [
        [0, 0, 1],
        [0, 0, 2],
        [0, 0, 3],
        [0, 0, 4]
      ],
      ['elevator', 'elevator', 'elevator']
    )?.map((node) => node.instruction)
  ).toEqual(['Take the elevator to floor 4.', 'You have arrived.']);
});
