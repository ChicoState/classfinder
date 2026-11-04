import { describe, expect, it } from 'vitest';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';
import endpoints from '../../tools/routing/campus-endpoints.json';

describe('Plumas third-floor campus integration', () => {
  const [graph, nodes] = loadGraphFromData();

  it.each(['stairs-west', 'stairs-east', 'elevator'])(
    'connects the floor 2–3 %s endpoints in both directions',
    (core) => {
      const lower = nodes.get(`plumas-2-${core}` as NodeId)!;
      const upper = nodes.get(`plumas-3-${core}` as NodeId)!;
      const transfer = {
        distance: Math.hypot(
          lower.position.x - upper.position.x,
          lower.position.y - upper.position.y
        ),
        weight: 1,
        type: core === 'elevator' ? 'elevator' : 'stairs',
        ...(core === 'elevator' ? {} : { isAccessible: false })
      };
      expect(graph.get(lower.id)).toContainEqual({ ...transfer, to: upper.id });
      expect(graph.get(upper.id)).toContainEqual({ ...transfer, to: lower.id });
    }
  );

  it('reaches every third-floor node from campus and returns', () => {
    const start = nodes.get(endpoints.ocon as NodeId)!;
    const destinations = [...nodes.values()].filter(
      (node) => node.buildingId === 'plumas' && node.floorId === 3
    );
    expect(destinations).toHaveLength(82);
    for (const goal of destinations) {
      for (const [from, to] of [
        [start, goal],
        [goal, start]
      ]) {
        const path = calculatePath(graph, from, to);
        expect(path, `${from.id} → ${to.id}`).not.toBeNull();
        expect(path?.at(-1)?.to).toBe(to.id);
        expect(
          path?.some((edge) => {
            const a = nodes.get(edge.from)!;
            const b = nodes.get(edge.to)!;
            return (
              a.buildingId === 'plumas' &&
              b.buildingId === 'plumas' &&
              Math.min(a.floorId, b.floorId) === 2 &&
              Math.max(a.floorId, b.floorId) === 3
            );
          })
        ).toBe(true);
      }
    }
  });
});
