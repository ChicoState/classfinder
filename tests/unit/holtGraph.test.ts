import { describe, expect, it } from 'vitest';
import floor from '../../src/data/holt/floor-1.json';
import { connectBothWays } from '../../src/graph/graphLoader';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { EdgeKind, Graph, Nodes, NodeId } from '../../src/lib/graph';

// Validate local first-floor topology independently of outdoor and upper-floor links.
function loadHoltSourceGraph(): [Graph, Nodes] {
  const nodes: Nodes = new Map(
    floor.nodes.map((node) => [
      node.id as NodeId,
      { ...node, id: node.id as NodeId, position: { ...node.position } }
    ])
  );
  const graph: Graph = new Map([...nodes.keys()].map((id) => [id, []]));
  for (const { from, to, ...edge } of floor.edges) {
    const a = nodes.get(from as NodeId)!;
    const b = nodes.get(to as NodeId)!;
    connectBothWays(graph, a.id, b.id, {
      ...edge,
      type: edge.type as EdgeKind,
      distance: Math.hypot(
        a.position.x - b.position.x,
        a.position.y - b.position.y
      )
    });
  }
  return [graph, nodes];
}

describe('preserved Holt first-floor source graph', () => {
  it('loads unique, finite geometry and one pair of links per undirected edge', () => {
    const [graph, nodes] = loadHoltSourceGraph();
    const ids = new Set(floor.nodes.map((node) => node.id));
    expect(ids.size).toBe(floor.nodes.length);
    expect(floor.metadata.undirected).toBe(true);
    expect(nodes.get(floor.metadata.origin.nodeId as NodeId)?.position).toEqual(
      { x: 0, y: 0 }
    );
    expect(
      new Set(floor.edges.map((edge) => [edge.from, edge.to].sort().join('|')))
        .size
    ).toBe(floor.edges.length);
    for (const node of floor.nodes) {
      expect(node.buildingId).toBe('holt');
      expect(node.floorId).toBe(1);
      expect(
        Number.isFinite(node.position.x) && Number.isFinite(node.position.y)
      ).toBe(true);
    }
    for (const edge of floor.edges) {
      expect(edge.from).not.toBe(edge.to);
      expect(ids.has(edge.from) && ids.has(edge.to)).toBe(true);
      expect(edge).not.toHaveProperty('distance');
      const from = nodes.get(edge.from as NodeId)!;
      const to = nodes.get(edge.to as NodeId)!;
      const { from: fromId, ...attributes } = edge;
      const distance = Math.hypot(
        from.position.x - to.position.x,
        from.position.y - to.position.y
      );
      expect(Number.isFinite(distance)).toBe(true);
      expect(graph.get(fromId as NodeId)).toContainEqual({
        ...attributes,
        distance
      });
      expect(graph.get(to.id)).toContainEqual({
        ...attributes,
        to: from.id,
        distance
      });
    }
    expect(
      floor.nodes.flatMap((node) => graph.get(node.id as NodeId) ?? [])
    ).toHaveLength(floor.edges.length * 2);
  });

  it('reaches every doorway and stair landing from the reference entrance in both directions', () => {
    const [graph, nodes] = loadHoltSourceGraph();
    const entrance = nodes.get(floor.metadata.origin.nodeId as NodeId)!;
    for (const node of floor.nodes) {
      const destination = nodes.get(node.id as NodeId)!;
      const outward = calculatePath(graph, entrance, destination);
      const inward = calculatePath(graph, destination, entrance);
      expect(outward, node.id).not.toBeNull();
      expect(inward, node.id).not.toBeNull();
    }
    const candidates = new Map(
      [...nodes].filter(
        ([, node]) => node.buildingId === 'holt' && node.floorId === 1
      )
    );
    expect(findNodeNearPosition(candidates, 0, 0, 1)?.id).toBe(entrance.id);
    expect(nodes.has('lang-1-exit-119-west' as NodeId)).toBe(false);
  });

  it('walks through the confirmed stair rooms without treating the level passages as stair traversal', () => {
    const [graph, nodes] = loadHoltSourceGraph();
    for (const [from, to] of [
      ['stairs-middle-north-west-door-256', 'stairs-middle-north-east'],
      ['stairs-middle-north-west-door-265', 'stairs-middle-north-east'],
      ['stairs-middle-south-west-door-472', 'stairs-middle-south-east'],
      ['stairs-middle-south-west-door-481', 'stairs-middle-south-east'],
      ['stairs-north-east-upper', 'stairs-north-east-lower']
    ]) {
      expect(nodes.has(`holt-1-${from}` as NodeId), from).toBe(true);
      expect(nodes.has(`holt-1-${to}` as NodeId), to).toBe(true);
      const path = calculatePath(
        graph,
        nodes.get(`holt-1-${from}` as NodeId)!,
        nodes.get(`holt-1-${to}` as NodeId)!
      );
      expect(path).not.toBeNull();
      expect(path!.length).toBeLessThanOrEqual(2);
      expect(path!.every((edge) => edge.type === 'corridor')).toBe(true);
      expect(path!.every((edge) => !('isAccessible' in edge))).toBe(true);
    }
  });

  it('places restored approaches at the source PDF openings using the current origin', () => {
    const [, nodes] = loadHoltSourceGraph();
    const expected = [
      ['stairs-middle-north-west-door-256', 262, 256],
      ['stairs-middle-north-west-door-265', 262, 265],
      ['stairs-middle-north-east', 307, 260],
      ['stairs-middle-south-west-door-472', 262, 472],
      ['stairs-middle-south-west-door-481', 262, 481],
      ['stairs-middle-south-east', 307, 477],
      ['stairs-north-east-upper', 340, 224],
      ['stairs-north-east-lower', 340, 244]
    ] as const;
    const factor = floor.metadata.feetPerPdfPoint;
    const origin = floor.metadata.origin.pdfPointFromTopLeft;
    for (const [id, pdfX, pdfY] of expected) {
      const n = nodes.get(`holt-1-${id}` as NodeId)!;
      expect(origin.x + n.position.x / factor, id).toBeCloseTo(pdfX, 1);
      expect(origin.y - n.position.y / factor, id).toBeCloseTo(pdfY, 1);
    }
  });

  it('preserves the parent-room access shown in the drawing', () => {
    const [graph, nodes] = loadHoltSourceGraph();
    const entrance = nodes.get(floor.metadata.origin.nodeId as NodeId)!;
    for (const [room, parents] of [
      ['177', ['181']],
      ['175A', ['175-inner']],
      ['171A', ['171-inner']],
      ['157A', ['157-inner']],
      ['131A', ['131-inner']],
      ['101A', ['101-inner-south', '111-north-door']],
      ['101B', ['101-inner-south', '111-north-door']],
      ['101C', ['101-inner-south', '111-north-door']],
      ['165A', ['165-inner-lower']]
    ] as const) {
      const path = calculatePath(
        graph,
        entrance,
        nodes.get(`holt-1-room-${room}` as NodeId)!
      );
      expect(
        path?.some((edge) =>
          parents.some((parent) => edge.to === `holt-1-room-${parent}`)
        ),
        room
      ).toBe(true);
    }
    const accessible = floor.edges.filter(
      (edge) => 'isAccessible' in edge && edge.isAccessible === true
    );
    expect(accessible.map((edge) => edge.from).sort()).toEqual([
      'holt-1-exit-north-ao',
      'holt-1-exit-south-ao'
    ]);
    expect(
      floor.edges
        .filter((edge) => edge.type === 'stairs')
        .every((edge) => 'isAccessible' in edge && edge.isAccessible === false)
    ).toBe(true);
    expect(floor.metadata.feetPerPdfPoint).toBe(40 / 72);
  });
});
