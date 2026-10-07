import { describe, expect, it } from 'vitest';

import { connectBothWays } from '../../src/graph/graphLoader';
import type { Graph, NodeId } from '../../src/lib/graph';

describe('connectBothWays', () => {
  it('adds matching edges to both existing nodes', () => {
    const entrance = 'entrance' as NodeId;
    const hallway = 'hallway' as NodeId;
    const graph: Graph = new Map([
      [entrance, []],
      [hallway, []]
    ]);

    connectBothWays(graph, entrance, hallway, {
      distance: 12,
      weight: 1,
      type: 'door'
    });

    expect(graph.get(entrance)).toEqual([
      {
        to: hallway,
        distance: 12,
        weight: 1,
        type: 'door'
      }
    ]);
    expect(graph.get(hallway)).toEqual([
      {
        to: entrance,
        distance: 12,
        weight: 1,
        type: 'door'
      }
    ]);
  });

  it('rejects an edge when either node is absent', () => {
    const entrance = 'entrance' as NodeId;
    const hallway = 'hallway' as NodeId;
    const graph: Graph = new Map([[entrance, []]]);

    expect(() =>
      connectBothWays(graph, entrance, hallway, {
        distance: 12,
        weight: 1,
        type: 'door'
      })
    ).toThrow('Both nodes must be added to the graph first.');
  });
});
