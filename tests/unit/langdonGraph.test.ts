import { describe, expect, it } from 'vitest';
import floor1 from '../../src/data/lang/floor-1.json';
import floor2 from '../../src/data/lang/floor-2.json';
import floor3 from '../../src/data/lang/floor-3.json';
import connections from '../../src/data/lang/connections.json';
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
    expect(nodes.get('lang-1-exit-119-west' as NodeId)?.position).toEqual({
      x: 0,
      y: 0
    });
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
    const loaded = serializedNodes.flatMap(
      (node) => graph.get(node.id as NodeId) ?? []
    );
    expect(loaded).toHaveLength(serializedEdges.length * 2);
    expect(
      loaded.every(
        (edge) => Number.isFinite(edge.distance) && edge.distance >= 0
      )
    ).toBe(true);
  });

  it('routes from the reference entrance to every destination and back, without connecting other buildings', () => {
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
    ).toBeNull();
  });

  it('connects both stair cores on adjacent floors and uses floor-aware start candidates', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(connections.edges).toHaveLength(4);
    for (const edge of connections.edges) {
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
    expect(path?.filter((edge) => edge.type === 'stairs')).toHaveLength(1);
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
    expect(
      serializedEdges.some((edge) => (edge.type as string) === 'elevator')
    ).toBe(false);
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
      expect(nodes.get(id)?.position).toEqual({ x, y: -145.93 });
      const edges = graph.get(id);
      expect(edges).toHaveLength(1);
      expect(edges?.[0]).toMatchObject({
        to: `lang-1-hall-fence-${section}`,
        type: 'door',
        weight: 1
      });
      expect(edges?.[0]).not.toHaveProperty('isAccessible');
    }
    expect(
      floor1.nodes.filter((node) => node.id.includes('-fence-gate-'))
    ).toHaveLength(3);
  });
});
