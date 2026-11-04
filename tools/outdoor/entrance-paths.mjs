// Offline geometry checks for provisional entrance approaches, never runtime routing.
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export function inside(p, polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      result = !result;
  }
  return result;
}
function crosses(a, b, c, d) {
  const side = (a, b, p) =>
    (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  return (
    side(a, b, c) * side(a, b, d) < -1e-8 &&
    side(c, d, a) * side(c, d, b) < -1e-8
  );
}
function intersects(a, b, c, d) {
  if (crosses(a, b, c, d)) return true;
  const on = (p, u, v) =>
    Math.abs((v.x - u.x) * (p.y - u.y) - (v.y - u.y) * (p.x - u.x)) < 1e-7 &&
    p.x >= Math.min(u.x, v.x) - 1e-7 &&
    p.x <= Math.max(u.x, v.x) + 1e-7 &&
    p.y >= Math.min(u.y, v.y) - 1e-7 &&
    p.y <= Math.max(u.y, v.y) + 1e-7;
  return on(a, c, d) || on(b, c, d) || on(c, a, b) || on(d, a, b);
}
export function clear(a, b, polygons, barriers = []) {
  if (
    polygons.some(
      (poly) =>
        inside({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, poly) ||
        poly.some((p, i) => crosses(a, b, p, poly[(i + 1) % poly.length]))
    )
  )
    return false;
  return !barriers.some((line) =>
    line.some((p, i) => i && intersects(a, b, line[i - 1], p))
  );
}
export function route(start, targets, polygons, barriers) {
  const nearby = [...polygons, ...barriers].filter((poly) =>
    poly.some((p) => distance(p, start) < 250)
  );
  const points = [start, ...targets];
  // Small offsets outside nearby corners allow paths around walls rather than
  // straight nearest-node shortcuts through buildings. Final paths need map review.
  for (const poly of nearby)
    for (const v of poly)
      for (const [dx, dy] of [
        [-5, -5],
        [-5, 5],
        [5, -5],
        [5, 5]
      ]) {
        const p = { x: v.x + dx, y: v.y + dy };
        if (
          distance(p, start) < 250 &&
          !polygons.some((poly) => inside(p, poly))
        )
          points.push(p);
      }
  const costs = points.map(() => Infinity),
    previous = points.map(() => -1),
    done = new Set();
  costs[0] = 0;
  while (true) {
    let u = -1;
    for (let i = 0; i < points.length; i++)
      if (!done.has(i) && (u < 0 || costs[i] < costs[u])) u = i;
    if (u < 0 || !Number.isFinite(costs[u]))
      throw new Error(
        `No visible outdoor approach from ${JSON.stringify(start)}`
      );
    if (u > 0 && u <= targets.length) {
      const path = [];
      let k = u;
      while (k !== 0) {
        path.unshift(points[k]);
        k = previous[k];
      }
      return path;
    }
    done.add(u);
    for (let v = 1; v < points.length; v++) {
      const cost = costs[u] + distance(points[u], points[v]);
      if (
        !done.has(v) &&
        cost < costs[v] &&
        clear(points[u], points[v], polygons, barriers)
      ) {
        costs[v] = cost;
        previous[v] = u;
      }
    }
  }
}
