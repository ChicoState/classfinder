/** Small plane-geometry helpers (feet). Polygons are rings of points, first point not repeated. */
import type { Point } from './dxf.ts';

export type Ring = Point[];
/** Affine map as in SVG matrix(a, b, c, d, e, f): x' = a*x + c*y + e, y' = b*x + d*y + f. */
export type Affine = [number, number, number, number, number, number];

export function area(ring: Ring): number {
  let s = 0;
  ring.forEach((p, i) => {
    const q = ring[(i + 1) % ring.length];
    s += p.x * q.y - q.x * p.y;
  });
  return Math.abs(s) / 2;
}

export function centroid(ring: Ring): Point {
  let a = 0;
  let x = 0;
  let y = 0;
  ring.forEach((p, i) => {
    const q = ring[(i + 1) % ring.length];
    const k = p.x * q.y - q.x * p.y;
    a += k;
    x += (p.x + q.x) * k;
    y += (p.y + q.y) * k;
  });
  if (Math.abs(a) < 1e-9) return ring[0];
  return { x: x / (3 * a), y: y / (3 * a) };
}

export function contains(ring: Ring, p: Point): boolean {
  let inside = false;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  });
  return inside;
}

/** Closest point to p on segment ab. */
export function closestOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  const t = len
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len))
    : 0;
  return { x: a.x + t * dx, y: a.y + t * dy };
}

export const dist = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y);

/** Closest point to p on a ring's edges. */
export function closestOnRing(p: Point, ring: Ring): Point {
  let best = ring[0];
  ring.forEach((a, i) => {
    const q = closestOnSegment(p, a, ring[(i + 1) % ring.length]);
    if (dist(p, q) < dist(p, best)) best = q;
  });
  return best;
}

export const distToRing = (p: Point, ring: Ring) =>
  dist(p, closestOnRing(p, ring));

/** A point well inside the polygon for a label: the centroid if it fits, else the deepest grid point. */
export function labelPoint(ring: Ring): Point {
  const c = centroid(ring);
  const xs = ring.map((p) => p.x);
  const ys = ring.map((p) => p.y);
  const size = Math.min(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys)
  );
  if (contains(ring, c) && distToRing(c, ring) >= size / 4) return c;
  let best = c;
  let depth = contains(ring, c) ? distToRing(c, ring) : -1;
  for (let i = 1; i < 12; i++) {
    for (let j = 1; j < 12; j++) {
      const p = {
        x: Math.min(...xs) + ((Math.max(...xs) - Math.min(...xs)) * i) / 12,
        y: Math.min(...ys) + ((Math.max(...ys) - Math.min(...ys)) * j) / 12
      };
      const d = contains(ring, p) ? distToRing(p, ring) : -1;
      if (d > depth) [best, depth] = [p, d];
    }
  }
  return best;
}

/** Convex hull (monotone chain), counter-clockwise. */
export function hull(points: Point[]): Ring {
  const ps = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (list: Point[]) => {
    const out: Point[] = [];
    for (const p of list) {
      while (
        out.length >= 2 &&
        cross(out[out.length - 2], out[out.length - 1], p) <= 0
      )
        out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  return [...half(ps), ...half([...ps].reverse())];
}

/**
 * Rotation (degrees, within ±45) that lines up the long side of the smallest enclosing rectangle
 * with the image edges, so that hallways run square to the picture.
 */
export function squareAngle(points: Point[]): number {
  const h = hull(points);
  let best = { area: Infinity, angle: 0, long: 0 };
  h.forEach((a, i) => {
    const b = h[(i + 1) % h.length];
    const t = Math.atan2(b.y - a.y, b.x - a.x);
    const r = h.map((p) => rotate(p, -t));
    const w = Math.max(...r.map((p) => p.x)) - Math.min(...r.map((p) => p.x));
    const hh = Math.max(...r.map((p) => p.y)) - Math.min(...r.map((p) => p.y));
    if (w * hh < best.area - 1e-9)
      best = { area: w * hh, angle: t, long: w >= hh ? 0 : 90 };
  });
  const deg = (best.angle * 180) / Math.PI + best.long;
  return -((((deg + 45) % 90) + 90) % 90) + 45;
}

export function rotate(
  p: Point,
  rad: number,
  o: Point = { x: 0, y: 0 }
): Point {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return {
    x: o.x + c * (p.x - o.x) - s * (p.y - o.y),
    y: o.y + s * (p.x - o.x) + c * (p.y - o.y)
  };
}

export const apply = (m: Affine, p: Point): Point => ({
  x: m[0] * p.x + m[2] * p.y + m[4],
  y: m[1] * p.x + m[3] * p.y + m[5]
});

/** m after n: the map p -> m(n(p)). */
export function compose(m: Affine, n: Affine): Affine {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5]
  ];
}
