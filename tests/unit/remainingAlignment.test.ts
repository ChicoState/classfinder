import { describe, expect, it } from 'vitest';
import alignment from '../../src/graph/campusAlignment.json';
import config from '../../tools/outdoor/remaining-alignment.json';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { toGlobalPosition } from '../../src/graph/coordinates';
import type { NodeId } from '../../src/lib/graph';

type Source = {
  nodes?: {
    id: string;
    buildingId: string | null;
    floorId: number;
    position: { x: number; y: number };
  }[];
  edges: { from: string; to: string }[];
};
const datasets = Object.values(
  import.meta.glob<Source>('../../src/data/*/*.json', {
    eager: true,
    import: 'default'
  })
);

describe('remaining campus building registrations', () => {
  it('fits every building to source landmarks within its documented eight-foot limit', () => {
    for (const id of Object.keys(config)) {
      const t = alignment.buildings[id as keyof typeof alignment.buildings];
      expect(t.scale).toBeGreaterThan(0.95);
      expect(t.scale).toBeLessThan(1.05);
      for (const anchor of t.anchors) {
        const p = toGlobalPosition(anchor.localPosition, id);
        expect(
          Math.hypot(
            p.x - anchor.globalPosition.x,
            p.y - anchor.globalPosition.y
          )
        ).toBeLessThan(8);
      }
    }
  });
  it('loads every saved node and both directions of every edge without exclusions', () => {
    const [graph, nodes] = loadGraphFromData();
    const sourceNodes = datasets.flatMap((d) => d.nodes ?? []);
    expect(alignment.excludedBuildingIds).toEqual([]);
    expect(nodes.size).toBe(sourceNodes.length);
    expect([...graph.values()].reduce((n, edges) => n + edges.length, 0)).toBe(
      2 * datasets.reduce((n, d) => n + d.edges.length, 0)
    );
    for (const n of sourceNodes) {
      const loaded = nodes.get(n.id as NodeId)!;
      expect(loaded.position).toEqual(
        toGlobalPosition(n.position, n.buildingId)
      );
      expect(loaded.floorId).toBe(n.floorId);
      expect(
        Number.isFinite(loaded.position.x) && Number.isFinite(loaded.position.y)
      ).toBe(true);
    }
    for (const edges of graph.values())
      for (const e of edges) {
        expect(Number.isFinite(e.distance) && e.distance >= 0).toBe(true);
        expect(nodes.has(e.to)).toBe(true);
      }
  });
});
