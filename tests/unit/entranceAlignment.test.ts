import { describe, expect, it } from 'vitest';
import alignment from '../../src/graph/campusAlignment.json';
import firstConfig from '../../tools/outdoor/entrance-alignment.json';
import remainingConfig from '../../tools/outdoor/remaining-entrances.json';
const config = { ...firstConfig, ...remainingConfig };
import { toGlobalPosition } from '../../src/graph/coordinates';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath } from '../../src/lib/dijkstras';
import type { NodeId, EdgeKind } from '../../src/lib/graph';

type Data = {
  metadata: { connections?: { indoorNodeId: string; reviewId: string }[] };
  nodes?: {
    id: string;
    buildingId: string | null;
    floorId: number;
    position: { x: number; y: number };
  }[];
  edges: {
    from: string;
    to: string;
    weight: number;
    type: EdgeKind;
    isAccessible?: boolean;
  }[];
};
const datasets = Object.values(
  import.meta.glob<Data>('../../src/data/*/*.json', {
    eager: true,
    import: 'default'
  })
);
const links = datasets.find((d) =>
  d.metadata.connections?.some((c) => c.reviewId?.startsWith('ENT-'))
);

describe('campus building entrances', () => {
  it('registers each building against independent footprint landmarks within eight feet', () => {
    for (const id of Object.keys(config)) {
      const t = alignment.buildings[id as keyof typeof alignment.buildings];
      expect(t, id).toBeDefined();
      expect(t.scale).toBeGreaterThan(0.95);
      expect(t.scale).toBeLessThan(1.05);
      expect(t.anchors.length).toBeGreaterThanOrEqual(4);
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

  it('routes every inventoried ground-floor exterior doorway to the campus network in both directions', () => {
    expect(links).toBeDefined();
    const [graph, nodes] = loadGraphFromData();
    const origin = nodes.get(alignment.globalFrame.originNodeId as NodeId)!;
    for (const spec of Object.values(config))
      for (const entrance of spec.entrances) {
        const n = nodes.get(entrance.nodeId as NodeId)!;
        expect(
          links!.metadata.connections!.some(
            (c) => c.indoorNodeId === entrance.nodeId
          ),
          entrance.nodeId
        ).toBe(true);
        expect(calculatePath(graph, n, origin), entrance.nodeId).not.toBeNull();
        expect(calculatePath(graph, origin, n), entrance.nodeId).not.toBeNull();
      }
    for (const nodeId of remainingConfig.modoc.doorwaysViaGates) {
      const n = nodes.get(nodeId as NodeId)!;
      const path = calculatePath(graph, n, origin)!;
      expect(path, nodeId).not.toBeNull();
      const isYard = (id: string) =>
        id.startsWith('modoc-1-') &&
        (id.includes('yard') ||
          id.includes('playground') ||
          id.includes('play-area'));
      const yardGraph = new Map(
        [...graph]
          .filter(([id]) => isYard(id))
          .map(([id, edges]) => [id, edges.filter((e) => isYard(e.to))])
      );
      expect(
        remainingConfig.modoc.gateNodeIds.some(
          (id) => calculatePath(yardGraph, n, nodes.get(id as NodeId)!) !== null
        ),
        nodeId
      ).toBe(true);
      expect(calculatePath(graph, origin, n), nodeId).not.toBeNull();
    }
    const upperWalkway = nodes.get('acker-2-exit-203-walkway' as NodeId)!;
    const upperRoute = calculatePath(graph, upperWalkway, origin)!;
    expect(upperRoute).not.toBeNull();
    expect(upperRoute.some((e) => e.type === 'stairs')).toBe(true);
    for (const e of links!.edges) {
      expect(e.isAccessible).toBeUndefined();
      expect(e).not.toHaveProperty('distance');
      expect(nodes.has(e.from as NodeId)).toBe(true);
      expect(nodes.has(e.to as NodeId)).toBe(true);
    }
  });
});
