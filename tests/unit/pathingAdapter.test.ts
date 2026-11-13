import { describe, expect, it } from 'vitest';

import { getReadableInstructions } from '../../src/pathingAdapter';
import type { NodeId } from '../../src/lib/graph';
import { calculatePath } from '../../src/lib/dijkstras';
import { loadGraphFromData } from '../../src/graph/graphLoader';

const [graph, loadedNodes] = loadGraphFromData();

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
        ...loadedNodes.get('ocon-1-exit-lower-ao' as NodeId)!,
        instruction: 'Go through the doorway.'
      },
      {
        ...loadedNodes.get('ocon-1-lobby-lower' as NodeId)!,
        instruction: 'You have arrived.'
      }
    ]);
  });

  it('returns a destination instruction when the route has no edges', () => {
    expect(
      instructionsBetween('ocon-1-exit-lower-ao', 'ocon-1-exit-lower-ao')
    ).toEqual([
      {
        ...loadedNodes.get('ocon-1-exit-lower-ao' as NodeId)!,
        instruction: 'You have arrived.'
      }
    ]);
  });
});

it('preserves all route nodes while keeping instructions grouped', () => {
  const start = loadedNodes.get('ocon-1-exit-lower-ao' as NodeId)!;
  const end = loadedNodes.get('ocon-2-room-208' as NodeId)!;
  const path = calculatePath(graph, start, end)!;
  const route = instructionsBetween(start.id, end.id)!;
  expect(route).toEqual(
    [start, ...path.map((edge) => loadedNodes.get(edge.to)!)].map((node) =>
      expect.objectContaining(node)
    )
  );
  expect(route.some((node) => node.instruction === undefined)).toBe(true);
  expect(route.at(-1)?.instruction).toBe('You have arrived.');
});
