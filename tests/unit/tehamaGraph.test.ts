import { describe, expect, it } from 'vitest';
import floor1 from '../../src/data/tehama/floor-1.json';
import floor2 from '../../src/data/tehama/floor-2.json';
import floor3 from '../../src/data/tehama/floor-3.json';
import connections from '../../src/data/tehama/connections.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { toGlobalPosition } from '../../src/graph/coordinates';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

const floors = [floor1, floor2, floor3];
const serializedNodes = floors.flatMap((floor) => floor.nodes);
const edges = [...floors.flatMap((floor) => floor.edges), ...connections.edges];

describe('Tehama floor-plan graphs', () => {
  it('has valid unique doorway nodes and edges with floor-local geometry in feet', () => {
    const nodes = new Map(serializedNodes.map((node) => [node.id, node]));
    expect(nodes.size).toBe(serializedNodes.length);
    expect(nodes.get('tehama-1-exit-north-ao')?.position).toEqual({
      x: 0,
      y: 0
    });
    for (const floor of floors) {
      expect(floor.metadata.feetPerPdfPoint).toBe(30 / 72);
      expect(floor.metadata.undirected).toBe(true);
      for (const node of floor.nodes) {
        expect(node.buildingId).toBe('tehama');
        expect(node.floorId).toBe(floor.metadata.floor);
        expect(Number.isFinite(node.position.x)).toBe(true);
        expect(Number.isFinite(node.position.y)).toBe(true);
      }
      for (const edge of floor.edges) {
        expect(nodes.get(edge.from)?.floorId).toBe(floor.metadata.floor);
        expect(nodes.get(edge.to)?.floorId).toBe(floor.metadata.floor);
      }
    }
    const pairs = new Set<string>();
    for (const edge of edges) {
      expect(nodes.has(edge.from)).toBe(true);
      expect(nodes.has(edge.to)).toBe(true);
      expect(edge.from).not.toBe(edge.to);
      expect(edge).not.toHaveProperty('distance');
      expect(edge.weight).toBe(1);
      expect(['corridor', 'door', 'stairs', 'elevator', 'outdoor']).toContain(
        edge.type
      );
      const pair = [edge.from, edge.to].sort().join('|');
      expect(pairs.has(pair), pair).toBe(false);
      pairs.add(pair);
    }
  });

  it('loads two directions with measured distances and routes to every destination', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(
      serializedNodes.reduce(
        (n, node) => n + graph.get(node.id as NodeId)!
          .filter((edge) => nodes.get(edge.to)?.buildingId === 'tehama').length,
        0
      )
    ).toBe(edges.length * 2);
    for (const { from, ...edge } of edges) {
      const a = nodes.get(from as NodeId)!;
      const b = nodes.get(edge.to as NodeId)!;
      const distance = Math.hypot(
        a.position.x - b.position.x,
        a.position.y - b.position.y
      );
      expect(graph.get(a.id)).toContainEqual({ ...edge, distance });
      expect(graph.get(b.id)).toContainEqual({ ...edge, to: from, distance });
    }
    const entrance = nodes.get('tehama-1-exit-north-ao' as NodeId)!;
    for (const node of serializedNodes) {
      const goal = nodes.get(node.id as NodeId)!;
      expect(calculatePath(graph, entrance, goal), node.id).not.toBeNull();
      expect(calculatePath(graph, goal, entrance), node.id).not.toBeNull();
    }
    const candidates = new Map(
      [...nodes].filter(
        ([, node]) => node.buildingId === 'tehama' && node.floorId === 3
      )
    );
    const start = findNodeNearPosition(candidates, 0, 0, 3)!;
    expect(start.buildingId).toBe('tehama');
    expect(start.floorId).toBe(3);
    const route = calculatePath(
      graph,
      entrance,
      nodes.get('tehama-3-room-357' as NodeId)!
    )!;
    expect(
      route.some((edge) => edge.type === 'stairs' || edge.type === 'elevator')
    ).toBe(true);
  });

  it('keeps the west stair limited to floors 1–2 and preserves distinct elevator chains', () => {
    const [, nodes] = loadGraphFromData();
    expect(connections.edges).toHaveLength(9);
    for (const edge of connections.edges) {
      const a = nodes.get(edge.from as NodeId)!;
      const b = nodes.get(edge.to as NodeId)!;
      expect(b.floorId - a.floorId).toBe(1);
      expect(edge.from.replace(`-${a.floorId}-`, `-${b.floorId}-`)).toBe(
        edge.to
      );
      if (edge.type === 'stairs') expect(edge.isAccessible).toBe(false);
      else expect(edge).not.toHaveProperty('isAccessible');
    }
    expect(nodes.has('tehama-3-stairs-west' as NodeId)).toBe(false);
    for (const floor of [1, 2]) {
      for (const shaft of ['west', 'east']) {
        expect(connections.edges).toContainEqual({
          from: `tehama-${floor}-elevator-${shaft}`,
          to: `tehama-${floor + 1}-elevator-${shaft}`,
          type: 'elevator',
          weight: 1
        });
      }
    }
  });

  it('preserves interior-only room access and independent loads', () => {
    const [graph, nodes] = loadGraphFromData();
    for (const [room, parent] of [
      ['tehama-1-room-131A', 'tehama-1-room-131'],
      ['tehama-2-room-214', 'tehama-2-room-212'],
      ['tehama-3-room-322A', 'tehama-3-room-322'],
      ['tehama-3-room-301B', 'tehama-3-suite-303-inside']
    ]) {
      expect(graph.get(room as NodeId)?.map((edge) => edge.to)).toEqual([
        parent
      ]);
    }
    nodes.get('tehama-1-exit-north-ao' as NodeId)!.position.x = 999;
    graph.get('tehama-1-exit-north-ao' as NodeId)!.length = 0;
    const [freshGraph, freshNodes] = loadGraphFromData();
    expect(
      freshNodes.get('tehama-1-exit-north-ao' as NodeId)!.position
    ).toEqual(toGlobalPosition({ x: 0, y: 0 }, 'tehama'));
    expect(
      freshGraph.get('tehama-1-exit-north-ao' as NodeId)!
        .find((edge) => edge.to === 'tehama-1-hall-north-724')?.isAccessible
    ).toBe(true);
  });
});
