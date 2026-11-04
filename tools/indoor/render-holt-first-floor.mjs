// Requested review artifact from saved local graph and its original PDF.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const directory =
  process.env.CLASSFINDER_PDF_TOOLS ??
  '/home/eyebaian/.local/share/classfinder-pdf-tools';
const require = createRequire(join(directory, 'package.json'));
const { createCanvas } = require('@napi-rs/canvas');
const { getDocument } = await import(
  pathToFileURL(join(directory, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs'))
);
const floor = JSON.parse(await readFile('src/data/holt/floor-1.json', 'utf8'));
const m = floor.metadata,
  origin = m.origin.pdfPointFromTopLeft,
  factor = m.feetPerPdfPoint;
const pdf = await getDocument({
  data: new Uint8Array(await readFile(m.source)),
  useSystemFonts: true
}).promise;
const page = await pdf.getPage(1),
  view = page.getViewport({ scale: 3 });
const source = createCanvas(view.width, view.height);
await page.render({ canvasContext: source.getContext('2d'), viewport: view })
  .promise;
const canvas = createCanvas(3000, 2650),
  c = canvas.getContext('2d');
const nodes = new Map(floor.nodes.map((n) => [n.id, n]));
const restored = new Set(
  m.stairRoomPassages.restoredNodes.map((n) => n.nodeId)
);
const adjacency = new Map(floor.nodes.map((n) => [n.id, []]));
for (const e of floor.edges) {
  adjacency.get(e.from).push(e.to);
  adjacency.get(e.to).push(e.from);
}
const reached = new Set([m.origin.nodeId]);
for (const id of reached)
  for (const next of adjacency.get(id)) reached.add(next);
const position = (n) => ({
  x: origin.x + n.position.x / factor,
  y: origin.y - n.position.y / factor
});
const text = (value, x, y, size = 24, color = '#172b3b') => {
  c.font = `${size}px sans-serif`;
  c.fillStyle = color;
  c.fillText(value, x, y);
};
c.fillStyle = 'white';
c.fillRect(0, 0, canvas.width, canvas.height);
text('Holt Hall · First floor graph review', 40, 55, 42);
text(
  `${floor.nodes.length} nodes · ${floor.edges.length} undirected edges · ${reached.size}/${floor.nodes.length} reachable indoors from the south AO entrance`,
  40,
  100,
  25
);
function drawPanel(x, y, w, h, bounds, labels = false) {
  const s = Math.min(w / bounds.w, h / bounds.h),
    px = (q) => ({ x: x + (q.x - bounds.x) * s, y: y + (q.y - bounds.y) * s });
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.drawImage(
    source,
    bounds.x * 3,
    bounds.y * 3,
    bounds.w * 3,
    bounds.h * 3,
    x,
    y,
    bounds.w * s,
    bounds.h * s
  );
  for (const e of floor.edges) {
    const a = px(position(nodes.get(e.from))),
      b = px(position(nodes.get(e.to)));
    const changed = restored.has(e.from) || restored.has(e.to);
    c.strokeStyle = changed ? '#c1248b' : '#1685b4';
    c.lineWidth = changed ? 3.5 : 1.5;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
  }
  for (const n of floor.nodes) {
    const p = px(position(n)),
      changed = restored.has(n.id);
    c.fillStyle = changed ? '#ed7217' : '#08709c';
    c.beginPath();
    c.arc(p.x, p.y, changed ? 4.7 : 2.8, 0, Math.PI * 2);
    c.fill();
    if (labels && changed) {
      let label = n.id
        .replace('holt-1-', '')
        .replace('stairs-middle-north-west-door-', 'west door ')
        .replace('stairs-middle-south-west-door-', 'west door ')
        .replace('stairs-middle-north-east', 'east approach')
        .replace('stairs-middle-south-east', 'east approach')
        .replace('hall-stair-room-north-west', 'junction')
        .replace('hall-stair-room-south-west', 'junction')
        .replace('stairs-north-east-', '');
      text(label, p.x + 7, p.y - 7, 17, '#962565');
    }
  }
  const former = px(position(nodes.get('holt-1-south-bridge-east')));
  c.strokeStyle = '#c93824';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(former.x, former.y, 9, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}
drawPanel(30, 140, 1836, 2376, { x: 0, y: 0, w: 612, h: 792 });
for (const [label, q] of [
  ['H1', { x: 307, y: 260 }],
  ['H2', { x: 334, y: 477 }],
  ['H3', { x: 340, y: 234 }]
]) {
  const y = 140 + q.y * 3;
  c.strokeStyle = '#a62b77';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(30 + q.x * 3 + 12, y);
  c.lineTo(1760, y);
  c.stroke();
  text(label, 1770, y + 7, 25, '#a62b77');
}
let y = 180;
for (const [label, title, bounds] of [
  [
    'H1',
    'North connector: restored level passage',
    { x: 245, y: 244, w: 115, h: 35 }
  ],
  [
    'H2',
    'South connector: former isolated exit landing',
    { x: 245, y: 458, w: 115, h: 41 }
  ],
  ['H3', 'Northeast stair approaches', { x: 324, y: 214, w: 42, h: 38 }]
]) {
  text(`${label}  ${title}`, 1940, y, 25, '#92216b');
  drawPanel(1940, y + 25, 1000, 420, bounds, true);
  y += 510;
}
text('Blue: existing nodes / edges', 1940, 1830, 25, '#08709c');
text(
  'Orange nodes / magenta links: restored passages',
  1940,
  1875,
  25,
  '#a62b77'
);
text(
  'Red ring: southeast landing formerly disconnected',
  1940,
  1920,
  25,
  '#c93824'
);
text('All nodes now form one first-floor component.', 1940, 1990, 26);
text('H2 joins the former two-node exit component.', 1940, 2030, 24);
text('Level passage walkability was user-confirmed.', 1940, 2090, 24);
text('Centerlines are approximate; accessibility is unknown.', 1940, 2130, 23);
text('Native PDF coordinates; local feet; origin (355, 682).', 1940, 2190, 23);
text('Source: Holt/holt-1.pdf · 2011-02-17 · 1 inch = 40 feet', 1940, 2230, 22);
text('No outdoor or upper-floor edges shown.', 1940, 2290, 23);
text('2026-10-28 · Generated from final saved JSON', 1940, 2370, 23);
const target = 'src/data/holt/floor-1-preview.png';
await writeFile(target, canvas.toBuffer('image/png'));
console.log(
  `${target}: ${floor.nodes.length} nodes, ${floor.edges.length} edges; ${reached.size} reachable.`
);
