import { describe, expect, it } from 'vitest';

import floor1 from '../../src/data/ocon/floor-1.json';
import floor2 from '../../src/data/ocon/floor-2.json';
import floor3 from '../../src/data/ocon/floor-3.json';
import floor4 from '../../src/data/ocon/floor-4.json';
import connections from '../../src/data/ocon/connections.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

const floors = [floor1, floor2, floor3, floor4];
const data = {
  metadata: floor1.metadata,
  nodes: floors.flatMap((floor) => floor.nodes),
  edges: [...floors.flatMap((floor) => floor.edges), ...connections.edges]
};

function distanceBetweenNodes(from: NodeId, to: NodeId): number {
  const fromNode = data.nodes.find((node) => node.id === from);
  const toNode = data.nodes.find((node) => node.id === to);

  if (!fromNode || !toNode)
    throw new Error('Serialized edge has a missing endpoint.');

  return Math.hypot(
    fromNode.position.x - toNode.position.x,
    fromNode.position.y - toNode.position.y
  );
}

describe('loadGraphFromData', () => {
  it('loads the floor-plan nodes with their coordinates and building details', () => {
    const [graph, nodes] = loadGraphFromData();

    expect(nodes.size).toBe(data.nodes.length);
    expect(graph.size).toBe(nodes.size);
    for (const node of data.nodes) {
      expect(nodes.get(node.id as NodeId)).toEqual(node);
      expect(graph.has(node.id as NodeId)).toBe(true);
    }
    expect(nodes.get(data.metadata.origin.nodeId as NodeId)?.position).toEqual({
      x: 0,
      y: 0
    });
  });

  it('derives edge distances from endpoint positions while expanding connections', () => {
    const [graph] = loadGraphFromData();

    expect([...graph.values()].flat()).toHaveLength(data.edges.length * 2);
    for (const { from, ...edge } of data.edges) {
      expect(edge).not.toHaveProperty('distance');
      const distance = distanceBetweenNodes(from as NodeId, edge.to as NodeId);
      expect(graph.get(from as NodeId)).toContainEqual({ ...edge, distance });
      expect(graph.get(edge.to as NodeId)).toContainEqual({
        ...edge,
        distance,
        to: from
      });
      expect([
        'corridor',
        'door',
        'stairs',
        'elevator',
        'ramp',
        'outdoor'
      ]).toContain(edge.type);
      expect(edge.weight).toBeGreaterThanOrEqual(0);
    }
  });

  it('supports Dijkstra routes from the entrance to every node and back', () => {
    const [graph, nodes] = loadGraphFromData();
    const entrance = nodes.get(data.metadata.origin.nodeId as NodeId);
    expect(entrance).toBeDefined();
    if (!entrance) throw new Error('Missing entrance');

    for (const goal of nodes.values()) {
      const outward = calculatePath(graph, entrance, goal);
      const inward = calculatePath(graph, goal, entrance);
      expect(outward, goal.id).not.toBeNull();
      expect(inward, goal.id).not.toBeNull();
      if (goal.id !== entrance.id) {
        expect(outward?.at(-1)?.to).toBe(goal.id);
        expect(inward?.at(-1)?.to).toBe(entrance.id);
      }
    }
  });

  it('connects only corresponding adjacent-floor stairs and elevators', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(new Set([...nodes.values()].map((node) => node.floorId))).toEqual(
      new Set([1, 2, 3, 4])
    );
    expect(connections.edges).toHaveLength(13);
    for (const edge of connections.edges) {
      const from = nodes.get(edge.from as NodeId)!;
      const to = nodes.get(edge.to as NodeId)!;
      expect(to.floorId! - from.floorId!).toBe(1);
      expect(edge).not.toHaveProperty('distance');
      expect(graph.get(from.id)).toContainEqual(
        expect.objectContaining({
          to: to.id,
          type: edge.type,
          distance: distanceBetweenNodes(from.id, to.id)
        })
      );
      if (edge.type === 'stairs') expect(edge.isAccessible).toBe(false);
    }
    expect(nodes.has('ocon-3-stairs-upper' as NodeId)).toBe(false);
    expect(nodes.has('ocon-4-stairs-upper' as NodeId)).toBe(false);
  });

  it('returns independent graphs and node positions on every load', () => {
    const [graph, nodes] = loadGraphFromData();
    const entranceId = data.metadata.origin.nodeId as NodeId;
    const entrance = nodes.get(entranceId);
    const edges = graph.get(entranceId);
    expect(entrance).toBeDefined();
    expect(edges?.length).toBeGreaterThan(0);
    if (!entrance || !edges?.length) throw new Error('Missing entrance');
    entrance.position.x = 1000;
    edges[0].weight = 1000;
    edges.length = 0;
    nodes.clear();

    const [freshGraph, freshNodes] = loadGraphFromData();
    expect(freshNodes.size).toBe(data.nodes.length);
    expect(freshNodes.get(entranceId)?.position).toEqual({ x: 0, y: 0 });
    expect(freshGraph.get(entranceId)?.[0].weight).toBe(1);
  });
});
