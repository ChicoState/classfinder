/**
 * Renders a floor scene as an SVG base map facing N, E, S or W: hallways squared to the image,
 * labels upright, Chico State colours. Routes are not drawn here; the layout says how to place
 * graph coordinates on the image so the app can draw them.
 */
import type { Point } from './dxf.ts';
import {
  apply,
  area,
  compose,
  contains,
  distToRing,
  labelPoint,
  rotate,
  squareAngle,
  type Affine,
  type Ring
} from './geometry.ts';
import type { Room, Scene } from './scene.ts';

export const FACINGS = { N: 0, E: 90, S: 180, W: -90 } as const;
export type Facing = keyof typeof FACINGS;

/** Chico State brand: white, black, Chico Red #9D2235, Cornerstone Gray #75787B. */
export const CHICO_STATE = {
  background: '#ffffff',
  room: '#ffffff',
  hall: '#f1f1ef',
  wall: '#000000',
  accent: '#9d2235',
  void: '#75787b',
  private: '#e0e0e0',
  ink: '#1f2328',
  font: 'Gotham, Arial, Helvetica, sans-serif',
  textSize: 1,
  wallFt: 0.7,
  paddingFt: 12,
  widthPx: 1200,
  labels: true,
  badges: true,
  compass: true
};
export type Style = typeof CHICO_STATE;

/** Similarity from graph feet to plan feet: plan = a * graph + b (complex numbers). */
export type Fit = { a: [number, number]; b: [number, number] };

export type Layout = {
  facing: Facing;
  width: number;
  height: number;
  /** SVG matrix(a, b, c, d, e, f) from graph feet to image pixels; present when a graph was aligned. */
  graphToPx?: Affine;
  /** Unit vector in graph coordinates that points up in this image. */
  graphUp?: [number, number];
};

const esc = (s: string) =>
  s.replace(
    /[&<>"]/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!
  );
const n = (v: number) => (Math.round(v * 100) / 100).toString();
const path = (ring: Ring) =>
  'M' + ring.map((p) => `${n(p.x)},${n(p.y)}`).join('L') + 'Z';

export function render(
  scene: Scene,
  facing: Facing,
  style: Partial<Style> = {},
  fit?: Fit
): { svg: string; layout: Layout } {
  const S = { ...CHICO_STATE, ...style };
  const allPoints = scene.outline.flat();
  const origin = { x: 0, y: 0 };
  allPoints.forEach((p) => {
    origin.x += p.x / allPoints.length;
    origin.y += p.y / allPoints.length;
  });

  // Plan -> pixels: square the building, turn it to the facing, frame it with padding.
  const rad = ((squareAngle(allPoints) + FACINGS[facing]) * Math.PI) / 180;
  const turned = allPoints.map((p) => rotate(p, rad, origin));
  const x0 = Math.min(...turned.map((p) => p.x)) - S.paddingFt;
  const y1 = Math.max(...turned.map((p) => p.y)) + S.paddingFt;
  const wFt = Math.max(...turned.map((p) => p.x)) + S.paddingFt - x0;
  const hFt = y1 - (Math.min(...turned.map((p) => p.y)) - S.paddingFt);
  const W = Math.round(S.widthPx);
  const H = Math.round((W * hFt) / wFt);
  const s = W / wFt;
  const turn: Affine = [
    Math.cos(rad),
    Math.sin(rad),
    -Math.sin(rad),
    Math.cos(rad),
    origin.x - Math.cos(rad) * origin.x + Math.sin(rad) * origin.y,
    origin.y - Math.sin(rad) * origin.x - Math.cos(rad) * origin.y
  ];
  const planToPx = compose([s, 0, 0, -s, -s * x0, s * y1], turn);
  const px = (p: Point) => apply(planToPx, p);
  const u = Math.max(W, H) / 900; // one design pixel: text and badges scale with the image

  const fill = (r: Room) =>
    r.kind === 'private'
      ? S.private
      : r.kind === 'hall' || r.kind === 'stair' || r.kind === 'elevator'
        ? S.hall
        : S.room;
  const out = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" ` +
      `font-family="${esc(S.font)}">`,
    `<rect width="${W}" height="${H}" fill="${S.background}"/>`,
    // Full precision: plan coordinates are hundreds of feet, so rounding here would shift the map.
    `<g transform="matrix(${planToPx.map((v) => +v.toFixed(6)).join(' ')})" stroke-linejoin="miter">`,
    // Building: shafts and courtyards show through; walls fill the gaps between rooms.
    ...scene.outline.map(
      (r) =>
        `<path d="${path(r)}" fill="${S.void}" stroke="${S.wall}" stroke-width="2"/>`
    ),
    `<g fill="none" stroke="${S.wall}" stroke-width="1.6">`,
    ...scene.rooms.map((r) => `<path d="${path(r.ring)}"/>`),
    `</g><g stroke="${S.wall}" stroke-width="${n(S.wallFt)}">`,
    ...scene.rooms.map((r) => {
      const id =
        r.number && r.kind !== 'private' ? ` data-room="${esc(r.number)}"` : '';
      return `<path d="${path(r.ring)}" fill="${fill(r)}" data-kind="${r.kind}"${id}/>`;
    }),
    `</g><g stroke="${S.hall}" stroke-width="${n(S.wallFt + 1.8)}">`,
    ...scene.doors.map(
      (d) =>
        `<path d="M${n(d.from.x)},${n(d.from.y)}L${n(d.to.x)},${n(d.to.y)}"/>`
    ),
    '</g></g>'
  ];

  // Labels and badges, upright, services first then larger rooms, never overlapping.
  const placed: Array<[number, number, number, number]> = [];
  const fits = (p: Point, w: number, h: number) => {
    const b: [number, number, number, number] = [
      p.x - w / 2,
      p.y - h / 2,
      p.x + w / 2,
      p.y + h / 2
    ];
    const free =
      b[0] >= 0 &&
      b[1] >= 0 &&
      b[2] <= W &&
      b[3] <= H &&
      !placed.some(
        (q) => b[0] < q[2] && q[0] < b[2] && b[1] < q[3] && q[1] < b[3]
      );
    if (free) placed.push(b);
    return free;
  };
  const fs = 14 * S.textSize * u;
  const badge = (p: Point, text: string, colour: string) => {
    const size = 11 * S.textSize * u;
    const w = size * (0.65 * [...text].length + 0.9);
    if (!fits(p, w, size * 1.5)) return;
    out.push(
      `<g transform="translate(${n(p.x)},${n(p.y)})"><rect x="${n(-w / 2)}" y="${n(-size * 0.75)}" ` +
        `width="${n(w)}" height="${n(size * 1.5)}" rx="${n(size * 0.4)}" fill="${colour}"/>` +
        `<text font-size="${n(size)}" fill="#ffffff" text-anchor="middle" dy="${n(size * 0.36)}" ` +
        `font-weight="700">${esc(text)}</text></g>`
    );
  };
  const order = (r: Room) =>
    ['restroom', 'elevator', 'stair'].includes(r.kind) ? 0 : 1;
  const rooms = scene.rooms
    .filter((r) => r.kind !== 'private')
    .sort((a, b) => order(a) - order(b) || area(b.ring) - area(a.ring));
  for (const r of rooms) {
    const p = px(labelPoint(r.ring));
    if (S.badges && r.kind === 'restroom') {
      badge(
        p,
        r.gender === 'men' ? 'WC M' : r.gender === 'women' ? 'WC W' : 'WC',
        S.wall
      );
    } else if (S.badges && (r.kind === 'elevator' || r.kind === 'stair')) {
      badge(p, r.kind === 'elevator' ? 'ELEV' : 'STAIRS', S.wall);
    } else if (
      S.labels &&
      r.number &&
      r.kind !== 'hall' &&
      r.kind !== 'stair'
    ) {
      // Largest size whose box stays inside the room (its edge may reach into the wall).
      const ring = r.ring.map(px);
      const inside = (q: Point) =>
        contains(ring, q) || distToRing(q, ring) < 0.8 * s;
      const size = [fs, fs * 0.8, fs * 0.64].find((f) => {
        const [w, h] = [f * 0.6 * r.number.length + f * 0.2, f * 0.9];
        const corners = [-1, 1].flatMap((i) =>
          [-1, 1].map((j) => ({ x: p.x + (i * w) / 2, y: p.y + (j * h) / 2 }))
        );
        return corners.every(inside) && fits(p, w, h);
      });
      if (size) {
        out.push(
          `<text x="${n(p.x)}" y="${n(p.y)}" font-size="${n(size)}" fill="${S.ink}" ` +
            `text-anchor="middle" dy="${n(size * 0.35)}" font-weight="500">${esc(r.number)}</text>`
        );
      }
    }
  }
  if (S.badges) {
    for (const d of scene.doors.filter((x) => x.entrance)) {
      const p = px({ x: (d.from.x + d.to.x) / 2, y: (d.from.y + d.to.y) / 2 });
      badge(p, d.accessible ? '♿ IN' : 'IN', S.accent);
    }
  }

  if (S.compass) {
    if (scene.northUp) {
      const north = Math.atan2(planToPx[2], -planToPx[3]) * (180 / Math.PI);
      out.push(
        `<g transform="translate(${n(W - 30 * u)},${n(34 * u)}) rotate(${n(north)})">` +
          `<path d="M0,${n(-13 * u)}L${n(6 * u)},${n(7 * u)}L0,${n(3 * u)}L${n(-6 * u)},${n(7 * u)}Z" ` +
          `fill="${S.accent}"/><text y="${n(-17 * u)}" font-size="${n(11 * u)}" fill="${S.ink}" ` +
          `text-anchor="middle" font-weight="700" transform="rotate(${n(-north)} 0 ${n(-21 * u)})">N</text></g>`
      );
    }
    const bar =
      [5, 10, 20, 25, 50, 100, 200, 500].find((ft) => ft >= wFt * 0.15) ?? 1000;
    const bx = 16 * u;
    const by = H - 12 * u;
    out.push(
      `<path d="M${n(bx)},${n(by)}h${n(bar * s)}" stroke="${S.ink}" stroke-width="${n(2 * u)}"/>` +
        `<text x="${n(bx + bar * s + 6 * u)}" y="${n(by)}" dy="${n(4 * u)}" font-size="${n(11 * u)}" ` +
        `fill="${S.ink}">${bar} ft</text>`
    );
  }
  out.push('</svg>');

  const layout: Layout = { facing, width: W, height: H };
  if (fit) {
    const [ar, ai] = fit.a;
    const [br, bi] = fit.b;
    const m = compose(planToPx, [ar, ai, -ai, ar, br, bi]);
    const len = Math.hypot(m[2], m[0]);
    layout.graphToPx = m.map((v) => Math.round(v * 1e6) / 1e6) as Affine;
    layout.graphUp = [
      Math.round((-m[2] / len) * 1e4) / 1e4,
      Math.round((m[0] / len) * 1e4) / 1e4
    ];
  }
  return { svg: out.join('\n') + '\n', layout };
}
