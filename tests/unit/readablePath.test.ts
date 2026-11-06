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

function route(points: number[][], types: EdgeKind[], setup?: () => void) {
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
              distance: 10,
              weight: 1
            }
          ]
        : []
    );
  });
  setup?.();
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
  ).toEqual(['Continue for 30 feet along the corridor.', 'You have arrived.']);
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
      instruction: 'Continue for 10 feet along the corridor.'
    },
    {
      position: { x: 1, y: 0 },
      floorId: 1,
      instruction: 'Turn left and continue for 10 feet along the corridor.'
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
  ).toEqual(['Continue for 40 feet along the corridor.', 'You have arrived.']);
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

it('returns null when endpoint nodes have no connecting path', () => {
  expect(
    route(
      [
        [0, 0],
        [1, 0]
      ],
      []
    )
  ).toBeNull();
});

it('returns null when either requested floor has no nodes', () => {
  route(
    [
      [0, 0],
      [1, 0]
    ],
    ['door']
  );
  expect(getReadableInstructions(0, 0, 99, 1, 0, 1)).toBeNull();
  expect(getReadableInstructions(0, 0, 1, 1, 0, 99)).toBeNull();
});

function branch(
  index: number,
  dx: number,
  dy: number,
  type: EdgeKind = 'corridor'
) {
  const from = String(index) as NodeId;
  const junction = nodes.get(from)!;
  const id = `branch-${nodes.size}` as NodeId;
  nodes.set(id, {
    id,
    buildingId: junction.buildingId,
    floorId: junction.floorId,
    position: { x: junction.position.x + dx, y: junction.position.y + dy }
  });
  graph.set(id, []);
  graph.get(from)!.push({ to: id, distance: 1, weight: 1, type });
}

it.each([1, -1])(
  'counts only the relevant side, once per marked junction (%s)',
  (side) => {
    const instructions = route(
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
        [4, 0],
        [4, side]
      ],
      Array<EdgeKind>(5).fill('corridor'),
      () => {
        for (const index of [1, 2, 4])
          nodes.get(String(index) as NodeId)!.isJunction = true;
        branch(1, 0, side); // A passed relevant exit.
        branch(1, 0.5, side); // Same physical junction must count only once.
        branch(2, 0, -side); // Opposite side does not count.
        branch(2, 0, side, 'door');
        branch(2, 0, side, 'stairs');
        branch(2, 0, side, 'elevator');
        branch(3, 0, side); // Unmarked bend/door approach does not count.
      }
    );
    const direction = side === 1 ? 'left' : 'right';
    expect(instructions?.[0].instruction).toBe(
      `Continue for 40 feet along the corridor. Take the second ${direction}.`
    );
    expect(instructions?.[1].position).toEqual({ x: 4, y: 0 });
    expect(instructions?.[1].instruction).toBe(
      `Turn ${direction} and continue for 10 feet along the corridor.`
    );
  }
);

it.each([
  [0, 'first'],
  [2, 'third'],
  [10, '11th'],
  [11, '12th'],
  [12, '13th'],
  [20, '21st']
])('formats an ordinal after %s eligible junctions', (passed, ordinal) => {
  const count = Number(passed);
  const points = Array.from({ length: count + 2 }, (_, x) => [x, 0]);
  points.push([count + 1, 1]);
  const instructions = route(
    points,
    Array<EdgeKind>(points.length - 1).fill('corridor'),
    () => {
      for (let i = 1; i <= count + 1; i++) {
        nodes.get(String(i) as NodeId)!.isJunction = true;
        if (i <= count) branch(i, 0, 1);
      }
    }
  );
  expect(instructions?.[0].instruction).toBe(
    `Continue for ${(count + 1) * 10} feet along the corridor. Take the ${ordinal} left.`
  );
});

it('resets counts after a doorway', () => {
  const instructions = route(
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [4, 1]
    ],
    ['corridor', 'corridor', 'door', 'corridor', 'corridor'],
    () => {
      nodes.get('1' as NodeId)!.isJunction = true;
      nodes.get('4' as NodeId)!.isJunction = true;
      branch(1, 0, 1);
    }
  );
  expect(instructions?.map((node) => node.instruction)).toEqual([
    'Continue for 20 feet along the corridor.',
    'Go through the doorway.',
    'Continue for 10 feet along the corridor. Take the first left.',
    'Turn left and continue for 10 feet along the corridor.',
    'You have arrived.'
  ]);
});

it('uses the incoming heading rather than fixed map axes', () => {
  const instructions = route(
    [
      [0, 4],
      [0, 3],
      [0, 2],
      [0, 1],
      [1, 1]
    ],
    Array<EdgeKind>(4).fill('corridor'),
    () => {
      for (const index of [1, 2, 3])
        nodes.get(String(index) as NodeId)!.isJunction = true;
      branch(1, 1, 0, 'ramp'); // East is left when walking south.
      branch(2, -1, 0);
      branch(2, 0, 0); // Degenerate geometry is not an exit heading.
    }
  );
  expect(instructions?.[0].instruction).toBe(
    'Continue for 30 feet along the corridor. Take the second left.'
  );
});

it('ignores straight/backward branches and nodes on another floor or building', () => {
  const instructions = route(
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1]
    ],
    Array<EdgeKind>(3).fill('corridor'),
    () => {
      nodes.get('1' as NodeId)!.isJunction = true;
      nodes.get('2' as NodeId)!.isJunction = true;
      branch(1, 1, 0.1);
      branch(1, -1, 0.1);
      branch(1, 0, 1);
      [...nodes.values()].at(-1)!.floorId = 2;
      branch(1, 0, 1);
      [...nodes.values()].at(-1)!.buildingId = 'other';
    }
  );
  expect(instructions?.[0].instruction).toBe(
    'Continue for 20 feet along the corridor. Take the first left.'
  );
});

it('starts a new count after taking a turn', () => {
  const instructions = route(
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
      [1, 2]
    ],
    Array<EdgeKind>(5).fill('corridor'),
    () => {
      for (const index of [1, 2, 4])
        nodes.get(String(index) as NodeId)!.isJunction = true;
      branch(1, 0, 1);
    }
  );
  expect(instructions?.map((node) => node.instruction)).toEqual([
    'Continue for 20 feet along the corridor. Take the second left.',
    'Turn left and continue for 20 feet along the corridor. Take the first left.',
    'Turn left and continue for 10 feet along the corridor.',
    'You have arrived.'
  ]);
});

it.each([
  [1, 'Go through the doorway on your left.'],
  [-1, 'Go through the doorway on your right.']
])(
  'describes a doorway relative to the incoming heading (%s)',
  (side, expected) => {
    const instructions = route(
      [
        [0, 0],
        [1, 0],
        [1, Number(side)]
      ],
      ['corridor', 'door']
    );
    expect(instructions?.[1].instruction).toBe(expected);
  }
);

it('describes a doorway behind the incoming heading', () => {
  const instructions = route(
    [
      [0, 0],
      [2, 0],
      [1, 0]
    ],
    ['corridor', 'door']
  );
  expect(instructions?.[1].instruction).toBe(
    'Turn around and go through the doorway.'
  );
});

it('uses a neutral doorway instruction without an incoming heading', () => {
  expect(
    route(
      [
        [0, 0],
        [1, 0]
      ],
      ['door']
    )?.[0].instruction
  ).toBe('Go through the doorway.');
});
