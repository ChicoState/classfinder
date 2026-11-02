import { describe, expect, it } from 'vitest';
import floor1 from '../../src/data/butte/floor-1.json';
import floor2 from '../../src/data/butte/floor-2.json';
import floor3 from '../../src/data/butte/floor-3.json';
import floor4 from '../../src/data/butte/floor-4.json';
import floor5 from '../../src/data/butte/floor-5.json';
import connections from '../../src/data/butte/connections.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

const floors = [floor1, floor2, floor3, floor4, floor5];
const serializedNodes = floors.flatMap((floor) => floor.nodes);
const serializedEdges = [
  ...floors.flatMap((floor) => floor.edges),
  ...connections.edges
];
const southeastComponent = new Set([
  'butte-1-exit-southeast-stairs',
  'butte-1-southeast-landing',
  'butte-1-custodian-southeast',
  'butte-1-stairs-southeast'
]);

describe('Butte floor plans', () => {
  it('loads unique finite doorway nodes and expands each valid edge twice', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(new Set(serializedNodes.map((node) => node.id)).size).toBe(
      serializedNodes.length
    );
    const pairs = new Set<string>();
    for (const node of serializedNodes) {
      expect(nodes.get(node.id as NodeId)).toEqual(node);
      expect(node.buildingId).toBe('butte');
      expect(
        Number.isFinite(node.position.x) && Number.isFinite(node.position.y)
      ).toBe(true);
    }
    for (const edge of serializedEdges) {
      const pair = [edge.from, edge.to].sort().join('|');
      expect(pairs.has(pair)).toBe(false);
      pairs.add(pair);
      expect(edge.from).not.toBe(edge.to);
      expect(edge).not.toHaveProperty('distance');
      const from = nodes.get(edge.from as NodeId)!;
      const to = nodes.get(edge.to as NodeId)!;
      const distance = Math.hypot(
        from.position.x - to.position.x,
        from.position.y - to.position.y
      );
      const { from: fromId, to: toId, ...attributes } = edge;
      expect(graph.get(fromId as NodeId)).toContainEqual({
        ...attributes,
        to: toId,
        distance
      });
      expect(graph.get(toId as NodeId)).toContainEqual({
        ...attributes,
        to: fromId,
        distance
      });
    }
    expect(
      [...graph]
        .filter(([id]) => id.startsWith('butte-'))
        .flatMap(([, edges]) => edges)
    ).toHaveLength(2 * serializedEdges.length);
    expect(nodes.get('butte-1-exit-north-east-ao' as NodeId)?.position).toEqual(
      { x: 0, y: 0 }
    );
  });

  it('routes across all five floors while preserving the separate first-floor stair entrance', () => {
    const [graph, nodes] = loadGraphFromData();
    const origin = nodes.get('butte-1-exit-north-east-ao' as NodeId)!;
    for (const floor of floors) {
      const localNodes = new Map(
        [...nodes].filter(
          ([, node]) =>
            node.buildingId === 'butte' && node.floorId === floor.metadata.floor
        )
      );
      const localGraph = new Map(
        [...graph]
          .filter(([id]) => localNodes.has(id))
          .map(([id, edges]) => [
            id,
            edges.filter((edge) => localNodes.has(edge.to))
          ])
      );
      const start = nodes.get(floor.nodes[0].id as NodeId)!;
      expect(
        findNodeNearPosition(
          localNodes,
          start.position.x,
          start.position.y,
          start.floorId
        )?.id
      ).toBe(start.id);
      for (const goal of localNodes.values()) {
        const localPath = calculatePath(localGraph, start, goal);
        if (southeastComponent.has(goal.id)) expect(localPath).toBeNull();
        else expect(localPath, goal.id).not.toBeNull();
        expect(calculatePath(graph, origin, goal), goal.id).not.toBeNull();
        expect(calculatePath(graph, goal, origin), goal.id).not.toBeNull();
      }
      for (const edge of floor.edges) {
        expect(nodes.get(edge.from as NodeId)?.floorId).toBe(
          floor.metadata.floor
        );
        expect(nodes.get(edge.to as NodeId)?.floorId).toBe(
          floor.metadata.floor
        );
      }
    }
    const route = calculatePath(
      graph,
      origin,
      nodes.get('butte-1-stairs-southeast' as NodeId)!
    );
    expect(route?.some((edge) => edge.type === 'stairs')).toBe(true);
  });

  it('limits northern stair flights to floors 1–3 and other transfers to adjacent floors', () => {
    expect(connections.edges).toHaveLength(16);
    for (const edge of connections.edges) {
      const [, fromFloor, ...fromPurpose] = edge.from.split('-');
      const [, toFloor, ...toPurpose] = edge.to.split('-');
      expect(Number(toFloor) - Number(fromFloor)).toBe(1);
      expect(fromPurpose).toEqual(toPurpose);
      if (edge.from.includes('stairs-north'))
        expect(Number(toFloor)).toBeLessThanOrEqual(3);
      if (edge.type === 'stairs') expect(edge.isAccessible).toBe(false);
      else expect(edge).not.toHaveProperty('isAccessible');
      expect(edge.from).not.toContain('unresolved');
    }
    const ids = serializedNodes.map((node) => node.id);
    expect(ids.some((id) => /butte-[45]-stairs-north/.test(id))).toBe(false);
  });

  it('preserves parent-room destinations and all shown numbered floor-five rooms', () => {
    const neighbors = (id: string) =>
      serializedEdges.flatMap((edge) =>
        edge.from === id ? [edge.to] : edge.to === id ? [edge.from] : []
      );
    expect(neighbors('butte-3-room-303A')).toEqual(['butte-3-circulation-303']);
    expect(neighbors('butte-4-room-421E')).toEqual([
      'butte-4-circulation-421-middle'
    ]);
    expect(neighbors('butte-5-room-501B')).toEqual([
      'butte-5-circulation-501-middle'
    ]);
    expect(neighbors('butte-5-room-543D')).toEqual(['butte-5-circulation-543']);
    const ids = new Set(floor5.nodes.map((node) => node.id));
    for (let room = 501; room <= 543; room += 2)
      expect(ids.has(`butte-5-room-${room}`)).toBe(true);
    for (const room of [502, 504, 506, 508, 512, 518])
      expect(ids.has(`butte-5-room-${room}`)).toBe(true);
  });
});
