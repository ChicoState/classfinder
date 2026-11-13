import { describe, expect, it } from 'vitest';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import type { NodeId } from '../../src/lib/graph';

describe('source-reviewed junction geometry', () => {
  it('preserves junction markers and keeps room door spurs unmarked', () => {
    const [, nodes] = loadGraphFromData();
    expect(nodes.get('ocon-1-lobby-upper-junction' as NodeId)).toHaveProperty(
      'isJunction',
      true
    );
    expect(nodes.get('ocon-1-room-124' as NodeId)).not.toHaveProperty(
      'isJunction'
    );
  });
});

describe('O’Connell exit headings', () => {
  it('distinguishes the west T from the separate restroom junction on floor 3', () => {
    const [graph, nodes] = loadGraphFromData();
    const junction = nodes.get('ocon-3-hall-west-junction' as NodeId)!;
    const neighbors = graph.get(junction.id)!;
    expect(neighbors.map((edge) => edge.to)).not.toContain(
      'ocon-3-restroom-vestibule'
    );
    expect(neighbors.map((edge) => edge.to)).toContain(
      'ocon-3-hall-restroom-junction'
    );
    // Approach from the east, passing straight west: south must be a left exit.
    // Reverse the approach and it must be a right exit. Campus rotation/scale
    // must preserve this classification without stored exit annotations.
    const east = nodes.get('ocon-3-hall-restroom-junction' as NodeId)!;
    const west = nodes.get('ocon-3-hall-west-upper' as NodeId)!;
    const south = nodes.get('ocon-3-hall-west-347' as NodeId)!;
    const cross = (incoming: typeof east) =>
      (junction.position.x - incoming.position.x) *
        (south.position.y - junction.position.y) -
      (junction.position.y - incoming.position.y) *
        (south.position.x - junction.position.x);
    expect(cross(east)).toBeGreaterThan(0);
    expect(cross(west)).toBeLessThan(0);
  });

  it('preserves independent markers and nonzero neighboring segments on reload', () => {
    const [graph, nodes] = loadGraphFromData();
    const marked = [...nodes.values()].filter(
      (node) => node.buildingId === 'ocon' && node.isJunction
    );
    expect(marked).toHaveLength(13);
    for (const node of marked) {
      for (const edge of graph.get(node.id)!) {
        expect(edge.distance, `${node.id} → ${edge.to}`).toBeGreaterThan(0);
      }
    }
    marked[0].isJunction = undefined;
    const [, fresh] = loadGraphFromData();
    expect(fresh.get(marked[0].id)?.isJunction).toBe(true);
  });
});

const indoorFloors = Object.values(
  import.meta.glob<{
    nodes: Array<{
      id: string;
      buildingId: string;
      floorId: number;
      position: { x: number; y: number };
      isJunction?: true;
    }>;
    edges: Array<{ from: string; to: string; type: string }>;
  }>('../../src/data/*/floor-*.json', { eager: true, import: 'default' })
);

it('has distinct positions on each indoor floor and preserves every marker', () => {
  const [, nodes] = loadGraphFromData();
  expect(indoorFloors).toHaveLength(34);
  for (const floor of indoorFloors) {
    const positions = new Set<string>();
    for (const node of floor.nodes) {
      const key = `${node.position.x},${node.position.y}`;
      expect(positions.has(key), node.id).toBe(false);
      positions.add(key);
      expect(nodes.get(node.id as NodeId)?.isJunction).toBe(node.isJunction);
    }
  }
});

it('has nonzero, distinct initial circulation headings at marked intersections', () => {
  for (const floor of indoorFloors) {
    for (const junction of floor.nodes.filter((node) => node.isJunction)) {
      const exits = floor.edges
        .filter(
          (edge) =>
            ['corridor', 'ramp'].includes(edge.type) &&
            [edge.from, edge.to].includes(junction.id)
        )
        .map(
          (edge) =>
            floor.nodes.find(
              (node) =>
                node.id === (edge.from === junction.id ? edge.to : edge.from)
            )!
        );
      for (const exit of exits) {
        expect(
          Math.hypot(
            exit.position.x - junction.position.x,
            exit.position.y - junction.position.y
          ),
          junction.id
        ).toBeGreaterThan(0);
      }
      for (let i = 0; i < exits.length; i++) {
        for (let j = 0; j < i; j++) {
          const heading = (index: number) =>
            Math.atan2(
              exits[index].position.y - junction.position.y,
              exits[index].position.x - junction.position.x
            );
          const difference = heading(i) - heading(j);
          const angle = Math.abs(
            Math.atan2(Math.sin(difference), Math.cos(difference))
          );
          // Broad tolerance guards duplicate exits, not orthogonal geometry.
          expect(angle, junction.id).toBeGreaterThan(Math.PI / 12);
        }
      }
    }
  }
});
