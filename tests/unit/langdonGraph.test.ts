import { describe, expect, it } from 'vitest';
import floor1 from '../../src/data/lang/floor-1.json';
import floor2 from '../../src/data/lang/floor-2.json';
import floor3 from '../../src/data/lang/floor-3.json';
import connections from '../../src/data/lang/connections.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';
import { toGlobalPosition } from '../../src/graph/coordinates';

const floors = [floor1, floor2, floor3];
const serializedNodes = floors.flatMap((floor) => floor.nodes);
const serializedEdges = [
  ...floors.flatMap((floor) => floor.edges),
  ...connections.edges
];

describe('Langdon floor plans', () => {
  it('preserves valid geometry and distinct two-way links across three floors', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(new Set(serializedNodes.map((node) => node.id)).size).toBe(
      serializedNodes.length
    );
    expect(
      new Set(
        serializedEdges.map(({ from, to }) => [from, to].sort().join('|'))
      ).size
    ).toBe(serializedEdges.length);
    expect(nodes.get('lang-1-exit-119-west' as NodeId)?.position).toEqual(
      toGlobalPosition({ x: 0, y: 0 }, 'lang')
    );
    for (const floor of floors) {
      expect(floor.metadata.undirected).toBe(true);
      for (const node of floor.nodes) {
        expect(node.buildingId).toBe('lang');
        expect(node.floorId).toBe(floor.metadata.floor);
        expect(
          Number.isFinite(node.position.x) && Number.isFinite(node.position.y)
        ).toBe(true);
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
    for (const edge of serializedEdges) {
      expect(edge.from).not.toBe(edge.to);
      expect(edge).not.toHaveProperty('distance');
      expect(
        nodes.has(edge.from as NodeId) && nodes.has(edge.to as NodeId)
      ).toBe(true);
    }
    const loaded = serializedNodes.flatMap((node) =>
      (graph.get(node.id as NodeId) ?? []).filter(
        (edge) => nodes.get(edge.to)?.buildingId === 'lang'
      )
    );
    expect(loaded).toHaveLength(serializedEdges.length * 2);
    expect(
      loaded.every(
        (edge) => Number.isFinite(edge.distance) && edge.distance >= 0
      )
    ).toBe(true);
  });

  it('routes from the reference entrance to every destination and to O’Connell through outdoors', () => {
    const [graph, nodes] = loadGraphFromData();
    const entrance = nodes.get('lang-1-exit-119-west' as NodeId)!;
    for (const serialized of serializedNodes) {
      const goal = nodes.get(serialized.id as NodeId)!;
      expect(calculatePath(graph, entrance, goal), goal.id).not.toBeNull();
      expect(calculatePath(graph, goal, entrance), goal.id).not.toBeNull();
    }
    expect(
      calculatePath(
        graph,
        entrance,
        nodes.get('ocon-1-exit-lower-ao' as NodeId)!
      )
    ).not.toBeNull();
  });

  it('connects both stair cores on adjacent floors and uses floor-aware start candidates', () => {
    const [graph, nodes] = loadGraphFromData();
    const stairs = connections.edges.filter((edge) => edge.type === 'stairs');
    expect(stairs).toHaveLength(4);
    for (const edge of stairs) {
      const from = nodes.get(edge.from as NodeId)!;
      const to = nodes.get(edge.to as NodeId)!;
      expect(to.floorId - from.floorId).toBe(1);
      expect(edge.type).toBe('stairs');
      expect(edge.isAccessible).toBe(false);
      expect(from.id.split('-').at(-1)).toBe(to.id.split('-').at(-1));
      expect(graph.get(from.id)).toContainEqual({
        to: to.id,
        type: 'stairs',
        weight: 1,
        isAccessible: false,
        distance: Math.hypot(
          from.position.x - to.position.x,
          from.position.y - to.position.y
        )
      });
    }
    const candidates = new Map(
      [...nodes].filter(
        ([, node]) => node.buildingId === 'lang' && node.floorId === 2
      )
    );
    const target = nodes.get('lang-2-room-206' as NodeId)!;
    expect(
      findNodeNearPosition(candidates, target.position.x, target.position.y, 2)
        ?.id
    ).toBe(target.id);
    const path = calculatePath(
      graph,
      target,
      nodes.get('lang-3-room-300' as NodeId)!
    );
    expect(
      path?.filter((edge) => edge.type === 'stairs' || edge.type === 'elevator')
    ).toHaveLength(1);
  });

  it('keeps inner rooms behind their shown parent-room doors', () => {
    const [graph] = loadGraphFromData();
    expect(
      graph.get('lang-1-room-121A' as NodeId)?.map((edge) => edge.to)
    ).toEqual(['lang-1-room-121']);
    expect(
      graph.get('lang-1-room-117A' as NodeId)?.map((edge) => edge.to)
    ).toEqual(['lang-1-room-117']);
    expect(
      graph.get('lang-2-room-205A' as NodeId)?.map((edge) => edge.to)
    ).toEqual(['lang-2-room-205-turn']);
  });
  it('places one doorway at each user-confirmed fence section midpoint', () => {
    const [graph, nodes] = loadGraphFromData();
    const gates = [
      ['west', 107.87],
      ['middle', 131.85],
      ['east', 155.83]
    ] as const;
    for (const [section, x] of gates) {
      const id = `lang-1-fence-gate-${section}` as NodeId;
      expect(nodes.get(id)?.position).toEqual(
        toGlobalPosition({ x, y: -145.93 }, 'lang')
      );
      const edges = graph.get(id);
      expect(edges).toHaveLength(2);
      expect(edges?.[0]).toMatchObject({
        to: `lang-1-hall-fence-${section}`,
        type: 'door',
        weight: 1
      });
      expect(edges?.[0]).not.toHaveProperty('isAccessible');
      expect(edges).toContainEqual(
        expect.objectContaining({
          to: `outdoor-0-lang-gate-${section}-approach`,
          type: 'door',
          weight: 1
        })
      );
    }
    expect(
      floor1.nodes.filter((node) => node.id.includes('-fence-gate-'))
    ).toHaveLength(3);
  });
  it('connects the confirmed accessible elevator on all three floors', () => {
    const [graph, nodes] = loadGraphFromData();
    const transfers = connections.edges.filter(
      (edge) => edge.type === 'elevator'
    );
    expect(transfers.map((edge) => [edge.from, edge.to])).toEqual([
      ['lang-1-elevator-passenger', 'lang-2-elevator-passenger'],
      ['lang-2-elevator-passenger', 'lang-3-elevator-passenger']
    ]);
    for (const floor of [1, 2, 3]) {
      const id = `lang-${floor}-elevator-passenger` as NodeId;
      expect(nodes.get(id)?.floorId).toBe(floor);
      expect(graph.get(id)).toContainEqual(
        expect.objectContaining({
          to: `lang-${floor}-hall-elevator`,
          type: 'door',
          isAccessible: true
        })
      );
    }
    for (const edge of transfers) {
      expect(edge.isAccessible).toBe(true);
      expect(graph.get(edge.from as NodeId)).toContainEqual(
        expect.objectContaining({
          to: edge.to,
          type: 'elevator',
          isAccessible: true
        })
      );
      expect(graph.get(edge.to as NodeId)).toContainEqual(
        expect.objectContaining({
          to: edge.from,
          type: 'elevator',
          isAccessible: true
        })
      );
    }
    const start = nodes.get('lang-1-elevator-passenger' as NodeId)!;
    const end = nodes.get('lang-3-elevator-passenger' as NodeId)!;
    expect(calculatePath(graph, start, end)?.map((edge) => edge.type)).toEqual([
      'elevator',
      'elevator'
    ]);
    expect(calculatePath(graph, end, start)?.map((edge) => edge.type)).toEqual([
      'elevator',
      'elevator'
    ]);
  });
});

describe('Langdon per-floor topology and serialized edges', () => {
  it('loads unique, finite nodes and two-way coordinate-derived edges', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(new Set(serializedNodes.map((node) => node.id)).size).toBe(
      serializedNodes.length
    );
    const pairs = new Set<string>();
    for (const node of serializedNodes) {
      expect(nodes.get(node.id as NodeId)).toEqual({
        ...node,
        position: toGlobalPosition(node.position, node.buildingId)
      });
      expect(node.buildingId).toBe('lang');
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
    expect(nodes.get('lang-1-exit-119-west' as NodeId)?.position).toEqual(
      toGlobalPosition({ x: 0, y: 0 }, 'lang')
    );
  });

  it('reaches every doorway within its own floor and across floors using real Dijkstra', () => {
    const [graph, nodes] = loadGraphFromData();
    const origin = nodes.get('lang-1-exit-119-west' as NodeId)!;
    for (const floor of floors) {
      const candidates = new Map(
        [...nodes].filter(
          ([, node]) =>
            node.buildingId === 'lang' && node.floorId === floor.metadata.floor
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
      else expect(edge.isAccessible).toBe(true);
    }
  });

  it('retains parent-room access for enclosed side rooms', () => {
    const neighbors = (id: string) =>
      serializedEdges.flatMap((edge) =>
        edge.from === id ? [edge.to] : edge.to === id ? [edge.from] : []
      );
    expect(neighbors('lang-1-room-121A')).toEqual(['lang-1-room-121']);
    expect(neighbors('lang-1-room-118A')).toEqual([
      'lang-1-room-118A-vestibule'
    ]);
    expect(neighbors('lang-2-room-207D')).toEqual(['lang-2-room-207-turn']);
    expect(neighbors('lang-2-room-205A')).toEqual(['lang-2-room-205-turn']);
    expect(neighbors('lang-3-room-303A')).toEqual(['lang-3-room-303']);
  });
});
