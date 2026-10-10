import { describe, expect, it } from 'vitest';

import {
  getNextInstruction,
  getReadableInstructions
} from '../../src/pathingAdapter';
import type { PathEdge } from '../../src/lib/dijkstras';
import type { Node, NodeId, Nodes } from '../../src/lib/graph';

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
  it('returns an instruction for each edge followed by the destination', () => {
    expect(getReadableInstructions(0, 0, 1, -13.08, 6.55, 1)).toEqual([
      {
        position: { x: 0, y: 0 },
        floorId: 1,
        instruction: 'Go through the doorway.'
      },
      {
        position: { x: -13.08, y: 6.55 },
        floorId: 1,
        instruction: 'You have arrived.'
      }
    ]);
  });

  it('returns a destination instruction when the route has no edges', () => {
    expect(getReadableInstructions(0, 0, 1, 0, 0, 1)).toEqual([
      {
        position: { x: 0, y: 0 },
        floorId: 1,
        instruction: 'You have arrived.'
      }
    ]);
  });
});

console.table(
  getReadableInstructions(0, 0, 1, -24.38, 177.47, 4)
);
