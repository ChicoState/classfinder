import { describe, expect, it } from 'vitest';
import alignment from '../../src/graph/campusAlignment.json';
import outdoor from '../../src/data/outdoor/campus.json';
import links from '../../src/data/outdoor/building-connections.json';
import ocon from '../../src/data/ocon/floor-1.json';
import lang from '../../src/data/lang/floor-1.json';
import { toGlobalPosition } from '../../src/graph/coordinates';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

describe('campus coordinate frame and entrance connections', () => {
  it('uses the outdoor origin for every loaded position and omits unaligned Holt', () => {
    const [, nodes] = loadGraphFromData();
    expect(
      nodes.get(alignment.globalFrame.originNodeId as NodeId)?.position
    ).toEqual({ x: 0, y: 0 });
    expect(alignment.globalFrame.units).toBe('feet');
    expect([...nodes.values()].some((node) => node.buildingId === 'holt')).toBe(
      false
    );
    for (const floor of [ocon, lang]) {
      const localOrigin = floor.nodes.find(
        (node) => node.id === floor.metadata.origin.nodeId
      )!;
      const globalOrigin = nodes.get(localOrigin.id as NodeId)!;
      expect(globalOrigin.position).not.toEqual({ x: 0, y: 0 });
      expect(globalOrigin.position).toEqual(
        toGlobalPosition(localOrigin.position, localOrigin.buildingId)
      );
      expect(localOrigin.position).toEqual({ x: 0, y: 0 });
    }
    const outside = outdoor.nodes[0];
    expect(nodes.get(outside.id as NodeId)?.position).toEqual(outside.position);
    expect(toGlobalPosition({ x: 12, y: -8 }, null)).toEqual({ x: 12, y: -8 });
    expect(() => toGlobalPosition({ x: 0, y: 0 }, 'unknown')).toThrow(
      /alignment/i
    );
  });

  it('fits independently matched landmarks within the recorded uncertainty', () => {
    for (const [buildingId, transform] of Object.entries(alignment.buildings)) {
      expect(transform.scale).toBeGreaterThan(0);
      for (const anchor of transform.anchors) {
        const calculated = toGlobalPosition(anchor.localPosition, buildingId);
        const error = Math.hypot(
          calculated.x - anchor.globalPosition.x,
          calculated.y - anchor.globalPosition.y
        );
        expect(error).toBeLessThanOrEqual(transform.maxResidualFeet + 0.000001);
        expect(error).toBeLessThan(5);
      }
    }
  });

  it('connects explicit ground-floor entrances with short, bidirectional links', () => {
    const [graph, nodes] = loadGraphFromData();
    expect(links.metadata.connections.length).toBe(7);
    for (const edge of links.edges.filter(
      (edge) => nodes.get(edge.from as NodeId)?.buildingId !== null
    )) {
      const indoor = nodes.get(edge.from as NodeId)!;
      const outside = nodes.get(edge.to as NodeId)!;
      expect(['ocon', 'lang']).toContain(indoor.buildingId);
      expect(indoor.floorId).toBe(1);
      expect(outside.buildingId).toBeNull();
      expect(outside.floorId).toBe(0);
      const loaded = graph
        .get(indoor.id)!
        .find((candidate) => candidate.to === outside.id)!;
      expect(loaded.distance).toBeLessThan(12);
      expect(loaded.distance).toBeGreaterThan(0);
      expect(graph.get(outside.id)).toContainEqual({
        ...loaded,
        to: indoor.id
      });
      expect(loaded.isAccessible).toBeUndefined();
    }
  });

  it('connects all three confirmed gates through approaches on the exterior side of the fence', () => {
    const [graph, nodes] = loadGraphFromData();
    const transform = alignment.buildings.lang;
    expect(
      new Set(links.edges.map((edge) => [edge.from, edge.to].sort().join('|')))
        .size
    ).toBe(links.edges.length);
    for (const edge of links.edges) {
      expect(edge).not.toHaveProperty('distance');
      expect(edge.weight).toBe(1);
      const loaded = graph
        .get(edge.from as NodeId)!
        .find((candidate) => candidate.to === edge.to)!;
      expect(loaded.distance).toBeGreaterThan(0);
      expect(Number.isFinite(loaded.distance)).toBe(true);
      expect(graph.get(edge.to as NodeId)).toContainEqual({
        ...loaded,
        to: edge.from
      });
    }
    for (const section of ['west', 'middle', 'east']) {
      const gate = nodes.get(`lang-1-fence-gate-${section}` as NodeId)!;
      const approach = nodes.get(
        `outdoor-0-lang-gate-${section}-approach` as NodeId
      )!;
      expect(approach, section).toBeDefined();
      expect(approach.buildingId).toBeNull();
      expect(approach.floorId).toBe(0);
      const edge = graph.get(gate.id)!.find((edge) => edge.to === approach.id)!;
      expect(edge.type).toBe('door');
      expect(edge.isAccessible).toBeUndefined();
      expect(edge.distance).toBeCloseTo(5, 1);
      const dx = approach.position.x - gate.position.x;
      const dy = approach.position.y - gate.position.y;
      expect(
        (-transform.b * dx + transform.a * dy) / transform.scale
      ).toBeCloseTo(5, 1);
      expect(
        (transform.a * dx + transform.b * dy) / transform.scale
      ).toBeCloseTo(0, 1);
      expect(graph.get(approach.id)).toContainEqual({ ...edge, to: gate.id });
      const route = calculatePath(
        graph,
        gate,
        nodes.get('outdoor-0-osm-5862340697' as NodeId)!
      );
      expect(route).not.toBeNull();
      expect(
        route!.every((step) => nodes.get(step.to)!.buildingId === null)
      ).toBe(true);
    }
    const route = calculatePath(
      graph,
      nodes.get('ocon-1-room-124' as NodeId)!,
      nodes.get('lang-1-room-120' as NodeId)!
    )!;
    expect(route.some((edge) => edge.to.startsWith('lang-1-fence-gate-'))).toBe(
      true
    );
    expect(route.some((edge) => edge.type === 'stairs')).toBe(false);
    expect(route.reduce((sum, edge) => sum + edge.distance, 0)).toBeLessThan(
      400
    );
  });

  it('runs real Dijkstra from an O’Connell room through outdoors to a Langdon room and back', () => {
    const [graph, nodes] = loadGraphFromData();
    const start = nodes.get('ocon-1-room-124' as NodeId)!;
    const end = nodes.get('lang-1-room-120' as NodeId)!;
    const outward = calculatePath(graph, start, end);
    const inward = calculatePath(graph, end, start);
    expect(outward).not.toBeNull();
    expect(inward).not.toBeNull();
    expect(outward!.at(-1)?.to).toBe(end.id);
    expect(inward!.at(-1)?.to).toBe(start.id);
    const routeNodes = [start, ...outward!.map((edge) => nodes.get(edge.to)!)];
    expect(routeNodes.some((node) => node.buildingId === null)).toBe(true);
    expect(routeNodes.some((node) => node.buildingId === 'ocon')).toBe(true);
    expect(routeNodes.some((node) => node.buildingId === 'lang')).toBe(true);
    const distance = outward!.reduce((sum, edge) => sum + edge.distance, 0);
    expect(Number.isFinite(distance)).toBe(true);
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(2000);
    expect(inward!.reduce((sum, edge) => sum + edge.distance, 0)).toBeCloseTo(
      distance,
      6
    );
    for (const link of outward!.filter(
      (edge) =>
        nodes.get(edge.from)!.buildingId !== nodes.get(edge.to)!.buildingId
    )) {
      expect(
        links.edges.some(
          (edge) =>
            (edge.from === link.from && edge.to === link.to) ||
            (edge.to === link.from && edge.from === link.to)
        )
      ).toBe(true);
    }
  });

  it('applies the same building similarity transform to every floor and every distance', () => {
    const [graph, nodes] = loadGraphFromData();
    for (const floor of [ocon, lang]) {
      const transform = alignment.buildings[floor === lang ? 'lang' : 'ocon'];
      for (const edge of floor.edges) {
        const localA = floor.nodes.find((node) => node.id === edge.from)!;
        const localB = floor.nodes.find((node) => node.id === edge.to)!;
        const expected =
          Math.hypot(
            localA.position.x - localB.position.x,
            localA.position.y - localB.position.y
          ) * transform.scale;
        expect(
          graph
            .get(edge.from as NodeId)!
            .find((candidate) => candidate.to === edge.to)!.distance
        ).toBeCloseTo(expected, 8);
      }
    }
    expect(nodes.get('ocon-4-room-436' as NodeId)?.buildingId).toBe('ocon');
    expect(nodes.get('lang-3-room-300' as NodeId)?.buildingId).toBe('lang');
  });
});
