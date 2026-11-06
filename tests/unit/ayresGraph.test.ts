import { describe, expect, it } from 'vitest';
import floor1 from '../../src/data/ayres/floor-1.json';
import floor2 from '../../src/data/ayres/floor-2.json';
import connections from '../../src/data/ayres/connections.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { toGlobalPosition } from '../../src/graph/coordinates';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

const floors = [floor1, floor2];
const serializedNodes = floors.flatMap((floor) => floor.nodes);
const serializedEdges = [
  ...floors.flatMap((floor) => floor.edges),
  ...connections.edges
];
const id = (name: string) => name as NodeId;

describe('Ayres floor plans', () => {
  it('loads valid unique geometry and expands each edge with its attributes', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(new Set(serializedNodes.map((node) => node.id)).size).toBe(189);
    expect(serializedNodes).toHaveLength(189);
    const pairs = new Set<string>();
    for (const floor of floors) {
      for (const node of floor.nodes) {
        expect(node.buildingId).toBe('ayres');
        expect(node.floorId).toBe(floor.metadata.floorId);
        expect(
          Number.isFinite(node.position.x) && Number.isFinite(node.position.y)
        ).toBe(true);
      }
      for (const edge of floor.edges) {
        expect(nodes.get(id(edge.from))?.floorId).toBe(floor.metadata.floorId);
        expect(nodes.get(id(edge.to))?.floorId).toBe(floor.metadata.floorId);
      }
    }
    for (const edge of serializedEdges) {
      const { from, ...attributes } = edge;
      const a = nodes.get(id(from))!;
      const b = nodes.get(id(edge.to))!;
      expect(a).toBeDefined();
      expect(b).toBeDefined();
      expect(from).not.toBe(edge.to);
      const pair = [from, edge.to].sort().join('|');
      expect(pairs.has(pair)).toBe(false);
      pairs.add(pair);
      expect(edge).not.toHaveProperty('distance');
      expect(edge.weight).toBe(1);
      const distance = Math.hypot(
        a.position.x - b.position.x,
        a.position.y - b.position.y
      );
      expect(Number.isFinite(distance)).toBe(true);
      expect(graph.get(a.id)).toContainEqual({ ...attributes, distance });
      expect(graph.get(b.id)).toContainEqual({
        ...attributes,
        to: a.id,
        distance
      });
    }
    expect(serializedEdges).toHaveLength(191);
    expect(
      [...graph]
        .filter(([key]) => key.startsWith('ayres-'))
        .flatMap(([, edges]) =>
          edges.filter((edge) => nodes.get(edge.to)?.buildingId === 'ayres')
        )
    ).toHaveLength(382);
    expect(nodes.get(id(floor1.metadata.origin.nodeId))?.position).toEqual(
      toGlobalPosition({ x: 0, y: 0 }, 'ayres')
    );
  });

  it('routes through both floors while preserving the documented exterior-only components', () => {
    const [graph, nodes] = loadGraphFromData();
    const entrance = nodes.get(id('ayres-1-entrance-northwest'))!;
    const indoorGraph = new Map(
      [...graph]
        .filter(([from]) => nodes.get(from)?.buildingId === 'ayres')
        .map(([from, edges]) => [
          from,
          edges.filter((edge) => nodes.get(edge.to)?.buildingId === 'ayres')
        ])
    );
    const isolated = new Set([
      'ayres-1-room-129A',
      'ayres-1-room-129B',
      'ayres-1-room-120',
      'ayres-1-room-120-interior',
      'ayres-1-room-120A-interior',
      'ayres-1-room-120B',
      'ayres-1-room-120B-interior',
      'ayres-1-entrance-studio-120B',
      'ayres-1-entrance-studio-south',
      'ayres-1-stairs-studio-120'
    ]);
    for (const node of serializedNodes) {
      const destination = nodes.get(id(node.id))!;
      if (isolated.has(node.id)) {
        expect(
          calculatePath(indoorGraph, entrance, destination),
          node.id
        ).toBeNull();
        expect(
          calculatePath(graph, entrance, destination),
          node.id
        ).not.toBeNull();
        expect(
          calculatePath(graph, destination, entrance),
          node.id
        ).not.toBeNull();
      } else {
        expect(
          calculatePath(graph, entrance, destination),
          node.id
        ).not.toBeNull();
        expect(
          calculatePath(graph, destination, entrance),
          node.id
        ).not.toBeNull();
      }
    }
    const studio = nodes.get(id('ayres-1-entrance-studio-south'))!;
    expect(
      calculatePath(
        graph,
        studio,
        nodes.get(id('ayres-1-entrance-studio-120B'))!
      )
    ).not.toBeNull();
    const parentRooms = [
      ['ayres-1-room-101A', 'ayres-1-room-101'],
      ['ayres-1-room-107C', 'ayres-1-room-107'],
      ['ayres-2-room-205B', 'ayres-2-room-205-east'],
      ['ayres-2-room-213A', 'ayres-2-room-213']
    ];
    for (const [child, parent] of parentRooms) {
      expect(
        calculatePath(graph, entrance, nodes.get(id(child))!)?.map(
          (edge) => edge.to
        )
      ).toContain(parent);
    }
  });

  it('connects only matching adjacent-floor cores and supports floor-aware starting candidates', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(connections.edges).toHaveLength(3);
    for (const edge of connections.edges) {
      const from = nodes.get(id(edge.from))!;
      const to = nodes.get(id(edge.to))!;
      expect(from.floorId).toBe(1);
      expect(to.floorId).toBe(2);
      expect(edge.from.replace('ayres-1-', '')).toBe(
        edge.to.replace('ayres-2-', '')
      );
      expect(calculatePath(graph, from, to)).not.toBeNull();
      if (edge.type === 'stairs') expect(edge.isAccessible).toBe(false);
    }
    expect(nodes.get(id('ayres-1-elevator'))?.position).toEqual(
      nodes.get(id('ayres-2-elevator'))?.position
    );
    const candidates = new Map(
      [...nodes].filter(
        ([, node]) => node.buildingId === 'ayres' && node.floorId === 2
      )
    );
    const start = findNodeNearPosition(candidates, 0, 0, 2)!;
    expect(start.buildingId).toBe('ayres');
    expect(start.floorId).toBe(2);
    expect(
      calculatePath(graph, start, nodes.get(id('ayres-1-room-126A'))!)
    ).not.toBeNull();
    const elevatorId = id('ayres-2-elevator');
    nodes.get(elevatorId)!.position.x = 999;
    graph.get(elevatorId)!.length = 0;
    const [freshGraph, freshNodes] = loadGraphFromData();
    expect(freshNodes.get(elevatorId)?.position.x).not.toBe(999);
    expect(freshGraph.get(elevatorId)?.length).toBeGreaterThan(0);
  });
});
