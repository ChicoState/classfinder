// Engineering preview from saved graph JSON and local vector source; no map tiles.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const toolsDirectory =
  process.env.CLASSFINDER_PDF_TOOLS ??
  '/home/eyebaian/.local/share/classfinder-pdf-tools';
const require = createRequire(join(toolsDirectory, 'package.json'));
const { createCanvas } = require('@napi-rs/canvas');
const data = JSON.parse(await readFile('src/data/outdoor/campus.json', 'utf8'));
const osm = JSON.parse(await readFile(data.metadata.source.path, 'utf8'));
const { origin, projection, reviewAreas, components } = data.metadata;
const project = ({ lat, lon }) => ({
  x:
    (lon - origin.longitude) *
    projection.radiansPerDegree *
    projection.eastRadiusMeters *
    projection.feetPerMeter,
  y:
    (lat - origin.latitude) *
    projection.radiansPerDegree *
    projection.northRadiusMeters *
    projection.feetPerMeter
});
const canvas = createCanvas(3300, 2500);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#f8fafc';
ctx.fillRect(0, 0, canvas.width, canvas.height);
function text(value, x, y, size = 22, color = '#172b43', weight = '') {
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}
text('CSU Chico · Outdoor walking graph', 60, 78, 52, '#102a43', 'bold');
text(
  `${data.nodes.length} nodes  /  ${data.edges.length} two-way edges  /  ${components.length} disconnected components  /  ${reviewAreas.length} review areas`,
  60,
  124,
  26
);
ctx.fillStyle = '#fff1c9';
ctx.fillRect(60, 150, 3180, 88);
text(
  'PROVISIONAL — ALL ROUTES: node-level gate, barrier, kerb and access tags are unavailable.',
  82,
  187,
  27,
  '#854d0e',
  'bold'
);
text(
  'Numbered areas flag additional local issues. No indoor connections or building alignment. General walking; stairs included.',
  82,
  220,
  24,
  '#854d0e'
);

const map = { x: 60, y: 270, width: 2150, height: 2050 };
const allPoints = [
  ...data.nodes.map((n) => n.position),
  ...reviewAreas.map((a) => a.position)
];
const minX = Math.min(...allPoints.map((p) => p.x)) - 90;
const maxX = Math.max(...allPoints.map((p) => p.x)) + 90;
const minY = Math.min(...allPoints.map((p) => p.y)) - 90;
const maxY = Math.max(...allPoints.map((p) => p.y)) + 90;
const scale = Math.min(map.width / (maxX - minX), map.height / (maxY - minY));
const offsetX = map.x + (map.width - (maxX - minX) * scale) / 2;
const offsetY = map.y + (map.height - (maxY - minY) * scale) / 2;
const pixel = (p) => ({
  x: offsetX + (p.x - minX) * scale,
  y: offsetY + (maxY - p.y) * scale
});
function line(points, color, width, dash = []) {
  if (points.length < 2) return;
  ctx.beginPath();
  points.forEach((p, i) => {
    const q = pixel(p);
    if (i) ctx.lineTo(q.x, q.y);
    else ctx.moveTo(q.x, q.y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.stroke();
  ctx.setLineDash([]);
}
ctx.save();
ctx.beginPath();
ctx.rect(map.x, map.y, map.width, map.height);
ctx.clip();
ctx.fillStyle = '#f4f3ee';
ctx.fillRect(map.x, map.y, map.width, map.height);
for (const way of osm.elements.filter((w) => w.geometry?.length > 1)) {
  const t = way.tags ?? {};
  if (t.building || t.landuse || t.leisure || t.natural) {
    const points = way.geometry.map(project);
    ctx.beginPath();
    points.forEach((p, i) => {
      const q = pixel(p);
      if (i) ctx.lineTo(q.x, q.y);
      else ctx.moveTo(q.x, q.y);
    });
    ctx.closePath();
    ctx.fillStyle = t.building ? '#ddd9d1' : '#e4ebdc';
    ctx.fill();
    ctx.strokeStyle = '#c2c6bf';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (t.waterway) line(way.geometry.map(project), '#9fc9df', 13);
  if (['service', 'residential', 'tertiary'].includes(t.highway))
    line(way.geometry.map(project), '#fff', 13);
}
const exclusions = new Map(
  data.metadata.excludedWays.map((w) => [w.osmWayId, w])
);
for (const way of osm.elements)
  if (exclusions.has(way.id))
    line(way.geometry.map(project), '#a3a9b0', 2, [6, 6]);
const nodes = new Map(data.nodes.map((n) => [n.id, n]));
const main = new Set(components[0].nodeIds);
for (const edge of data.edges)
  line(
    [nodes.get(edge.from).position, nodes.get(edge.to).position],
    edge.type === 'stairs'
      ? '#d65f10'
      : main.has(edge.from)
        ? '#087e9b'
        : '#9a4fc4',
    edge.type === 'stairs' ? 5 : 3.3
  );
for (const node of data.nodes) {
  const p = pixel(node.position);
  ctx.beginPath();
  ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = '#064d65';
  ctx.fill();
}
// Names use OSM footprints only. They do not locate or transform indoor nodes.
for (const way of osm.elements.filter((w) => w.tags?.building && w.tags.name)) {
  const pts = way.geometry.map(project);
  const q = pixel({
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length
  });
  const words = way.tags.name.split(' ');
  let label = '';
  const rows = [];
  for (const word of words) {
    if ((label + word).length > 19) {
      rows.push(label);
      label = '';
    }
    label += `${word} `;
  }
  rows.push(label);
  ctx.textAlign = 'center';
  rows.forEach((row, i) =>
    text(row.trim(), q.x, q.y + (i - (rows.length - 1) / 2) * 18, 17, '#5b625e')
  );
  ctx.textAlign = 'left';
}
const occupied = [];
for (const area of reviewAreas) {
  const target = pixel(area.position);
  let q = target;
  for (let ring = 0; ring < 8; ring++) {
    let found = false;
    for (let step = 0; step < 16; step++) {
      const angle = (step / 16) * Math.PI * 2;
      const candidate = {
        x: target.x + Math.cos(angle) * ring * 24,
        y: target.y + Math.sin(angle) * ring * 24
      };
      if (
        candidate.x < map.x + 30 ||
        candidate.x > map.x + map.width - 30 ||
        candidate.y < map.y + 30 ||
        candidate.y > map.y + map.height - 30
      )
        continue;
      if (
        occupied.every(
          (p) => Math.hypot(p.x - candidate.x, p.y - candidate.y) > 62
        )
      ) {
        q = candidate;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  occupied.push(q);
  ctx.beginPath();
  ctx.moveTo(target.x, target.y);
  ctx.lineTo(q.x, q.y);
  ctx.strokeStyle = '#a26800';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(target.x, target.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#a26800';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(q.x, q.y, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#ffdd81ee';
  ctx.fill();
  ctx.strokeStyle = '#926000';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  text(area.id, q.x, q.y + 7, 21, '#563800', 'bold');
  ctx.textAlign = 'left';
}
ctx.restore();
ctx.strokeStyle = '#cbd5df';
ctx.lineWidth = 2;
ctx.strokeRect(map.x, map.y, map.width, map.height);
// Scale bar is based on saved feet coordinates, not screenshot pixels.
const barX = map.x + 35;
const barY = map.y + map.height - 40;
ctx.strokeStyle = '#203b50';
ctx.lineWidth = 5;
ctx.beginPath();
ctx.moveTo(barX, barY);
ctx.lineTo(barX + 300 * scale, barY);
ctx.stroke();
text('300 ft · approximate horizontal distance', barX, barY - 15, 19);
text('N ↑', map.x + map.width - 90, map.y + 45, 28, '#203b50', 'bold');

const sideX = 2250;
text('MANUAL REVIEW', sideX, 305, 32, '#102a43', 'bold');
text('Match IDs to manual-review.md for source links.', sideX, 340, 22);
const descriptions = {
  disconnected: 'Disconnected section',
  indoor: 'Excluded indoor shortcut',
  'cycleway pedestrian permission unknown': 'Cycleway: confirm foot permission',
  'unpaved trail': 'Excluded unpaved route',
  'rough or informal trail': 'Excluded rough / informal trail',
  'unverified path': 'Unverified path',
  'stairs with ramp': 'Stairs / ramp ambiguity',
  'shared service road': 'Shared service road'
};
reviewAreas.forEach((area, i) => {
  const y = 385 + i * 43;
  const kinds = [...new Set(area.issues.map((issue) => issue.kind))];
  text(area.id, sideX, y, 23, '#926000', 'bold');
  const label = kinds.map((kind) => descriptions[kind]).join('; ');
  text(label.length > 69 ? `${label.slice(0, 66)}…` : label, sideX + 70, y, 21);
});
let legendY = 2040;
for (const [color, label] of [
  ['#087e9b', 'Main connected component'],
  ['#9a4fc4', 'Other components — no inferred joins'],
  ['#d65f10', 'Stairs — vertical rise omitted'],
  ['#a3a9b0', 'Excluded source ways (dashed)']
]) {
  ctx.fillStyle = color;
  ctx.fillRect(sideX, legendY - 15, 28, 7);
  text(label, sideX + 45, legendY, 23);
  legendY += 38;
}
text('Source snapshot: 2026-10-21', sideX, 2230, 23);
text('Buildings are OSM background footprints only.', sideX, 2270, 22);
text('No indoor geometry has been aligned or connected.', sideX, 2305, 22);
text(
  '© OpenStreetMap contributors · ODbL 1.0 · https://www.openstreetmap.org/copyright',
  60,
  2405,
  25
);
text(
  'Generated from saved src/data/outdoor/campus.json; source geometry is approximate and may omit current restrictions.',
  60,
  2450,
  23,
  '#5a6876'
);
await writeFile(
  'src/data/outdoor/campus-preview.png',
  await canvas.encode('png')
);
console.log('Wrote src/data/outdoor/campus-preview.png (3300 × 2500)');
