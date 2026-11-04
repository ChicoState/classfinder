import { describe, expect, it } from 'vitest';
import maps from '../../src/data/holt/maps/maps.json';
import { toLocalPosition } from '../../src/graph/coordinates';
import { loadGraphFromData } from '../../src/graph/graphLoader';

type Image = {
  width: number;
  height: number;
  graphToPx: number[];
  graphUp: number[];
};
const [, nodes] = loadGraphFromData();
const holt = [...nodes.values()].filter((n) => n.buildingId === 'holt');

describe('Holt floor maps', () => {
  it.each(Object.entries(maps.floors))(
    'floor %s: every loaded node lands on each of the four maps',
    (floor, entry) => {
      const floorNodes = holt.filter((n) => n.floorId === Number(floor));
      expect(floorNodes.length).toBeGreaterThan(0);
      expect(entry.alignment.medianFt).toBeLessThan(2);
      for (const facing of ['N', 'E', 'S', 'W'] as const) {
        const { width, height, graphToPx: m }: Image = entry[facing];
        for (const node of floorNodes) {
          const { x, y } = toLocalPosition(node.position, 'holt');
          const px = m[0] * x + m[2] * y + m[4];
          const py = m[1] * x + m[3] * y + m[5];
          expect(px).toBeGreaterThan(0);
          expect(px).toBeLessThan(width);
          expect(py).toBeGreaterThan(0);
          expect(py).toBeLessThan(height);
        }
      }
    }
  );
});
