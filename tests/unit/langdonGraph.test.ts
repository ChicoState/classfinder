import { describe, expect, it } from 'vitest';
import floor1 from '../../src/data/langdon/floor-1.json';
import floor2 from '../../src/data/langdon/floor-2.json';
import floor3 from '../../src/data/langdon/floor-3.json';
import connections from '../../src/data/langdon/connections.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

const floors = [floor1, floor2, floor3];
const serializedNodes = floors.flatMap((floor) => floor.nodes);
const serializedEdges = [
  ...floors.flatMap((floor) => floor.edges),
  ...connections.edges
];

describe('Langdon floor plans', () => {
  it('loads unique, finite nodes and two-way coordinate-derived edges', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(new Set(serializedNodes.map((node) => node.id)).size).toBe(
      serializedNodes.length
    );
    const pairs = new Set<string>();
    for (const node of serializedNodes) {
      expect(nodes.get(node.id as NodeId)).toEqual(node);
      expect(node.buildingId).toBe('langdon');
      expect(
        Number.isFinite(node.position.x) && Number.isFinite(node.position.y)
      ).toBe(true);
    }
    for (const edge of serializedEdges) {
      const from = nodes.get(edge.from as NodeId)!;
      const to = nodes.get(edge.to as NodeId)!;
      const pair = [edge.from, edge.to].sort().join('|');
      expect(pairs.has(pair)).toBe(false);
      pairs.add(pair);
      expect(edge.from).not.toBe(edge.to);
      expect(edge).not.toHaveProperty('distance');
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
    expect(nodes.get('langdon-1-exit-north-wing' as NodeId)?.position).toEqual({
      x: 0,
      y: 0
    });
  });

  it('reaches every doorway within its own floor and across floors using real Dijkstra', () => {
    const [graph, nodes] = loadGraphFromData();
    const origin = nodes.get('langdon-1-exit-north-wing' as NodeId)!;
    for (const floor of floors) {
      const candidates = new Map(
        [...nodes].filter(
          ([, node]) =>
            node.buildingId === 'langdon' &&
            node.floorId === floor.metadata.floor
        )
      );
      const start = nodes.get(floor.nodes[0].id as NodeId)!;
      const snapped = findNodeNearPosition(
        candidates,
        start.position.x,
        start.position.y,
        start.floorId
      );
      expect(snapped?.id).toBe(start.id);
      const localGraph = new Map(
        [...graph]
          .filter(([id]) => candidates.has(id))
          .map(([id, edges]) => [
            id,
            edges.filter((edge) => candidates.has(edge.to))
          ])
      );
      for (const goal of candidates.values()) {
        expect(calculatePath(localGraph, start, goal), goal.id).not.toBeNull();
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
  });

  it('uses only the two corresponding stair cores and elevator on adjacent floors', () => {
    expect(connections.edges).toHaveLength(6);
    for (const edge of connections.edges) {
      const [, fromFloor, ...fromPurpose] = edge.from.split('-');
      const [, toFloor, ...toPurpose] = edge.to.split('-');
      expect(Number(toFloor) - Number(fromFloor)).toBe(1);
      expect(fromPurpose).toEqual(toPurpose);
      if (edge.type === 'stairs') expect(edge.isAccessible).toBe(false);
      else expect(edge).not.toHaveProperty('isAccessible');
    }
  });

  it('retains parent-room access for enclosed side rooms', () => {
    const neighbors = (id: string) =>
      serializedEdges.flatMap((edge) =>
        edge.from === id ? [edge.to] : edge.to === id ? [edge.from] : []
      );
    expect(neighbors('langdon-1-room-121A')).toEqual([
      'langdon-1-circulation-121'
    ]);
    expect(neighbors('langdon-1-room-118A')).toEqual([
      'langdon-1-circulation-118-south'
    ]);
    expect(neighbors('langdon-2-room-207D')).toEqual([
      'langdon-2-circulation-207-east'
    ]);
    expect(neighbors('langdon-2-room-205A')).toEqual([
      'langdon-2-circulation-205-west'
    ]);
    expect(neighbors('langdon-3-room-303A')).toEqual([
      'langdon-3-circulation-303-west'
    ]);
  });
});
