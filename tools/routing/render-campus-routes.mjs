// Offline review artifact: uses the production loader and Dijkstra through Vite SSR.
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fit } from '../outdoor/similarity.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const endpoints = await readJson('tools/routing/campus-endpoints.json');
const registration = await readJson('tools/routing/map-registration.json');
const alignment = await readJson('src/graph/campusAlignment.json');
const osm = await readJson('campus-osm.json');
const reviews = (await readJson('src/data/outdoor/entrance-connections.json'))
  .metadata.reviewAreas;
const require = createRequire(
  `${process.env.CLASSFINDER_PDF_TOOLS ?? '/home/eyebaian/.local/share/classfinder-pdf-tools'}/package.json`
);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const mapImage = await loadImage(registration.image);
const frame = alignment.globalFrame;
const p = frame.outdoorProjection;
const osmPoints = new Map(
  osm.elements.flatMap((w) =>
    (w.nodes ?? []).map((id, i) => [id, w.geometry[i]])
  )
);
const transform = fit(
  registration.anchors.map((anchor) => {
    const geo = osmPoints.get(anchor.osmNodeId);
    if (!geo)
      throw new Error(`Missing registration landmark ${anchor.osmNodeId}`);
    return {
      localPosition: {
        x:
          (geo.lon - frame.longitude) *
          p.radiansPerDegree *
          p.eastRadiusMeters *
          p.feetPerMeter,
        y:
          -(geo.lat - frame.latitude) *
          p.radiansPerDegree *
          p.northRadiusMeters *
          p.feetPerMeter
      },
      globalPosition: anchor.pixel
    };
  }),
  registration.method
);
if (transform.maxResidualFeet > 6)
  throw new Error('Screenshot registration exceeds six pixels');
const pixel = (position) => ({
  x: transform.a * position.x + transform.b * position.y + transform.tx,
  y: transform.b * position.x - transform.a * position.y + transform.ty + 90
});
const key = (a, b) => [a, b].sort().join('|');
const out = 'artifacts/campus-routes';
await mkdir(out, { recursive: true });
const colors = [
  '#d62728',
  '#0072b2',
  '#008544',
  '#af4bb5',
  '#d56a00',
  '#00a3a3',
  '#803300',
  '#6253cc',
  '#cb0078',
  '#567600',
  '#333333'
];
const names = {
  acker: 'Acker Gymnasium',
  ayres: 'Ayres Hall',
  butte: 'Butte Hall',
  glenn: 'Glenn Hall',
  holt: 'Holt Hall',
  lang: 'Langdon Hall',
  modoc: 'Modoc Hall',
  ocon: 'O’Connell',
  plumas: 'Plumas Hall',
  tehama: 'Tehama Hall',
  trinity: 'Trinity Hall',
  yolo: 'Yolo Hall'
};
const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom'
});
try {
  const { loadGraphFromData } = await vite.ssrLoadModule(
    '/src/graph/graphLoader.ts'
  );
  const { calculatePath } = await vite.ssrLoadModule('/src/lib/dijkstras.ts');
  const [graph, nodes] = loadGraphFromData();
  const buildings = Object.keys(endpoints);
  const loadedBuildings = [
    ...new Set([...nodes.values()].map((n) => n.buildingId))
  ]
    .filter((id) => id !== 'outside')
    .sort();
  if (JSON.stringify(buildings.toSorted()) !== JSON.stringify(loadedBuildings))
    throw new Error('Endpoint inventory differs from loaded buildings');
  const routes = [];
  for (const from of buildings) {
    for (const to of buildings.filter((id) => id !== from)) {
      const start = nodes.get(endpoints[from]);
      const goal = nodes.get(endpoints[to]);
      if (start?.buildingId !== from || goal?.buildingId !== to)
        throw new Error('Invalid indoor endpoint');
      const path = calculatePath(graph, start, goal);
      if (!path?.length) throw new Error(`Missing route ${from} → ${to}`);
      let current = start.id;
      for (const { from: edgeFrom, ...edge } of path) {
        if (
          edgeFrom !== current ||
          !graph
            .get(current)
            .some((e) => JSON.stringify(e) === JSON.stringify(edge))
        )
          throw new Error('Invalid traversal');
        current = edge.to;
      }
      if (
        current !== goal.id ||
        !path.some((e) => nodes.get(e.to).buildingId === 'outside')
      )
        throw new Error('Route does not traverse campus');
      routes.push({
        from,
        to,
        start: start.id,
        goal: goal.id,
        distanceFeet: path.reduce((s, e) => s + e.distance, 0),
        weightedCost: path.reduce((s, e) => s + e.distance * e.weight, 0),
        path
      });
    }
  }
  for (const from of buildings) {
    const outgoing = routes.filter((r) => r.from === from);
    const canvas = createCanvas(mapImage.width + 480, mapImage.height + 90);
    const c = canvas.getContext('2d');
    c.fillStyle = 'white';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.drawImage(mapImage, 0, 90);
    const text = (value, x, y, size = 18, color = '#18232e') => {
      c.font = `${size}px sans-serif`;
      c.fillStyle = color;
      c.fillText(value, x, y);
    };
    text(`${names[from]} → every other building`, 25, 35, 28);
    text(
      '11 production Dijkstra routes · global campus feet · numbered circles identify inferred entrance approaches',
      25,
      67,
      16
    );
    // Give routes sharing an edge separate narrow display lanes, so none is hidden.
    const lanes = new Map();
    outgoing.forEach((route, index) =>
      route.path.forEach((e) => {
        const k = key(e.from, e.to);
        if (!lanes.has(k)) lanes.set(k, []);
        lanes.get(k).push(index);
      })
    );
    const union = new Set(lanes.keys());
    for (const [index, route] of outgoing.entries()) {
      c.beginPath();
      route.path.forEach((e, j) => {
        let a = pixel(nodes.get(e.from).position),
          b = pixel(nodes.get(e.to).position);
        const shared = lanes.get(key(e.from, e.to));
        const offset = (shared.indexOf(index) - (shared.length - 1) / 2) * 2.6;
        const dx = b.x - a.x,
          dy = b.y - a.y,
          length = Math.hypot(dx, dy);
        if (length) {
          const sign = e.from < e.to ? 1 : -1;
          const ox = (-dy / length) * offset * sign,
            oy = (dx / length) * offset * sign;
          a = { x: a.x + ox, y: a.y + oy };
          b = { x: b.x + ox, y: b.y + oy };
        }
        if (j === 0) c.moveTo(a.x, a.y);
        else c.lineTo(a.x, a.y);
        c.lineTo(b.x, b.y);
      });
      c.lineWidth = 2.2;
      c.strokeStyle = colors[index];
      c.lineJoin = 'round';
      c.lineCap = 'round';
      c.stroke();
      const goal = pixel(nodes.get(route.goal).position);
      c.fillStyle = colors[index];
      c.beginPath();
      c.arc(goal.x, goal.y, 12, 0, 2 * Math.PI);
      c.fill();
      text(String(index + 1), goal.x - 5, goal.y + 5, 14, 'white');
      const x = mapImage.width + 20,
        y = 135 + index * 65;
      text(`${index + 1}. ${names[route.to]}`, x, y, 21, colors[index]);
      text(
        `${route.distanceFeet.toFixed(1)} ft · ${route.path.length} edges`,
        x + 25,
        y + 25,
        16
      );
    }
    const start = pixel(nodes.get(endpoints[from]).position);
    c.beginPath();
    c.arc(start.x, start.y, 14, 0, 2 * Math.PI);
    c.fillStyle = 'white';
    c.fill();
    c.strokeStyle = '#111';
    c.lineWidth = 3;
    c.stroke();
    text('S', start.x - 6, start.y + 6, 18);
    const usedReviews = reviews.filter((r) =>
      r.edgeIds.some(([a, b]) => union.has(key(a, b)))
    );
    text('INFERRED APPROACHES', mapImage.width + 20, 900, 20);
    usedReviews.forEach((r, i) => {
      const pt = pixel(r.location);
      c.beginPath();
      c.arc(pt.x, pt.y, 7, 0, 2 * Math.PI);
      c.fillStyle = '#fff4c2';
      c.fill();
      c.strokeStyle = '#825500';
      c.lineWidth = 1;
      c.stroke();
      text(String(i + 1), pt.x - 3, pt.y + 3, 9, '#825500');
      text(
        `${i + 1}: ${r.id}`,
        mapImage.width + 20,
        925 + i * 19,
        13,
        '#825500'
      );
    });
    text('S = starting indoor endpoint', mapImage.width + 20, 1325, 17);
    text(
      'Shared routes use offset display lanes.',
      mapImage.width + 20,
      1355,
      17
    );
    text('Geometry/access remain provisional.', mapImage.width + 20, 1385, 17);
    text(
      `Map fit max residual: ${transform.maxResidualFeet.toFixed(2)} px`,
      mapImage.width + 20,
      1415,
      17
    );
    text('Map © OpenStreetMap contributors', mapImage.width + 20, 1455, 17);
    text('openstreetmap.org/copyright · ODbL', mapImage.width + 20, 1480, 16);
    await writeFile(`${out}/${from}-to-all.png`, await canvas.encode('png'));
  }
  const report = {
    loadedNodes: nodes.size,
    directedEdges: [...graph.values()].reduce((s, e) => s + e.length, 0),
    buildings,
    endpoints,
    orderedPairs: routes.length,
    registration: { ...registration, fit: transform },
    routes
  };
  await writeFile(`${out}/routes.json`, JSON.stringify(report, null, 2) + '\n');
  const rows = buildings
    .map(
      (from) =>
        `<tr><th>${names[from]}</th>${buildings.map((to) => `<td>${from === to ? '—' : routes.find((r) => r.from === from && r.to === to).distanceFeet.toFixed(1)}</td>`).join('')}</tr>`
    )
    .join('');
  await writeFile(
    `${out}/index.html`,
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>Campus route verification</title><style>body{font:16px system-ui;margin:30px;color:#18232e}img{max-width:100%}table{border-collapse:collapse}td,th{padding:8px;border:1px solid #ccc}a{color:#0072b2}</style><h1>All 132 directed building pairs connected</h1><p>12 fixed indoor endpoints; actual production loader and Dijkstra. ${nodes.size} loaded nodes. Distances in feet. This verifies graph connectivity between these endpoints, not every room or current physical access. Source entrance geometry is provisional. Shared route lines use slight offsets for visibility.</p><p><a href="routes.json">Complete edge-by-edge route evidence and image registration</a></p><table><tr><th>From / to</th>${buildings.map((b) => `<th>${b}</th>`).join('')}</tr>${rows}</table>${buildings.map((b) => `<h2>${names[b]} → all others</h2><p>Start: ${endpoints[b]}</p><a href="${b}-to-all.png"><img loading="lazy" src="${b}-to-all.png" alt="Eleven routes from ${names[b]}, each in a different color"></a>`).join('')}</html>`
  );
  console.log(
    JSON.stringify({
      orderedPairs: routes.length,
      images: buildings.length,
      loadedNodes: nodes.size,
      mapFitMaxResidualPixels: transform.maxResidualFeet,
      output: out
    })
  );
} finally {
  await vite.close();
}
