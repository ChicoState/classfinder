import { describe, expect, it } from 'vitest';

import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { Edge, Graph, Node, NodeId, Nodes } from '../../src/lib/graph';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import alignment from '../../src/graph/campusAlignment.json';
import endpoints from '../../tools/routing/campus-endpoints.json';

function createNode(id: NodeId, x: number, y: number, floorId = 1): Node {
  return {
    id,
    buildingId: 'outside',
    floorId,
    position: { x, y }
  };
}

describe('calculatePath', () => {
  it('returns the direct edge from the supplied start node to the goal', () => {
    const entrance = 'entrance' as NodeId;
    const classroom = 'classroom' as NodeId;
    const directEdge: Edge = {
      to: classroom,
      distance: 12,
      weight: 1,
      type: 'door'
    };
    const graph: Graph = new Map([
      [entrance, [directEdge]],
      [classroom, []]
    ]);
    const entranceNode = createNode(entrance, 0, 0);
    const classroomNode = createNode(classroom, 12, 0);

    expect(calculatePath(graph, entranceNode, classroomNode)).toEqual([
      { ...directEdge, from: entrance }
    ]);
  });

  it('returns the lower-cost route when alternatives have different costs', () => {
    const entrance = 'entrance' as NodeId;
    const hallway = 'hallway' as NodeId;
    const stairs = 'stairs' as NodeId;
    const classroom = 'classroom' as NodeId;
    const hallwayEdge: Edge = {
      to: hallway,
      distance: 10,
      weight: 1,
      type: 'corridor'
    };
    const classroomFromHallway: Edge = {
      to: classroom,
      distance: 10,
      weight: 1,
      type: 'corridor'
    };
    const stairsEdge: Edge = {
      to: stairs,
      distance: 5,
      weight: 5,
      type: 'stairs'
    };
    const classroomFromStairs: Edge = {
      to: classroom,
      distance: 5,
      weight: 5,
      type: 'stairs'
    };
    const graph: Graph = new Map([
      [entrance, [hallwayEdge, stairsEdge]],
      [hallway, [classroomFromHallway]],
      [stairs, [classroomFromStairs]],
      [classroom, []]
    ]);
    const entranceNode = createNode(entrance, 0, 0);
    const classroomNode = createNode(classroom, 20, 0);

    expect(calculatePath(graph, entranceNode, classroomNode)).toEqual([
      { ...hallwayEdge, from: entrance },
      { ...classroomFromHallway, from: hallway }
    ]);
  });

  it('orders reconstructed edges from start to goal', () => {
    const entrance = 'entrance' as NodeId;
    const hallway = 'hallway' as NodeId;
    const classroom = 'classroom' as NodeId;
    const hallwayEdge: Edge = {
      to: hallway,
      distance: 5,
      weight: 1,
      type: 'corridor'
    };
    const classroomEdge: Edge = {
      to: classroom,
      distance: 5,
      weight: 1,
      type: 'door'
    };
    const graph: Graph = new Map([
      [entrance, [hallwayEdge]],
      [hallway, [classroomEdge]],
      [classroom, []]
    ]);
    const entranceNode = createNode(entrance, 0, 0);
    const classroomNode = createNode(classroom, 10, 0);

    expect(calculatePath(graph, entranceNode, classroomNode)).toEqual([
      { ...hallwayEdge, from: entrance },
      { ...classroomEdge, from: hallway }
    ]);
  });

  it('finds the closest node on the requested floor', () => {
    const distantEntrance = 'distantEntrance' as NodeId;
    const nearbyEntrance = 'nearbyEntrance' as NodeId;
    const classroom = 'classroom' as NodeId;
    const nodes: Nodes = new Map([
      [distantEntrance, createNode(distantEntrance, 0, 100, 1)],
      [nearbyEntrance, createNode(nearbyEntrance, 10, 0, 2)],
      [classroom, createNode(classroom, 15, 0, 2)]
    ]);

    expect(findNodeNearPosition(nodes, 9, 0, 2)).toEqual(
      nodes.get(nearbyEntrance)
    );
  });

  it('returns an empty path when the nearest start node is the goal', () => {
    const classroom = 'classroom' as NodeId;
    const graph: Graph = new Map([[classroom, []]]);
    const classroomNode = createNode(classroom, 10, 10);

    expect(calculatePath(graph, classroomNode, classroomNode)).toEqual([]);
  });

  it('returns null when the goal cannot be reached', () => {
    const classroom = 'classroom' as NodeId;
    const isolatedEntrance = 'isolatedEntrance' as NodeId;
    const classroomNode = createNode(classroom, 10, 0);
    const isolatedNode = createNode(isolatedEntrance, 0, 0);
    const graph: Graph = new Map([
      [isolatedEntrance, []],
      [classroom, []]
    ]);
    expect(calculatePath(graph, isolatedNode, classroomNode)).toBeNull();
  });
});

describe('global campus routes', () => {
  const [graph, nodes] = loadGraphFromData();
  const buildings = Object.keys(endpoints) as (keyof typeof endpoints)[];
  const pairs = buildings.flatMap((from) =>
    buildings.filter((to) => to !== from).map((to) => [from, to] as const)
  );

  it('covers every registered building with an indoor endpoint', () => {
    expect(buildings.sort()).toEqual(Object.keys(alignment.buildings).sort());
    expect(alignment.excludedBuildingIds).toEqual([]);
    for (const building of buildings) {
      expect(nodes.get(endpoints[building] as NodeId)?.buildingId).toBe(
        building
      );
    }
  });

  it.each(pairs)(
    'routes from %s to %s through the loaded outdoor graph',
    (from, to) => {
      const start = nodes.get(endpoints[from] as NodeId)!;
      const goal = nodes.get(endpoints[to] as NodeId)!;
      const path = calculatePath(graph, start, goal);
      expect(path).not.toBeNull();
      expect(path!.length).toBeGreaterThan(0);
      let current = start.id;
      for (const edge of path!) {
        expect(edge.from).toBe(current);
        expect(graph.get(current)).toContainEqual({
          to: edge.to,
          distance: edge.distance,
          weight: edge.weight,
          type: edge.type,
          ...(edge.isAccessible === undefined
            ? {}
            : { isAccessible: edge.isAccessible })
        });
        expect(Number.isFinite(edge.distance) && edge.distance >= 0).toBe(true);
        current = edge.to;
      }
      expect(current).toBe(goal.id);
      expect(
        path!.some((edge) => nodes.get(edge.to)?.buildingId === 'outside')
      ).toBe(true);
    }
  );
});
