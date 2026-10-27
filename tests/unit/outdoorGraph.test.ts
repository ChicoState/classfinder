import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import outdoor from '../../src/data/outdoor/campus.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

describe('standalone campus outdoor graph', () => {
  it('traces ways to the source and preserves physical scale and shared junctions', () => {
    const source = readFileSync('campus-osm.json');
    expect(createHash('sha256').update(source).digest('hex')).toBe(
      outdoor.metadata.source.sha256
    );
    const raw = JSON.parse(source.toString()) as {
      elements: Array<{
        id: number;
        nodes: number[];
        geometry: Array<{ lat: number; lon: number }>;
        tags: Record<string, string>;
      }>;
    };
    const sourceWays = new Map(raw.elements.map((way) => [way.id, way]));
    const nodes = new Map(outdoor.nodes.map((node) => [node.id, node]));
    const membership = new Map<number, number>();
    for (const way of raw.elements.filter((way) => way.tags?.highway)) {
      for (const id of new Set(way.nodes))
        membership.set(id, (membership.get(id) ?? 0) + 1);
    }
    for (const way of outdoor.metadata.sourceWays) {
      const original = sourceWays.get(way.osmWayId)!;
      const tags = original.tags;
      expect(tags.indoor).not.toBe('yes');
      expect(tags.highway).not.toBe('corridor');
      expect(tags.informal).not.toBe('yes');
      if (['cycleway', 'service'].includes(tags.highway))
        expect(['yes', 'designated', 'permissive']).toContain(tags.foot);
      for (const id of original.nodes) {
        if (membership.get(id)! > 1)
          expect(way.nodeIds).toContain(`outdoor-0-osm-${id}`);
      }
      // Independent spherical distances catch degree/metre/foot conversion errors.
      for (let i = 1; i < way.nodeIds.length; i++) {
        const firstId = way.nodeIds[i - 1];
        const secondId = way.nodeIds[i];
        const first = nodes.get(firstId)!.position;
        const second = nodes.get(secondId)!.position;
        const a =
          original.geometry[
            original.nodes.indexOf(Number(firstId.split('-').at(-1)))
          ];
        const b =
          original.geometry[
            original.nodes.indexOf(Number(secondId.split('-').at(-1)))
          ];
        const radians = Math.PI / 180;
        const h =
          Math.sin(((b.lat - a.lat) * radians) / 2) ** 2 +
          Math.cos(a.lat * radians) *
            Math.cos(b.lat * radians) *
            Math.sin(((b.lon - a.lon) * radians) / 2) ** 2;
        const sphericalFeet =
          (2 * 6371008.8 * Math.asin(Math.sqrt(h))) / 0.3048;
        expect(
          Math.abs(
            Math.hypot(first.x - second.x, first.y - second.y) - sphericalFeet
          )
        ).toBeLessThan(sphericalFeet * 0.005 + 0.02);
      }
    }
    expect(
      outdoor.metadata.counts.includedWays +
        outdoor.metadata.counts.excludedWays
    ).toBe(outdoor.metadata.counts.sourceHighwayWays);
  });

  it('loads finite feet geometry, unique undirected edges, and outdoor identity', () => {
    const [graph, nodes] = loadGraphFromData();
    const ids = new Set(outdoor.nodes.map((node) => node.id));
    expect(ids.size).toBe(outdoor.nodes.length);
    expect(outdoor.metadata.units).toBe('feet');
    expect(outdoor.metadata.undirected).toBe(true);
    expect(
      nodes.get(outdoor.metadata.origin.nodeId as NodeId)?.position
    ).toEqual({ x: 0, y: 0 });
    expect(
      new Set(
        outdoor.edges.map((edge) => [edge.from, edge.to].sort().join('|'))
      ).size
    ).toBe(outdoor.edges.length);
    for (const node of outdoor.nodes) {
      expect(node.buildingId).toBeNull();
      expect(node.floorId).toBe(0);
      expect(
        Number.isFinite(node.position.x) && Number.isFinite(node.position.y)
      ).toBe(true);
      expect(nodes.get(node.id as NodeId)).toEqual(node);
    }
    for (const edge of outdoor.edges) {
      expect(edge.from).not.toBe(edge.to);
      expect(ids.has(edge.from) && ids.has(edge.to)).toBe(true);
      expect(edge).not.toHaveProperty('distance');
      expect(edge.weight).toBe(1);
      expect(['outdoor', 'stairs']).toContain(edge.type);
      const from = nodes.get(edge.from as NodeId)!;
      const to = nodes.get(edge.to as NodeId)!;
      const distance = Math.hypot(
        from.position.x - to.position.x,
        from.position.y - to.position.y
      );
      expect(distance).toBeGreaterThan(0);
      const { from: fromId, ...attributes } = edge;
      expect(graph.get(fromId as NodeId)).toContainEqual({
        ...attributes,
        distance
      });
      expect(graph.get(to.id)).toContainEqual({
        ...attributes,
        to: from.id,
        distance
      });
      if (edge.type === 'stairs') expect(edge.isAccessible).toBe(false);
      else expect(edge.isAccessible).not.toBe(true);
    }
    expect(
      outdoor.nodes.flatMap((node) =>
        (graph.get(node.id as NodeId) ?? []).filter((edge) => ids.has(edge.to))
      )
    ).toHaveLength(outdoor.edges.length * 2);
  });

  it('routes within recorded components, reaches aligned buildings, and preserves separate components', () => {
    const [graph, nodes] = loadGraphFromData();
    const components = outdoor.metadata.components;
    expect(components.length).toBeGreaterThan(1);
    expect(
      components.reduce((sum, component) => sum + component.nodeIds.length, 0)
    ).toBe(outdoor.nodes.length);
    const main = nodes.get(components[0].nodeIds[0] as NodeId)!;
    for (const component of components) {
      const start = nodes.get(component.nodeIds[0] as NodeId)!;
      for (const id of component.nodeIds) {
        expect(
          calculatePath(graph, start, nodes.get(id as NodeId)!),
          id
        ).not.toBeNull();
      }
      if (start.id !== main.id)
        expect(calculatePath(graph, main, start)).toBeNull();
    }
    for (const building of ['ocon', 'lang']) {
      const indoor = [...nodes.values()].find(
        (node) => node.buildingId === building
      )!;
      expect(calculatePath(graph, main, indoor)).not.toBeNull();
    }
    expect([...nodes.values()].some((node) => node.buildingId === 'holt')).toBe(
      false
    );
    const candidates = new Map(
      [...nodes].filter(
        ([, node]) => node.buildingId === null && node.floorId === 0
      )
    );
    expect(
      findNodeNearPosition(candidates, main.position.x, main.position.y, 0)?.id
    ).toBe(main.id);
    expect(findNodeNearPosition(candidates, 0, 0, 1)).toBeNull();
  });

  it('preserves independent positions and edge attributes across loads', () => {
    const [graph, nodes] = loadGraphFromData();
    const id = outdoor.nodes[0].id as NodeId;
    nodes.get(id)!.position.x += 10000;
    graph.get(id)!.length = 0;
    const [freshGraph, freshNodes] = loadGraphFromData();
    expect(freshNodes.get(id)?.position).toEqual(outdoor.nodes[0].position);
    expect(freshGraph.get(id)!.length).toBeGreaterThan(0);
  });
});
