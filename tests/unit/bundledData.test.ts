import { describe, expect, it } from 'vitest';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import type { Node, Edge, NodeId } from '../../src/lib/graph';

type Dataset = {
  nodes?: Node[];
  edges: (Omit<Edge, 'to' | 'distance'> & { from: string; to: string })[];
};
const files = import.meta.glob<Dataset>('../../src/data/*/*.json', {
  eager: true,
  import: 'default'
});

describe('bundled campus data', () => {
  it('has globally unique node IDs and finite coordinates', () => {
    const nodes = Object.values(files).flatMap((file) => file.nodes ?? []);
    expect(nodes.length).toBeGreaterThan(0);
    expect(new Set(nodes.map((node) => node.id)).size).toBe(nodes.length);
    for (const node of nodes) {
      expect(Number.isFinite(node.position.x), node.id).toBe(true);
      expect(Number.isFinite(node.position.y), node.id).toBe(true);
      expect(Number.isInteger(node.floorId), node.id).toBe(true);
    }
  });

  it.each(Object.entries(files))(
    '%s contains valid, reversible routing edges',
    (_name, file) => {
      const [graph, nodes] = loadGraphFromData();
      for (const { from, to, ...edge } of file.edges) {
        expect(nodes.has(from as NodeId), from).toBe(true);
        expect(nodes.has(to as NodeId), to).toBe(true);
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
        const a = nodes.get(from as NodeId)!;
        const b = nodes.get(to as NodeId)!;
        const distance = Math.hypot(
          a.position.x - b.position.x,
          a.position.y - b.position.y
        );
        expect(graph.get(a.id)).toContainEqual({ ...edge, to, distance });
        expect(graph.get(b.id)).toContainEqual({ ...edge, to: from, distance });
      }
    }
  );
});
