import { describe, expect, it } from 'vitest';

import { calculatePath } from '../../src/lib/dijkstras';
import type { Edge, Graph, Node, NodeId, Nodes } from '../../src/lib/graph';

function createNode(id: NodeId, x: number, y: number): Node {
  return {
    id,
    buildingId: null,
    floorId: null,
    area: 'Outdoors',
    position: { x, y }
  };
}

describe('calculatePath', () => {
  it('returns the direct edge from the nearest start node to the goal', () => {
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
    const nodes: Nodes = new Map([
      [entrance, createNode(entrance, 0, 0)],
      [classroom, createNode(classroom, 12, 0)]
    ]);

    expect(calculatePath(graph, nodes, 0, 0, nodes.get(classroom)!)).toEqual([
      directEdge
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
    const nodes: Nodes = new Map([
      [entrance, createNode(entrance, 0, 0)],
      [hallway, createNode(hallway, 10, 0)],
      [stairs, createNode(stairs, 0, 10)],
      [classroom, createNode(classroom, 20, 0)]
    ]);

    expect(calculatePath(graph, nodes, 0, 0, nodes.get(classroom)!)).toEqual([
      hallwayEdge,
      classroomFromHallway
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
    const nodes: Nodes = new Map([
      [entrance, createNode(entrance, 0, 0)],
      [hallway, createNode(hallway, 5, 0)],
      [classroom, createNode(classroom, 10, 0)]
    ]);

    expect(calculatePath(graph, nodes, 0, 0, nodes.get(classroom)!)).toEqual([
      hallwayEdge,
      classroomEdge
    ]);
  });

  it('snaps the supplied coordinates to the closest node before routing', () => {
    const distantEntrance = 'distantEntrance' as NodeId;
    const nearbyEntrance = 'nearbyEntrance' as NodeId;
    const classroom = 'classroom' as NodeId;
    const directEdge: Edge = {
      to: classroom,
      distance: 5,
      weight: 1,
      type: 'outdoor'
    };
    const graph: Graph = new Map([
      [distantEntrance, []],
      [nearbyEntrance, [directEdge]],
      [classroom, []]
    ]);
    const nodes: Nodes = new Map([
      [distantEntrance, createNode(distantEntrance, 0, 100)],
      [nearbyEntrance, createNode(nearbyEntrance, 10, 0)],
      [classroom, createNode(classroom, 15, 0)]
    ]);

    expect(calculatePath(graph, nodes, 9, 0, nodes.get(classroom)!)).toEqual([
      directEdge
    ]);
  });

  it('returns an empty path when the nearest start node is the goal', () => {
    const classroom = 'classroom' as NodeId;
    const graph: Graph = new Map([[classroom, []]]);
    const nodes: Nodes = new Map([[classroom, createNode(classroom, 10, 10)]]);

    expect(calculatePath(graph, nodes, 10, 10, nodes.get(classroom)!)).toEqual(
      []
    );
  });

  it('returns null when no node exists or the goal cannot be reached', () => {
    const classroom = 'classroom' as NodeId;
    const isolatedEntrance = 'isolatedEntrance' as NodeId;
    const classroomNode = createNode(classroom, 10, 0);
    const isolatedNode = createNode(isolatedEntrance, 0, 0);
    const graph: Graph = new Map([
      [isolatedEntrance, []],
      [classroom, []]
    ]);
    const nodes: Nodes = new Map([
      [isolatedEntrance, isolatedNode],
      [classroom, classroomNode]
    ]);

    expect(calculatePath(graph, new Map(), 0, 0, classroomNode)).toBeNull();
    expect(calculatePath(graph, nodes, 0, 0, classroomNode)).toBeNull();
  });
});
