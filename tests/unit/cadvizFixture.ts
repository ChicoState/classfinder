/**
 * A synthetic two-floor building drawn to the Facilities layer standard (inches), written as plain
 * DXF text. Tests never use real CAD drawings.
 */
const ROT = (29.13 * Math.PI) / 180;
const WORLD0 = { x: 6_500_123.45, y: 2_001_234.56 };

// number, type, x0, x1, side ("N" above the corridor, "S" below), door hinge x
const ROOMS: Array<[string, string, number, number, 'N' | 'S', number | null]> =
  [
    ['01', '110', 0, 288, 'N', 100],
    ['02', '110', 294, 582, 'N', 400],
    ['03', 'X03', 588, 738, 'N', 620],
    ['0B', 'W08', 744, 924, 'N', 780],
    ['92', 'W02', 930, 1020, 'N', 950],
    ['04', '310', 0, 288, 'S', 100],
    ['04A', '310', 294, 444, 'S', null],
    ['05', 'Y04', 450, 600, 'S', 500],
    ['06', '650', 606, 1200, 'S', 800]
  ];

const entity = (
  type: string,
  layer: string,
  codes: Array<[number, string | number]>
) => [0, type, 8, layer, ...codes.flat()].join('\n');

const rect = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  layer = 'A-AREA'
) =>
  entity('LWPOLYLINE', layer, [
    [90, 4],
    [70, 1],
    ...[
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1]
    ].flatMap(
      ([x, y]): Array<[number, number]> => [
        [10, x],
        [20, y]
      ]
    )
  ]);

const text = (layer: string, x: number, y: number, value: string) =>
  entity('TEXT', layer, [
    [10, x],
    [20, y],
    [40, 8],
    [1, value]
  ]);

const arc = (x: number, y: number, start: number, end: number) =>
  entity('ARC', 'A-DOOR', [
    [10, x],
    [20, y],
    [40, 36],
    [50, start],
    [51, end]
  ]);

const insert = (layer: string, name: string, x: number, y: number) =>
  entity('INSERT', layer, [
    [2, name],
    [10, x],
    [20, y]
  ]);

const money = (v: number) =>
  v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

/** DXF text for floor 1 or 2 (floor 2 is drawn 5000 in to the right, like the real files). */
export function testFloor(floor: number, withOutline = true): string {
  const ox = 5000 * (floor - 1);
  const out: string[] = [
    rect(ox, 0, ox + 1200, 96),
    text('A-AREA-IDEN', ox + 600, 58, `${floor}00`)
  ];
  out.push(text('A-AREA-TYPE', ox + 600, 38, 'W06'));
  for (const [num, type, x0, x1, side, door] of ROOMS) {
    const [y0, y1] = side === 'N' ? [102, 342] : [-246, -6];
    out.push(rect(ox + x0, y0, ox + x1, y1));
    out.push(
      text(
        'A-AREA-IDEN',
        ox + (x0 + x1) / 2,
        (y0 + y1) / 2 + 10,
        `${floor}${num}`
      )
    );
    out.push(text('A-AREA-TYPE', ox + (x0 + x1) / 2, (y0 + y1) / 2 - 10, type));
    if (door !== null) {
      out.push(
        side === 'N' ? arc(ox + door, 99, 0, 90) : arc(ox + door, -3, 270, 360)
      );
    }
  }
  out.push(arc(ox + 291, -200, 90, 180)); // 04 -> 04A
  if (withOutline) {
    out.push(rect(ox - 6, -252, ox + 1206, 348)); // [BG] building outline
    out.push(text('A-AREA-TYPE', ox - 3, 345, '[BG]'));
  }
  if (floor === 1) {
    // Two exterior entrances; the west one is marked accessible.
    out.push(arc(ox - 3, 30, 0, 90), arc(ox + 1203, 30, 90, 180));
    out.push(insert('A-ANNO-ACCS', 'ACCS', ox - 30, 48));
  }
  out.push(text('A-FLOR-ANNO', ox + 663, 250, 'WOMEN'));
  out.push(insert('A-FLOR-PFIX', 'DF-1', ox + 600, 88));
  out.push(text('T-DATA', ox + 50, 50, 'SECRET')); // restricted: must never be read
  out.push(rect(ox + 10, 10, ox + 40, 40, 'E-POWR')); // restricted outline
  out.push(text('A-ANNO-TTLB', ox, -400, 'DRAWN BY: J. DOE'));
  out.push(text('A-AREA-IDEN', ox, -500, '999')); // stray label outside every room
  out.push(
    entity('MTEXT', 'A-CTRL', [
      [10, ox],
      [20, 400],
      [3, '{\\fArial|b1;Building ID: 999\\P'],
      [1, `Floor Code: ${floor}}`]
    ])
  );
  for (const x of [0, 1200]) {
    const w = {
      x: WORLD0.x + (Math.cos(ROT) * x) / 12,
      y: WORLD0.y + (Math.sin(ROT) * x) / 12
    };
    out.push(
      text('A-CTRL', ox + x + 5, 5, `SURVEY: ${money(w.x)},${money(w.y)}`)
    );
  }
  return [
    '0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n1\n0\nENDSEC',
    '0\nSECTION\n2\nENTITIES',
    ...out,
    '0\nENDSEC\n0\nEOF\n'
  ].join('\n');
}
