/**
 * One CAD floor as a drawable scene: rooms (number, kind, outline), door openings and the building
 * outline, in feet with north up when the drawing carries survey points.
 *
 * Only what a picture needs is read. Restricted layers (telecom, electrical, mechanical, plumbing,
 * structural, fire protection) and anything unmapped, such as title blocks, are skipped unread.
 */
import { readDxf, type Entity, type Point } from './dxf.ts';
import {
  area,
  closestOnSegment,
  contains,
  dist,
  distToRing,
  hull,
  type Ring
} from './geometry.ts';

export type Kind =
  | 'hall'
  | 'stair'
  | 'elevator'
  | 'restroom'
  | 'private'
  | 'room';
export type Room = {
  number: string;
  type: string;
  kind: Kind;
  ring: Ring;
  gender?: 'men' | 'women';
};
export type Door = {
  from: Point;
  to: Point;
  entrance: boolean;
  accessible: boolean;
};
export type Scene = {
  rooms: Room[];
  doors: Door[];
  outline: Ring[];
  northUp: boolean;
};

type Role =
  | 'restricted'
  | 'room'
  | 'number'
  | 'type'
  | 'note'
  | 'door'
  | 'access'
  | 'control';

/** CAD layer -> role (globs, first match wins). Tuned on CSU Chico Facilities drawings. */
const LAYERS: Array<[Role, string[]]> = [
  ['restricted', ['T-*', 'E-*', 'M-*', 'P-*', 'FP-*', 'S-*']],
  ['room', ['A-AREA']],
  ['number', ['A-AREA-IDEN']],
  ['type', ['A-AREA-IDEN-TYPE', 'A-AREA-TYPE']],
  ['note', ['A-FLOR-ANNO']],
  ['door', ['A-DOOR*']],
  ['access', ['A-ANNO-ACCS*']],
  ['control', ['A-CTRL*']]
];

/** Room type text (or Facilities space code) -> kind. Anything else is an ordinary room. */
const KINDS: Array<[Kind, string[]]> = [
  ['hall', ['CORRIDOR*', 'LOBBY*', 'VESTIBULE*', 'W05', 'W06', 'W07']],
  ['stair', ['STAIR*', 'W08']],
  ['elevator', ['ELEVATOR*', 'W02']],
  ['restroom', ['RESTROOM*', 'TOILET*', 'X03']],
  [
    'private',
    [
      'CUSTODIAN*',
      '*STORAGE*',
      '*STOCKRM*',
      'JANITOR*',
      'ELEC*',
      'TELECOM*',
      'MECH*'
    ].concat(['ANIMAL*', '*CHEM*', 'X??', 'Y??'])
  ]
];
const SKIP_TYPES = ['[BG]', '[XX]']; // placeholder outlines; [BG] (gross area) is the building outline

const glob = (pattern: string) =>
  new RegExp(
    '^' +
      pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') +
      '$',
    'i'
  );
const table = <T>(rows: Array<[T, string[]]>) =>
  rows.map(([k, ps]) => [k, ps.map(glob)] as const);
const LAYER_RE = table(LAYERS);
const KIND_RE = table(KINDS);

export function roleOf(layer: string): Role | undefined {
  return LAYER_RE.find(([, res]) => res.some((re) => re.test(layer)))?.[0];
}

export function kindOf(type: string): Kind {
  return (
    KIND_RE.find(([, res]) => res.some((re) => re.test(type)))?.[0] ?? 'room'
  );
}

/** "100D\nCORRIDOR" -> "CORRIDOR": a leading room code line is dropped. */
export function typeText(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 1 && /^\[?\w*\]?\d+[A-Z]?$/.test(lines[0])) lines.shift();
  return lines.join(' ');
}

type Complex = { re: number; im: number };
const mul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re
});
const div = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / d,
    im: (a.im * b.re - a.re * b.im) / d
  };
};
const sub = (a: Complex, b: Complex): Complex => ({
  re: a.re - b.re,
  im: a.im - b.im
});
const c = (p: Point): Complex => ({ re: p.x, im: p.y });

/**
 * Drawing units -> feet, rotated so north is up, from two "SURVEY: E,N" notes (each points at its
 * spot with a leader). Without them the plan is only scaled to feet.
 */
export function georef(
  control: Entity[],
  unitsPerFoot: number
): { a: Complex; b: Complex } {
  const plain = { a: { re: 1 / unitsPerFoot, im: 0 }, b: { re: 0, im: 0 } };
  const leaders = control.flatMap((e) =>
    e.type === 'LEADER' && e.points.length
      ? [[e.points[0], e.points[e.points.length - 1]]]
      : []
  );
  const pairs: Array<[Complex, Complex]> = [];
  for (const e of control) {
    if (e.type !== 'TEXT' && e.type !== 'MTEXT') continue;
    const nums = (
      e.text.match(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g) ?? []
    )
      .map((n) => Number(n.replace(/,/g, '')))
      .filter((n) => n > 1e5);
    if (nums.length < 2) continue;
    const tip = leaders.sort((l, m) => dist(l[1], e.at) - dist(m[1], e.at))[0];
    const spot = tip && dist(tip[1], e.at) < 100 * unitsPerFoot ? tip[0] : e.at;
    pairs.push([c(spot), { re: nums[0], im: nums[1] }]);
  }
  if (pairs.length < 2) return plain;
  const [[z1, w1], [z2, w2]] = pairs;
  if (z1.re === z2.re && z1.im === z2.im) return plain;
  const a = div(sub(w2, w1), sub(z2, z1));
  if (Math.abs(Math.hypot(a.re, a.im) * unitsPerFoot - 1) > 0.05) return plain; // units must agree
  const b = sub(w1, mul(a, z1));
  // Keep numbers small: the picture never shows survey coordinates.
  return {
    a,
    b: {
      re: b.re - Math.round(b.re / 100) * 100,
      im: b.im - Math.round(b.im / 100) * 100
    }
  };
}

export function loadScene(dxfText: string): Scene {
  const drawing = readDxf(dxfText, (layer) => {
    const role = roleOf(layer);
    return role !== undefined && role !== 'restricted';
  });
  const byRole = new Map<Role, Entity[]>();
  for (const e of drawing.entities) {
    const role = roleOf(e.layer)!;
    byRole.set(role, [...(byRole.get(role) ?? []), e]);
  }
  const of = (role: Role) => byRole.get(role) ?? [];
  const { a, b } = georef(of('control'), drawing.unitsPerFoot);
  const T = (p: Point): Point => {
    const w = mul(a, c(p));
    return { x: w.re + b.re, y: w.im + b.im };
  };

  const rings = of('room').flatMap((e) =>
    e.type === 'LWPOLYLINE' && e.points.length >= 3 ? [e.points.map(T)] : []
  );
  const areas = rings.map(area);
  const texts = rings.map(() => ({
    number: [] as string[],
    type: [] as string[],
    note: [] as string[]
  }));
  for (const role of ['number', 'type', 'note'] as const) {
    for (const e of of(role)) {
      if (!('text' in e) || !e.text) continue;
      const p = T(e.at);
      let best = -1;
      rings.forEach((r, i) => {
        if (contains(r, p) && (best < 0 || areas[i] < areas[best])) best = i;
      });
      if (best >= 0) texts[best][role].push(e.text);
    }
  }

  const rooms: Room[] = [];
  const outline: Ring[] = [];
  rings.forEach((ring, i) => {
    if (areas[i] <= 0) return;
    const type = texts[i].type.length ? typeText(texts[i].type[0]) : '';
    if (SKIP_TYPES.some((s) => type.toUpperCase().startsWith(s))) {
      if (type.toUpperCase().startsWith('[BG]')) outline.push(ring);
      return;
    }
    let kind = kindOf(type);
    if (kind === 'elevator' && areas[i] < 30) kind = 'private'; // a 15 sq ft "elevator" is a dumbwaiter
    const notes = texts[i].note.join(' ').toUpperCase();
    const gender = notes.includes('WOMEN')
      ? 'women'
      : /\bMEN\b/.test(notes)
        ? 'men'
        : undefined;
    rooms.push({
      number: (texts[i].number[0] ?? '').trim(),
      type,
      kind,
      ring,
      gender
    });
  });
  if (!outline.length && rooms.length)
    outline.push(hull(rooms.flatMap((r) => r.ring)));

  // Doors: a swing arc's hinge, and the end of the arc that lies on a wall, mark the opening.
  const scale = Math.hypot(a.re, a.im);
  const near = (p: Point) =>
    Math.min(...rooms.map((r) => distToRing(p, r.ring)));
  const access = of('access').flatMap((e) =>
    e.type === 'INSERT' ? [T(e.at)] : []
  );
  const doors: Door[] = [];
  for (const e of of('door')) {
    if (
      e.type !== 'ARC' ||
      !rooms.length ||
      e.radius * scale < 1.5 ||
      e.radius * scale > 5
    )
      continue;
    const end = (deg: number) =>
      T({
        x: e.center.x + e.radius * Math.cos((deg * Math.PI) / 180),
        y: e.center.y + e.radius * Math.sin((deg * Math.PI) / 180)
      });
    const ends = [end(e.start), end(e.end)];
    const from = T(e.center);
    const to = near(ends[0]) <= near(ends[1]) ? ends[0] : ends[1];
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    const entrance = outline.some((r) => distToRing(mid, r) < 1);
    const accessible =
      entrance &&
      access.some((p) => dist(p, closestOnSegment(p, from, to)) < 10);
    doors.push({ from, to, entrance, accessible });
  }
  return {
    rooms,
    doors,
    outline,
    northUp: a.re !== 1 / drawing.unitsPerFoot || a.im !== 0
  };
}
