/**
 * Lines up a ClassFinder floor graph (src/data/<building>/floor-N.json) with a CAD floor.
 *
 * Graph positions are feet in the graph's own frame, and room nodes are doorways named
 * "<building>-<floor>-room-<number>". Room numbers are matched to CAD rooms, a similarity
 * (scale, rotation, shift) is fitted from room centres, then refined by snapping each node to its
 * room's nearest door and dropping outliers. No landmarks are entered by hand.
 */
import type { Point } from './dxf.ts';
import {
  centroid,
  closestOnRing,
  dist,
  distToRing,
  type Ring
} from './geometry.ts';
import type { Fit } from './render.ts';
import type { Scene } from './scene.ts';

export type Graph = { nodes?: Array<{ id: string; position: Point }> };
export type Alignment = Fit & {
  matched: number;
  used: number;
  medianFt: number;
  maxFt: number;
};

const MIN_MATCHES = 4;

type Pair = [Point, Point]; // graph point, plan point

/** Least-squares similarity plan = a * graph + b over matched pairs. */
export function fitPairs(pairs: Pair[]): Fit {
  const mean = (k: 0 | 1) => ({
    x: pairs.reduce((s, p) => s + p[k].x, 0) / pairs.length,
    y: pairs.reduce((s, p) => s + p[k].y, 0) / pairs.length
  });
  const zm = mean(0);
  const wm = mean(1);
  let re = 0;
  let im = 0;
  let norm = 0;
  for (const [z, w] of pairs) {
    const dz = { x: z.x - zm.x, y: z.y - zm.y };
    const dw = { x: w.x - wm.x, y: w.y - wm.y };
    re += dw.x * dz.x + dw.y * dz.y; // dw * conj(dz)
    im += dw.y * dz.x - dw.x * dz.y;
    norm += dz.x * dz.x + dz.y * dz.y;
  }
  const a: [number, number] = [re / norm, im / norm];
  return {
    a,
    b: [wm.x - (a[0] * zm.x - a[1] * zm.y), wm.y - (a[0] * zm.y + a[1] * zm.x)]
  };
}

export const applyFit = (f: Fit, z: Point): Point => ({
  x: f.a[0] * z.x - f.a[1] * z.y + f.b[0],
  y: f.a[1] * z.x + f.a[0] * z.y + f.b[1]
});

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function align(graph: Graph, scene: Scene): Alignment {
  const rooms = new Map(
    scene.rooms.filter((r) => r.number).map((r) => [r.number.toUpperCase(), r])
  );
  const doors = scene.doors.map((d) => ({
    x: (d.from.x + d.to.x) / 2,
    y: (d.from.y + d.to.y) / 2
  }));
  const anchors: Array<[Point, Ring]> = [];
  for (const node of graph.nodes ?? []) {
    const m = /-room-(\d+[A-Za-z]?)$/.exec(node.id);
    const room = m && rooms.get(m[1].toUpperCase());
    if (room) anchors.push([node.position, room.ring]);
  }
  if (anchors.length < MIN_MATCHES) {
    throw new Error(
      `only ${anchors.length} graph rooms match this drawing (need ${MIN_MATCHES}); wrong floor?`
    );
  }
  let keep: Pair[] = anchors.map(([z, ring]) => [z, centroid(ring)]);
  let fit = fitPairs(keep);
  for (let round = 0; round < 6; round++) {
    // Snap to the nearest door on this room's wall, else to the nearest point on the wall.
    const pairs: Pair[] = anchors.map(([z, ring]) => {
      const p = applyFit(fit, z);
      const near = doors.filter((d) => distToRing(d, ring) < 2);
      const q = near.length
        ? near.reduce((best, d) => (dist(d, p) < dist(best, p) ? d : best))
        : closestOnRing(p, ring);
      return [z, q];
    });
    const err = pairs.map(([z, w]) => dist(applyFit(fit, z), w));
    const cut = Math.max(3 * median(err), 2);
    keep = pairs.filter((_, i) => err[i] <= cut);
    fit = fitPairs(keep);
  }
  const err = keep.map(([z, w]) => dist(applyFit(fit, z), w));
  const round2 = (v: number) => Math.round(v * 100) / 100;
  return {
    ...fit,
    matched: anchors.length,
    used: keep.length,
    medianFt: round2(median(err)),
    maxFt: round2(Math.max(...err))
  };
}
