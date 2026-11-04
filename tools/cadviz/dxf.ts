/**
 * Minimal ASCII DXF reader: the HEADER units and the model-space entities that cadviz uses.
 * Entities on layers the caller rejects are discarded as soon as their layer is known, so
 * restricted content (telecom, electrical, title blocks, ...) is never kept.
 */

export type Point = { x: number; y: number };

export type Entity =
  | { type: 'LWPOLYLINE' | 'LEADER'; layer: string; points: Point[] }
  | {
      type: 'TEXT' | 'MTEXT' | 'ATTRIB';
      layer: string;
      at: Point;
      text: string;
    }
  | {
      type: 'ARC';
      layer: string;
      center: Point;
      radius: number;
      start: number;
      end: number;
    }
  | { type: 'INSERT'; layer: string; at: Point };

export type Drawing = { unitsPerFoot: number; entities: Entity[] };

const UNITS_PER_FOOT: Record<number, number> = {
  1: 12,
  2: 1,
  4: 304.8,
  5: 30.48,
  6: 0.3048
};
const KEPT = new Set([
  'LWPOLYLINE',
  'LEADER',
  'TEXT',
  'MTEXT',
  'ATTRIB',
  'ARC',
  'INSERT'
]);

/** Plain text from MTEXT markup: paragraphs become new lines; fonts, colours and braces are dropped. */
export function plainText(raw: string): string {
  return raw
    .replace(/\\P/g, '\n')
    .replace(/\\[ACcFfHhpQTW][^;]*;/g, '')
    .replace(/\\[LlOoKk]/g, '')
    .replace(/\\~/g, ' ')
    .replace(/%%[uUoO]/g, '')
    .replace(/[{}]/g, '')
    .trim();
}

/**
 * Reads a DXF file's text. keepLayer(layer) decides which entities are kept; INSERT attributes on
 * layer "0" take the layer of their block reference, like the drawing shows them.
 */
export function readDxf(
  text: string,
  keepLayer: (layer: string) => boolean
): Drawing {
  const lines = text.split(/\r?\n/);
  const pairs: Array<[number, string]> = [];
  for (let i = 0; i + 1 < lines.length; i += 2)
    pairs.push([Number(lines[i]), lines[i + 1].trim()]);

  let unitsPerFoot = 12;
  const units = pairs.findIndex(([c, v]) => c === 9 && v === '$INSUNITS');
  if (units >= 0)
    unitsPerFoot = UNITS_PER_FOOT[Number(pairs[units + 1]?.[1])] ?? 12;

  const start = pairs.findIndex(
    ([c, v], i) =>
      c === 2 && v === 'ENTITIES' && pairs[i - 1]?.[1] === 'SECTION'
  );
  const entities: Entity[] = [];
  if (start < 0) return { unitsPerFoot, entities };

  let insertLayer = '';
  for (let i = start + 1; i < pairs.length && pairs[i][1] !== 'ENDSEC'; ) {
    const type = pairs[i][1];
    const group: Array<[number, string]> = [];
    for (i++; i < pairs.length && pairs[i][0] !== 0; i++) group.push(pairs[i]);
    if (!KEPT.has(type)) continue;
    let layer = group.find(([c]) => c === 8)?.[1] ?? '0';
    if (type === 'INSERT') insertLayer = layer;
    if (type === 'ATTRIB' && layer === '0') layer = insertLayer;
    if (!keepLayer(layer)) continue; // dropped unread
    const entity = toEntity(type, layer, group);
    if (entity) entities.push(entity);
  }
  return { unitsPerFoot, entities };
}

function toEntity(
  type: string,
  layer: string,
  group: Array<[number, string]>
): Entity | null {
  const num = (code: number) =>
    Number(group.find(([c]) => c === code)?.[1] ?? 0);
  const at = { x: num(10), y: num(20) };
  switch (type) {
    case 'LWPOLYLINE':
    case 'LEADER': {
      const xs = group.filter(([c]) => c === 10).map(([, v]) => Number(v));
      const ys = group.filter(([c]) => c === 20).map(([, v]) => Number(v));
      return { type, layer, points: xs.map((x, k) => ({ x, y: ys[k] ?? 0 })) };
    }
    case 'TEXT':
    case 'ATTRIB':
      return {
        type,
        layer,
        at,
        text: (group.find(([c]) => c === 1)?.[1] ?? '').trim()
      };
    case 'MTEXT': {
      const raw = group
        .filter(([c]) => c === 3 || c === 1)
        .map(([, v]) => v)
        .join('');
      return { type, layer, at, text: plainText(raw) };
    }
    case 'ARC': {
      // Arcs drawn with a flipped extrusion (0, 0, -1) are mirrored in x.
      const flip = num(230) < 0;
      const center = { x: flip ? -at.x : at.x, y: at.y };
      const [s, e] = flip ? [180 - num(51), 180 - num(50)] : [num(50), num(51)];
      return { type, layer, center, radius: num(40), start: s, end: e };
    }
    default:
      return { type: 'INSERT', layer, at };
  }
}
