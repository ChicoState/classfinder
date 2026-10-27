import { describe, expect, it } from 'vitest';

import {
  getNextInstruction,
  getReadableInstructions,
  gpsToCampusPosition
} from '../../src/pathingAdapter';
import type { PathEdge } from '../../src/lib/dijkstras';
import type { Node, NodeId, Nodes } from '../../src/lib/graph';
import { loadGraphFromData } from '../../src/graph/graphLoader';

const [, loadedNodes] = loadGraphFromData();

describe('gpsToCampusPosition', () => {
  it('maps the campus GPS origin to zero feet', () => {
    expect(gpsToCampusPosition(39.7276776, -121.8456054)).toEqual({
      x: 0,
      y: 0
    });
  });

  it.each([
    [39.7275422, -121.8473296, -484.96, -49.32],
    [39.727985, -121.847773, -609.67, 111.98]
  ])(
    'matches stored outdoor geometry for latitude %s, longitude %s',
    (latitude, longitude, x, y) => {
      const position = gpsToCampusPosition(latitude, longitude);
      expect(position.x).toBeCloseTo(x, 2);
      expect(position.y).toBeCloseTo(y, 2);
    }
  );
});

function instructionsBetween(
  startId: string,
  endId: string,
  buildingId = 'ocon'
) {
  const start = loadedNodes.get(startId as NodeId)!;
  const end = loadedNodes.get(endId as NodeId)!;
  return getReadableInstructions(
    start.position.x,
    start.position.y,
    start.floorId,
    end.position.x,
    end.position.y,
    end.floorId,
    buildingId
  );
}

function createNode(id: NodeId, x: number, y: number, floorId = 1): Node {
  return {
    id,
    buildingId: 'test',
    floorId,
    position: { x, y }
  };
}

function createEdge(
  from: NodeId,
  to: NodeId,
  type: PathEdge['type']
): PathEdge {
  return { from, to, distance: 1, weight: 1, type };
}

describe('getNextInstruction', () => {
  const previous = 'previous' as NodeId;
  const current = 'current' as NodeId;
  const next = 'next' as NodeId;

  it('describes the first corridor edge without a turn', () => {
    const nodes: Nodes = new Map([
      [current, createNode(current, 0, 0)],
      [next, createNode(next, 1, 0)]
    ]);

    expect(
      getNextInstruction(null, createEdge(current, next, 'corridor'), nodes)
    ).toBe('Continue along the corridor.');
  });

  it.each([
    ['straight', { x: 2, y: 0 }, 'Continue along the corridor.'],
    ['left', { x: 1, y: 1 }, 'Turn left and continue along the corridor.'],
    ['right', { x: 1, y: -1 }, 'Turn right and continue along the corridor.'],
    ['around', { x: 0, y: 0 }, 'Turn around and continue along the corridor.']
  ])('describes a %s corridor turn', (_turn, position, instruction) => {
    const nodes: Nodes = new Map([
      [previous, createNode(previous, 0, 0)],
      [current, createNode(current, 1, 0)],
      [next, createNode(next, position.x, position.y)]
    ]);

    expect(
      getNextInstruction(
        createEdge(previous, current, 'corridor'),
        createEdge(current, next, 'corridor'),
        nodes
      )
    ).toBe(instruction);
  });

  it.each([
    ['stairs', 'Take the stairs.'],
    ['elevator', 'Take the elevator.']
  ] as const)(
    'omits a floor number for a same-floor %s edge',
    (type, instruction) => {
      const nodes: Nodes = new Map([
        [current, createNode(current, 1, 0)],
        [next, createNode(next, 1, 1)]
      ]);

      expect(
        getNextInstruction(null, createEdge(current, next, type), nodes)
      ).toBe(instruction);
    }
  );

  it('uses turn wording for outdoor edges', () => {
    const nodes: Nodes = new Map([
      [previous, createNode(previous, 0, 0)],
      [current, createNode(current, 1, 0)],
      [next, createNode(next, 1, -1)]
    ]);

    expect(
      getNextInstruction(
        createEdge(previous, current, 'outdoor'),
        createEdge(current, next, 'outdoor'),
        nodes
      )
    ).toBe('Turn right and continue outdoors.');
  });

  it.each([
    ['door', 'Go through the doorway.'],
    ['ramp', 'Use the ramp.'],
    ['stairs', 'Take the stairs to floor 2.'],
    ['elevator', 'Take the elevator to floor 2.']
  ] as const)('uses generic wording for a %s edge', (type, instruction) => {
    const nodes: Nodes = new Map([
      [previous, createNode(previous, 0, 0)],
      [current, createNode(current, 1, 0)],
      [next, createNode(next, 1, 1, 2)]
    ]);

    expect(
      getNextInstruction(
        createEdge(previous, current, 'corridor'),
        createEdge(current, next, type),
        nodes
      )
    ).toBe(instruction);
  });

  it('does not infer a turn after a non-directional edge', () => {
    const nodes: Nodes = new Map([
      [previous, createNode(previous, 0, 0)],
      [current, createNode(current, 1, 0)],
      [next, createNode(next, 1, 1)]
    ]);

    expect(
      getNextInstruction(
        createEdge(previous, current, 'door'),
        createEdge(current, next, 'corridor'),
        nodes
      )
    ).toBe('Continue along the corridor.');
  });
});

describe('getReadableInstructions', () => {
  it('selects Langdon explicitly using loaded global coordinates', () => {
    const route = instructionsBetween(
      'lang-1-exit-119-west',
      'lang-1-room-119',
      'lang'
    );
    expect(route?.[0]?.position).toEqual(
      loadedNodes.get('lang-1-exit-119-west' as NodeId)!.position
    );
    expect(route?.at(-1)?.position).toEqual(
      loadedNodes.get('lang-1-room-119' as NodeId)!.position
    );
  });

  it('returns null for an unknown building', () => {
    expect(getReadableInstructions(0, 0, 1, 0, 0, 1, 'unknown')).toBeNull();
  });

  it('returns an instruction for each edge followed by the destination', () => {
    expect(
      instructionsBetween('ocon-1-exit-lower-ao', 'ocon-1-lobby-lower')
    ).toEqual([
      {
        position: loadedNodes.get('ocon-1-exit-lower-ao' as NodeId)!.position,
        floorId: 1,
        instruction: 'Go through the doorway.'
      },
      {
        position: loadedNodes.get('ocon-1-lobby-lower' as NodeId)!.position,
        floorId: 1,
        instruction: 'You have arrived.'
      }
    ]);
  });

  it('returns a destination instruction when the route has no edges', () => {
    expect(
      instructionsBetween('ocon-1-exit-lower-ao', 'ocon-1-exit-lower-ao')
    ).toEqual([
      {
        position: loadedNodes.get('ocon-1-exit-lower-ao' as NodeId)!.position,
        floorId: 1,
        instruction: 'You have arrived.'
      }
    ]);
  });
});
