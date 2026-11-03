import { describe, expect, it } from 'vitest';
import floor1 from '../../src/data/glenn/floor-1.json';
import floor2 from '../../src/data/glenn/floor-2.json';
import floor3 from '../../src/data/glenn/floor-3.json';
import connections from '../../src/data/glenn/connections.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

const floors = [floor1, floor2, floor3];
const serializedNodes = floors.flatMap((floor) => floor.nodes);
const serializedEdges = [
  ...floors.flatMap((floor) => floor.edges),
  ...connections.edges
];
const id = (name: string) => name as NodeId;

describe('Glenn floor plans', () => {
  it('loads valid unique geometry with exactly two directed links per serialized edge', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(new Set(serializedNodes.map((node) => node.id)).size).toBe(
      serializedNodes.length
    );
    expect(nodes.get(id(floor1.metadata.origin.nodeId))?.position).toEqual({
      x: 0,
      y: 0
    });
    const pairs = new Set<string>();
    for (const floor of floors) {
      expect(floor.metadata.undirected).toBe(true);
      expect(floor.metadata.scale.feetPerPdfPoint).toBe(30 / 72);
      for (const node of floor.nodes) {
        expect(node.buildingId).toBe('glenn');
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
      expect(['corridor', 'door', 'stairs', 'elevator']).toContain(edge.type);
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
      if ('isAccessible' in edge && edge.type === 'stairs')
        expect(edge.isAccessible).toBe(false);
    }
    const directedEdges = [...graph]
      .filter(([key]) => key.startsWith('glenn-'))
      .flatMap(([, edges]) => edges);
    expect(directedEdges).toHaveLength(serializedEdges.length * 2);
  });

  it('reaches every supported interior destination through its parent room or vestibule', () => {
    const [graph, nodes] = loadGraphFromData();
    const entrance = nodes.get(id('glenn-1-entrance-north'))!;
    const externalOnly = new Set([
      'glenn-1-unnumbered-northwest-door',
      'glenn-1-unnumbered-north-middle-door'
    ]);
    for (const node of serializedNodes) {
      const destination = nodes.get(id(node.id))!;
      if (externalOnly.has(node.id)) {
        expect(calculatePath(graph, entrance, destination), node.id).toBeNull();
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
    for (const [child, parent] of [
      ['glenn-1-room-104A', 'glenn-1-room-104'],
      ['glenn-1-room-108D', 'glenn-1-room-108A'],
      ['glenn-1-room-110A', 'glenn-1-room-110B'],
      ['glenn-2-room-206B', 'glenn-2-room-206-north'],
      ['glenn-2-room-204H', 'glenn-2-suite-204-northeast'],
      ['glenn-3-room-323A', 'glenn-3-room-323-north']
    ]) {
      expect(
        calculatePath(graph, entrance, nodes.get(id(child))!)?.map(
          (edge) => edge.to
        )
      ).toContain(parent);
    }
    expect(graph.get(id('glenn-1-unnumbered-108A-north'))).toHaveLength(1);
    // Upper south flight must approach through the lower landing, around the stair enclosure wall.
    expect(
      graph
        .get(id('glenn-2-stairs-south-up'))
        ?.some((edge) => edge.to === id('glenn-2-hall-stairs-south'))
    ).toBe(false);
    expect(
      graph
        .get(id('glenn-2-stairs-south-up'))
        ?.some((edge) => edge.to === id('glenn-2-stairs-south-landing'))
    ).toBe(true);
  });

  it('connects the three stair cores and elevator on adjacent floors and keeps loads independent', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(connections.edges).toHaveLength(8);
    for (const edge of connections.edges) {
      const from = nodes.get(id(edge.from))!;
      const to = nodes.get(id(edge.to))!;
      expect(to.floorId - from.floorId).toBe(1);
      if (edge.type === 'stairs') {
        expect(edge.isAccessible).toBe(false);
        expect(edge.from.replace(/glenn-\d-/, '').replace('-up', '')).toBe(
          edge.to.replace(/glenn-\d-/, '').replace('-down', '')
        );
      }
    }
    const candidates = new Map(
      [...nodes].filter(
        ([, node]) => node.buildingId === 'glenn' && node.floorId === 3
      )
    );
    const start = findNodeNearPosition(candidates, 0, 0, 3)!;
    expect(start.buildingId).toBe('glenn');
    expect(start.floorId).toBe(3);
    const route = calculatePath(
      graph,
      start,
      nodes.get(id('glenn-1-room-110A'))!
    );
    expect(route).not.toBeNull();
    const elevatorId = id('glenn-2-elevator');
    expect(nodes.get(id('glenn-1-elevator'))?.position).toEqual(
      nodes.get(elevatorId)?.position
    );
    nodes.get(elevatorId)!.position.x = 999;
    graph.get(elevatorId)!.length = 0;
    const [freshGraph, freshNodes] = loadGraphFromData();
    expect(freshNodes.get(elevatorId)?.position.x).not.toBe(999);
    expect(freshGraph.get(elevatorId)?.length).toBeGreaterThan(0);
  });
});
