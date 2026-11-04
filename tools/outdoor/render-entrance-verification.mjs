// Temporary verification only: labels every inferred approach by its review ID.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(
  `${process.env.CLASSFINDER_PDF_TOOLS ?? '/home/eyebaian/.local/share/classfinder-pdf-tools'}/package.json`
);
const { createCanvas } = require('@napi-rs/canvas');
const a = JSON.parse(fs.readFileSync('src/graph/campusAlignment.json')),
  osm = JSON.parse(fs.readFileSync('campus-osm.json')),
  links = JSON.parse(
    fs.readFileSync('src/data/outdoor/entrance-connections.json')
  ),
  campus = JSON.parse(fs.readFileSync('src/data/outdoor/campus.json'));
osm.elements.push(
  ...JSON.parse(fs.readFileSync('tools/outdoor/remaining-footprints-osm.json'))
    .elements.filter((w) => w.type === 'way')
    .map((w) => ({ ...w, tags: { building: 'university' } }))
);
const { latitude, longitude, outdoorProjection: p } = a.globalFrame;
const project = (g) => ({
  x:
    (g.lon - longitude) *
    p.radiansPerDegree *
    p.eastRadiusMeters *
    p.feetPerMeter,
  y:
    (g.lat - latitude) *
    p.radiansPerDegree *
    p.northRadiusMeters *
    p.feetPerMeter
});
for (const id of new Set(
  links.metadata.connections.map((c) => c.indoorNodeId.split('-')[0])
)) {
  const f = JSON.parse(fs.readFileSync(`src/data/${id}/floor-1.json`)),
    t = a.buildings[id];
  const nodes = new Map(
    [
      ...campus.nodes,
      ...links.nodes,
      ...f.nodes.map((n) => ({
        ...n,
        position: {
          x: t.a * n.position.x - t.b * n.position.y + t.tx,
          y: t.b * n.position.x + t.a * n.position.y + t.ty
        }
      }))
    ].map((n) => [n.id, n])
  );
  const reviews = links.metadata.reviewAreas.filter((r) =>
    r.id.startsWith(`ENT-${id.toUpperCase()}`)
  );
  let focus = reviews.flatMap((r) =>
    r.nodeIds.map((id) => nodes.get(id).position)
  );
  const xmin = Math.min(...focus.map((p) => p.x)) - 40,
    xmax = Math.max(...focus.map((p) => p.x)) + 40,
    ymin = Math.min(...focus.map((p) => p.y)) - 40,
    ymax = Math.max(...focus.map((p) => p.y)) + 40;
  const scale = Math.min(1400 / (xmax - xmin), 1300 / (ymax - ymin));
  const canvas = createCanvas(1500, 1450),
    c = canvas.getContext('2d');
  c.fillStyle = 'white';
  c.fillRect(0, 0, 1500, 1450);
  const pixel = (p) => [50 + (p.x - xmin) * scale, 100 + (ymax - p.y) * scale];
  const draw = (points, color, width) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    points.forEach((q, i) => c[i ? 'lineTo' : 'moveTo'](...pixel(q)));
    c.stroke();
  };
  for (const w of osm.elements.filter((w) => w.tags?.building && w.geometry))
    draw(w.geometry.map(project), '#aaa', 1);
  const override = links.metadata.obstacleOverrides[id];
  if (override) {
    const origin =
      f.metadata.origin.pdfPoint ?? f.metadata.origin.pdfPointFromTopLeft;
    const ox = origin.x ?? origin[0],
      oy = origin.y ?? origin[1];
    const factor =
      f.metadata.feetPerPdfPoint ?? f.metadata.scale.feetPerPdfPoint;
    for (const polygon of override.referencePdfPolygons) {
      const points = polygon.map(([x, y]) => {
        const local = { x: (x - ox) * factor, y: (oy - y) * factor };
        return {
          x: t.a * local.x - t.b * local.y + t.tx,
          y: t.b * local.x + t.a * local.y + t.ty
        };
      });
      draw([...points, points[0]], '#9248b0', 2);
    }
    c.fillStyle = '#9248b0';
    c.font = '17px sans-serif';
    c.fillText(
      'Purple: source-derived obstacle correction; see labeled ENT review areas.',
      30,
      70
    );
  }
  for (const line of links.metadata.sourceBarriers?.[id]?.lines ?? []) {
    draw(
      line.map((q) => ({
        x: t.a * q.x - t.b * q.y + t.tx,
        y: t.b * q.x + t.a * q.y + t.ty
      })),
      '#bb2070',
      3
    );
  }
  for (const e of campus.edges)
    draw([nodes.get(e.from).position, nodes.get(e.to).position], '#bbb', 1);
  for (const e of f.edges)
    draw([nodes.get(e.from).position, nodes.get(e.to).position], '#388', 1);
  for (const r of reviews) {
    for (const [from, to] of r.edgeIds)
      draw([nodes.get(from).position, nodes.get(to).position], '#e70', 3);
    let [x, y] = pixel(r.location);
    c.fillStyle = '#b30';
    c.font = 'bold 14px sans-serif';
    c.fillText(r.id, x + 3, y - 3);
  }
  c.fillStyle = 'black';
  c.font = '24px sans-serif';
  c.fillText(
    `${id}: inferred entrance approaches (orange), OSM footprints (gray)`,
    30,
    40
  );
  fs.writeFileSync(
    `/tmp/${id}-entrance-review.png`,
    canvas.toBuffer('image/png')
  );
}
