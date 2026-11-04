// Uses the real Vite-loaded graph and Dijkstra; rendering never assembles a second graph.
import { createServer } from 'vite';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const require = createRequire(
  join(
    process.env.CLASSFINDER_PDF_TOOLS ??
      '/home/eyebaian/.local/share/classfinder-pdf-tools',
    'package.json'
  )
);
const { createCanvas } = require('@napi-rs/canvas');
const alignment = JSON.parse(
  await readFile('src/graph/campusAlignment.json', 'utf8')
);
const connections = JSON.parse(
  await readFile('src/data/outdoor/building-connections.json', 'utf8')
);
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
  const start = nodes.get('ocon-1-room-124');
  const goal = nodes.get('lang-1-room-120');
  const path = calculatePath(graph, start, goal);
  const reverse = calculatePath(graph, goal, start);
  if (!path || !reverse)
    throw new Error('Required building-to-building Dijkstra route is missing.');
  const distance = path.reduce((sum, edge) => sum + edge.distance, 0);
  const pathIds = new Set([start.id, ...path.map((edge) => edge.to)]);
  const routePairs = new Set(
    path.map((edge) => [edge.from, edge.to].sort().join('|'))
  );
  const colors = {
    ocon: '#2b67bc',
    lang: '#0c876e',
    outside: '#8b969f',
    link: '#d66a12',
    route: '#bc2878'
  };
  const canvas = createCanvas(2600, 2250);
  const ctx = canvas.getContext('2d');
  function text(value, x, y, size = 24, color = '#24374b', weight = '') {
    ctx.font = `${weight} ${size}px sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  text(
    'O’Connell ↔ Langdon · Loaded global graph',
    60,
    72,
    47,
    '#142b43',
    'bold'
  );
  text(
    'Ground-floor graph only · global campus feet · X east / Y north · no background map or floor-plan image',
    60,
    117,
    25
  );
  text(
    `Dijkstra: O’Connell room 124 → Langdon room 120 · ${distance.toFixed(1)} ft · ${path.length} edges · reverse route verified`,
    60,
    159,
    26,
    colors.route,
    'bold'
  );
  text(
    'Global (0, 0): OSM node 4715296203 at 39.7276776, −121.8456054 (outside this crop). Holt omitted.',
    60,
    199,
    23
  );
  const floorNodes = [...nodes.values()].filter(
    (n) => ['ocon', 'lang'].includes(n.buildingId) && n.floorId === 1
  );
  const focus = [...floorNodes, ...[...pathIds].map((id) => nodes.get(id))];
  const minX = Math.min(...focus.map((n) => n.position.x)) - 30;
  const maxX = Math.max(...focus.map((n) => n.position.x)) + 30;
  const minY = Math.min(...focus.map((n) => n.position.y)) - 30;
  const maxY = Math.max(...focus.map((n) => n.position.y)) + 30;
  const view = { x: 90, y: 280, width: 2420, height: 1560 };
  const scale = Math.min(
    view.width / (maxX - minX),
    view.height / (maxY - minY)
  );
  const ox = view.x + (view.width - (maxX - minX) * scale) / 2;
  const oy = view.y + (view.height - (maxY - minY) * scale) / 2;
  const pixel = (p) => ({
    x: ox + (p.x - minX) * scale,
    y: oy + (maxY - p.y) * scale
  });
  const isRelevant = (n) =>
    floorNodes.includes(n) ||
    (n.buildingId === 'outside' &&
      n.position.x >= minX &&
      n.position.x <= maxX &&
      n.position.y >= minY &&
      n.position.y <= maxY);
  const relevant = new Map([...nodes].filter(([, n]) => isRelevant(n)));
  const seen = new Set();
  const lines = [];
  for (const [from, edges] of graph)
    for (const edge of edges) {
      const key = [from, edge.to].sort().join('|');
      if (seen.has(key) || !relevant.has(from) || !relevant.has(edge.to))
        continue;
      seen.add(key);
      const a = nodes.get(from);
      const b = nodes.get(edge.to);
      const isLink = a.buildingId !== b.buildingId;
      lines.push({ a, b, edge, isLink, isRoute: routePairs.has(key) });
    }
  function drawLine(a, b, color, width) {
    const p = pixel(a.position);
    const q = pixel(b.position);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  for (let x = Math.ceil(minX / 50) * 50; x <= maxX; x += 50) {
    const p = pixel({ x, y: minY });
    const q = pixel({ x, y: maxY });
    ctx.strokeStyle = '#edf1f5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
    text(`${x} ft E`, p.x - 22, oy + (maxY - minY) * scale + 31, 17, '#788591');
  }
  for (let y = Math.ceil(minY / 50) * 50; y <= maxY; y += 50) {
    const p = pixel({ x: minX, y });
    const q = pixel({ x: maxX, y });
    ctx.strokeStyle = '#edf1f5';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
    text(`${y} ft N`, 8, p.y + 4, 16, '#788591');
  }
  lines.sort((a, b) => Number(a.isRoute) - Number(b.isRoute));
  for (const line of lines)
    drawLine(
      line.a,
      line.b,
      line.isRoute
        ? colors.route
        : line.isLink
          ? colors.link
          : colors[line.a.buildingId],
      line.isRoute
        ? 7
        : line.isLink
          ? 6
          : line.a.buildingId === 'outside'
            ? 3
            : 2.5
    );
  for (const node of relevant.values()) {
    const p = pixel(node.position);
    ctx.beginPath();
    ctx.arc(p.x, p.y, pathIds.has(node.id) ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = pathIds.has(node.id)
      ? colors.route
      : colors[node.buildingId];
    ctx.fill();
  }
  const label = (id, value, dx, dy, color = '#142b43') => {
    const p = pixel(nodes.get(id).position);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.font = 'bold 24px sans-serif';
    ctx.strokeText(value, p.x + dx, p.y + dy);
    text(value, p.x + dx, p.y + dy, 24, color, 'bold');
  };
  label(start.id, 'START · O’Connell 124', 18, -14, colors.route);
  label(goal.id, 'END · Langdon 120', -260, -12, colors.route);
  const labels = [
    ['ocon-1-exit-lower-ao', 'A · lower AO', 28, 12],
    ['ocon-1-exit-upper-ao', 'B · upper AO', -180, -20],
    ['ocon-1-exit-west-ao', 'C · west AO', -180, -12],
    ['lang-1-loading-dock-south', 'D · dock approach', -260, 12],
    ['lang-1-fence-gate-west', 'E · west gate', -175, -18],
    ['lang-1-fence-gate-middle', 'F · middle gate', 14, 44],
    ['lang-1-fence-gate-east', 'G · east gate', 40, 12]
  ];
  for (const [id, value, dx, dy] of labels) {
    const p = pixel(nodes.get(id).position);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
    ctx.strokeStyle = colors.link;
    ctx.lineWidth = 4;
    ctx.stroke();
    label(id, value, dx, dy, '#a04e0b');
  }
  text('N ↑', 2380, 310, 34, '#142b43', 'bold');
  text('PREVIEW REVIEW', 60, 1910, 29, '#142b43', 'bold');
  text(
    'A–D: existing door/dock links. E–G: user-confirmed gates and walkable courtyard; approaches remain approximate.',
    60,
    1952,
    24
  );
  text(
    `O’Connell: scale ${alignment.buildings.ocon.scale.toFixed(5)}, rotation ${alignment.buildings.ocon.rotationDegrees.toFixed(2)}°, max landmark error ${alignment.buildings.ocon.maxResidualFeet.toFixed(2)} ft.`,
    60,
    1993,
    24
  );
  text(
    `Langdon: scale ${alignment.buildings.lang.scale.toFixed(5)}, rotation ${alignment.buildings.lang.rotationDegrees.toFixed(2)}°, max landmark error ${alignment.buildings.lang.maxResidualFeet.toFixed(2)} ft.`,
    60,
    2034,
    24
  );
  let legendX = 60;
  for (const [key, title] of [
    ['ocon', 'O’Connell'],
    ['lang', 'Langdon'],
    ['outside', 'Outdoor'],
    ['link', 'Entrance link'],
    ['route', 'Dijkstra route']
  ]) {
    ctx.fillStyle = colors[key];
    ctx.fillRect(legendX, 2070, 35, 7);
    text(title, legendX + 48, 2082, 23);
    legendX += 390;
  }
  text(
    'Courtyard walkability user-confirmed. Exact geometry is approximate; accessibility and other campus access remain unspecified.',
    60,
    2144,
    23,
    '#725223'
  );
  text(
    'Outdoor/alignment data © OpenStreetMap contributors · ODbL 1.0 · https://www.openstreetmap.org/copyright',
    60,
    2197,
    22,
    '#637280'
  );
  await writeFile(
    'src/data/outdoor/ocon-lang-preview.png',
    await canvas.encode('png')
  );

  const routeReport = [
    '# O’Connell–Langdon loaded route',
    '',
    `Dijkstra from \`${start.id}\` to \`${goal.id}\`: **${distance.toFixed(2)} feet**, ${path.length} edges. Reverse route: **${reverse.reduce((sum, edge) => sum + edge.distance, 0).toFixed(2)} feet**.`,
    '',
    'Generated by the actual Vite-loaded `loadGraphFromData` and `calculatePath` functions. Positions are global campus feet. The visual preview shows first-floor nodes and nearby outdoor graph nodes only; upper floors are loaded and tested separately.',
    '',
    '## Entrance links',
    '',
    '| Label | Building endpoint | Outdoor endpoint | Loaded distance (ft) |',
    '| --- | --- | --- | ---: |'
  ];
  for (const [
    index,
    connection
  ] of connections.metadata.connections.entries()) {
    const edge = graph
      .get(connection.indoorNodeId)
      .find((edge) => edge.to === connection.outdoorNodeId);
    routeReport.push(
      `| ${String.fromCharCode(65 + index)} | ${connection.indoorNodeId} | ${connection.outdoorNodeId} | ${edge.distance.toFixed(2)} |`
    );
  }
  routeReport.push(
    '',
    '## User-confirmed gate courtyard',
    '',
    connections.metadata.walkabilityConfirmation.statement,
    '',
    connections.metadata.walkabilityConfirmation.geometry,
    '',
    'Confirmation: ' +
      connections.metadata.walkabilityConfirmation.date +
      '. General walkability only; no wheelchair-accessibility assertion.'
  );
  routeReport.push(
    '',
    '## Dijkstra traversal',
    '',
    '| From | To | Movement | Distance (ft) |',
    '| --- | --- | --- | ---: |'
  );
  for (const edge of path)
    routeReport.push(
      `| ${edge.from} | ${edge.to} | ${edge.type} | ${edge.distance.toFixed(2)} |`
    );
  routeReport.push(
    '',
    '## Registration review',
    '',
    ...alignment.provenance.uncertainties.map((issue) => `- ${issue}`),
    '',
    'Runtime nodes contain only global positions; source transforms are retained in `src/graph/campusAlignment.json` for loading and provenance. No indoor source positions were rewritten. The existing outdoor-only preview represents its original pre-connection snapshot.',
    ''
  );
  await writeFile(
    'src/data/outdoor/ocon-lang-route.md',
    routeReport.join('\n')
  );
  console.log({
    start: start.id,
    goal: goal.id,
    distanceFeet: distance,
    edges: path.length,
    loadedNodes: nodes.size,
    loadedDirectedEdges: [...graph.values()].flat().length,
    previewNodes: relevant.size
  });
} finally {
  await vite.close();
}
