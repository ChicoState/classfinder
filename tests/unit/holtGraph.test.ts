import { describe, expect, it } from 'vitest';

import floor1 from '../../src/data/holt/floor-1.json';
import floor2 from '../../src/data/holt/floor-2.json';
import floor3 from '../../src/data/holt/floor-3.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

const floors = [floor1, floor2, floor3];
const id = (value: string) => value as NodeId;

describe('Holt floor-plan data', () => {
  it('loads unique finite doorway coordinates in feet with one shared origin', () => {
    const [, nodes] = loadGraphFromData();
    const serialized = floors.flatMap((floor) => floor.nodes);
    expect(new Set(serialized.map((node) => node.id)).size).toBe(
      serialized.length
    );
    expect(nodes.get(id('holt-1-exit-south-ao'))?.position).toEqual({
      x: 0,
      y: 0
    });
    for (const floor of floors) {
      expect(floor.metadata.undirected).toBe(true);
      expect(floor.metadata.feetPerPdfPoint).toBe(40 / 72);
      expect(floor.metadata.origin.nodeId).toBe('holt-1-exit-south-ao');
      for (const node of floor.nodes) {
        expect(node.id).toMatch(
          new RegExp('^holt-' + floor.metadata.floor + '-.+')
        );
        expect(node.buildingId).toBe('holt');
        expect(node.floorId).toBe(floor.metadata.floor);
        expect(Number.isFinite(node.position.x)).toBe(true);
        expect(Number.isFinite(node.position.y)).toBe(true);
        expect(nodes.get(id(node.id))).toEqual(node);
      }
    }
  });

  it('reaches interior destinations and preserves the unresolved exterior landing component', () => {
    const [graph, nodes] = loadGraphFromData();
    const entrance = nodes.get(id('holt-1-exit-south-ao'))!;
    for (const goal of nodes.values()) {
      if (goal.buildingId !== 'holt') continue;
      if (
        ['holt-1-south-bridge-east', 'holt-1-exit-east-south'].includes(goal.id)
      ) {
        expect(calculatePath(graph, entrance, goal), goal.id).toBeNull();
        continue;
      }
      expect(calculatePath(graph, entrance, goal), goal.id).not.toBeNull();
      expect(calculatePath(graph, goal, entrance), goal.id).not.toBeNull();
    }
    expect(
      calculatePath(graph, entrance, nodes.get(id('ocon-1-exit-lower-ao'))!)
    ).toBeNull();
    expect(
      calculatePath(
        graph,
        nodes.get(id('holt-1-south-bridge-east'))!,
        nodes.get(id('holt-1-exit-east-south'))!
      )
    ).toHaveLength(1);
    for (const bridge of ['north', 'south']) {
      expect(
        graph.get(id('holt-1-' + bridge + '-bridge-west'))
      ).not.toContainEqual(
        expect.objectContaining({ to: 'holt-1-' + bridge + '-bridge-east' })
      );
    }
  });

  it('stores local edges once and preserves loaded distances and accessibility', () => {
    const [graph, nodes] = loadGraphFromData();
    for (const floor of floors) {
      const pairs = new Set<string>();
      for (const edge of floor.edges) {
        const from = nodes.get(id(edge.from))!;
        const to = nodes.get(id(edge.to))!;
        expect(from, edge.from).toBeDefined();
        expect(to, edge.to).toBeDefined();
        expect(from.floorId).toBe(to.floorId);
        expect(from.id).not.toBe(to.id);
        const pair = [from.id, to.id].sort().join('|');
        expect(pairs.has(pair), pair).toBe(false);
        pairs.add(pair);
        expect(edge).not.toHaveProperty('distance');
        expect(Number.isFinite(edge.weight)).toBe(true);
        expect(edge.weight).toBeGreaterThanOrEqual(0);
        expect([
          'corridor',
          'door',
          'stairs',
          'elevator',
          'ramp',
          'outdoor'
        ]).toContain(edge.type);
        const { from: source, ...attributes } = edge;
        const distance = Math.hypot(
          from.position.x - to.position.x,
          from.position.y - to.position.y
        );
        expect(graph.get(from.id)).toContainEqual({ ...attributes, distance });
        expect(graph.get(to.id)).toContainEqual({
          ...attributes,
          to: source,
          distance
        });
      }
    }
  });

  it('connects four stair cores and the elevator only between adjacent floors', () => {
    const [graph, nodes] = loadGraphFromData();
    const transfers = [...graph.entries()].flatMap(([from, edges]) =>
      edges
        .filter(
          (edge) =>
            nodes.get(from)!.buildingId === 'holt' &&
            nodes.get(from)!.floorId < nodes.get(edge.to)!.floorId
        )
        .map((edge) => ({ from, ...edge }))
    );
    expect(transfers).toHaveLength(10);
    for (const edge of transfers) {
      const from = nodes.get(edge.from)!;
      const to = nodes.get(edge.to)!;
      expect(to.floorId - from.floorId).toBe(1);
      expect(to.buildingId).toBe('holt');
      expect(edge.to.replace(/^holt-\d-/, '')).toBe(
        edge.from.replace(/^holt-\d-/, '')
      );
      expect(['stairs', 'elevator']).toContain(edge.type);
      if (edge.type === 'stairs') expect(edge.isAccessible).toBe(false);
      else expect(edge.isAccessible).toBeUndefined();
      expect(edge.distance).toBe(
        Math.hypot(
          from.position.x - to.position.x,
          from.position.y - to.position.y
        )
      );
    }
  });

  it('snaps within the selected building and floor before routing to another floor', () => {
    const [graph, nodes] = loadGraphFromData();
    const candidates = new Map(
      [...nodes].filter(
        ([, node]) => node.buildingId === 'holt' && node.floorId === 1
      )
    );
    const start = findNodeNearPosition(candidates, 0, 0, 1)!;
    expect(start.id).toBe('holt-1-exit-south-ao');
    const goal = nodes.get(id('holt-3-room-350'))!;
    const path = calculatePath(graph, start, goal);
    expect(path?.at(-1)?.to).toBe(goal.id);
    expect(
      path?.some(
        (edge) => nodes.get(edge.from)!.floorId !== nodes.get(edge.to)!.floorId
      )
    ).toBe(true);
  });
});
