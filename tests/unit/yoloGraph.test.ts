import { describe, expect, it } from 'vitest';
import floor1 from '../../src/data/yolo/floor-1.json';
import floor2 from '../../src/data/yolo/floor-2.json';
import connections from '../../src/data/yolo/connections.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { toGlobalPosition } from '../../src/graph/coordinates';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

const floors = [floor1, floor2];
const allNodes = floors.flatMap((floor) => floor.nodes);
const allEdges = [
  ...floors.flatMap((floor) => floor.edges),
  ...connections.edges
];

describe('Yolo floor-plan graphs', () => {
  it('serializes unique valid nodes and undirected edges in feet', () => {
    const nodes = new Map(allNodes.map((node) => [node.id, node]));
    expect(nodes.size).toBe(allNodes.length);
    expect(nodes.get('yolo-1-exit-south-ao')?.position).toEqual({ x: 0, y: 0 });
    for (const floor of floors) {
      expect(floor.metadata.feetPerPdfPoint).toBe(40 / 72);
      expect(floor.metadata.undirected).toBe(true);
      for (const node of floor.nodes) {
        expect(node.buildingId).toBe('yolo');
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
    for (const edge of allEdges) {
      expect(nodes.has(edge.from)).toBe(true);
      expect(nodes.has(edge.to)).toBe(true);
      expect(edge.from).not.toBe(edge.to);
      expect(edge).not.toHaveProperty('distance');
      expect(edge.weight).toBe(1);
      expect(['corridor', 'door', 'stairs', 'elevator']).toContain(edge.type);
      const pair = [edge.from, edge.to].sort().join('|');
      expect(pairs.has(pair), pair).toBe(false);
      pairs.add(pair);
    }
  });

  it('loads both directions with coordinate distances and preserves transfer attributes', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(
      allNodes.reduce(
        (sum, node) =>
          sum +
          graph
            .get(node.id as NodeId)!
            .filter((edge) => nodes.get(edge.to)?.buildingId === 'yolo').length,
        0
      )
    ).toBe(allEdges.length * 2);
    for (const { from, ...edge } of allEdges) {
      const a = nodes.get(from as NodeId)!;
      const b = nodes.get(edge.to as NodeId)!;
      const distance = Math.hypot(
        a.position.x - b.position.x,
        a.position.y - b.position.y
      );
      expect(graph.get(a.id)).toContainEqual({ ...edge, distance });
      expect(graph.get(b.id)).toContainEqual({ ...edge, to: from, distance });
    }
    expect(connections.edges).toHaveLength(4);
    for (const edge of connections.edges) {
      expect(nodes.get(edge.from as NodeId)?.floorId).toBe(1);
      expect(nodes.get(edge.to as NodeId)?.floorId).toBe(2);
      expect(edge.from.replace('-1-', '-2-')).toBe(edge.to);
      if (edge.type === 'stairs') expect(edge.isAccessible).toBe(false);
    }
  });

  it('routes from the origin to every destination and back using the real loader and Dijkstra', () => {
    const [graph, nodes] = loadGraphFromData();
    const entrance = nodes.get('yolo-1-exit-south-ao' as NodeId)!;
    for (const node of allNodes) {
      const goal = nodes.get(node.id as NodeId)!;
      expect(calculatePath(graph, entrance, goal), node.id).not.toBeNull();
      expect(calculatePath(graph, goal, entrance), node.id).not.toBeNull();
    }
    const floorCandidates = new Map(
      [...nodes].filter(
        ([, node]) => node.buildingId === 'yolo' && node.floorId === 2
      )
    );
    const start = findNodeNearPosition(floorCandidates, 0, 0, 2)!;
    expect(start.buildingId).toBe('yolo');
    expect(start.floorId).toBe(2);
    const path = calculatePath(
      graph,
      entrance,
      nodes.get('yolo-2-room-287' as NodeId)!
    )!;
    expect(
      path.some((edge) => edge.type === 'stairs' || edge.type === 'elevator')
    ).toBe(true);
    expect(
      calculatePath(graph, start, nodes.get('yolo-2-room-287' as NodeId)!)
    ).not.toBeNull();
  });

  it('preserves parent-room access and keeps loads independent', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(
      graph.get('yolo-1-room-138' as NodeId)?.map((edge) => edge.to)
    ).toEqual(['yolo-1-room-137']);
    expect(
      graph.get('yolo-2-room-231' as NodeId)?.map((edge) => edge.to)
    ).toEqual(['yolo-2-room-229-inside']);
    expect(
      graph.get('yolo-2-room-247' as NodeId)?.map((edge) => edge.to)
    ).toEqual(['yolo-2-room-243-inside']);
    const entranceEdges = [...graph.get('yolo-1-exit-south-ao' as NodeId)!];
    nodes.get('yolo-1-exit-south-ao' as NodeId)!.position.x = 99;
    graph.get('yolo-1-exit-south-ao' as NodeId)!.length = 0;
    const [freshGraph, freshNodes] = loadGraphFromData();
    expect(freshNodes.get('yolo-1-exit-south-ao' as NodeId)?.position.x).toBe(
      toGlobalPosition({ x: 0, y: 0 }, 'yolo').x
    );
    expect(freshGraph.get('yolo-1-exit-south-ao' as NodeId)).toEqual(
      entranceEdges
    );
  });
});
