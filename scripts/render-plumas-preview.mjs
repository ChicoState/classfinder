import fs from 'node:fs';

const floor = process.argv[2] ?? '1';
const data = JSON.parse(
  fs.readFileSync(`src/data/plumas/floor-${floor}.json`, 'utf8')
);
const source = `data:image/png;base64,${fs.readFileSync(`/tmp/plumas-floor${floor}-source.png`).toString('base64')}`;
const scale = 1.62;
const pageTop = 40;
const toPage = ({ x, y }) => ({
  x: (x / (30 / 72)) * scale + 515 * scale,
  y: pageTop + (545 - y / (30 / 72)) * scale
});
const nodes = new Map(data.nodes.map((node) => [node.id, node]));
const edgeColor = {
  corridor: '#00897b',
  door: '#ef6c00',
  stairs: '#7b1fa2',
  elevator: '#1565c0'
};
const edgeLines = data.edges
  .map((edge) => {
    const from = toPage(nodes.get(edge.from).position);
    const to = toPage(nodes.get(edge.to).position);
    return `<line x1="${from.x.toFixed(2)}" y1="${from.y.toFixed(2)}" x2="${to.x.toFixed(2)}" y2="${to.y.toFixed(2)}" stroke="${edgeColor[edge.type] ?? '#555'}" stroke-width="2" stroke-opacity="0.62" />`;
  })
  .join('');
const nodeDots = data.nodes
  .map((node) => {
    const point = toPage(node.position);
    const transfer = /stairs|elevator/.test(node.id);
    return `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="${transfer ? 5 : 2.8}" fill="${transfer ? '#1565c0' : '#d32f2f'}" stroke="white" stroke-width="1" />`;
  })
  .join('');
const origin = toPage({ x: 0, y: 0 });
const legend = `<g font-family="sans-serif" font-size="13"><rect x="18" y="58" width="300" height="88" rx="6" fill="white" fill-opacity="0.92" stroke="#555"/><text x="30" y="80" fill="#222" font-weight="bold">Plumas Hall — ${floor}nd floor graph</text><circle cx="34" cy="101" r="4" fill="#d32f2f"/><text x="45" y="105" fill="#222">doorway / routing node</text><circle cx="34" cy="124" r="4" fill="#1565c0"/><text x="45" y="128" fill="#222">stair or elevator transfer</text></g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1020" height="1320" viewBox="0 0 1020 1320"><image href="${source}" x="0" y="0" width="1020" height="1320"/><g>${edgeLines}</g><g>${nodeDots}</g><g><circle cx="${origin.x.toFixed(2)}" cy="${origin.y.toFixed(2)}" r="8" fill="none" stroke="#ff1744" stroke-width="3"/><line x1="${(origin.x - 12).toFixed(2)}" y1="${origin.y.toFixed(2)}" x2="${(origin.x + 12).toFixed(2)}" y2="${origin.y.toFixed(2)}" stroke="#ff1744" stroke-width="2"/><line x1="${origin.x.toFixed(2)}" y1="${(origin.y - 12).toFixed(2)}" x2="${origin.x.toFixed(2)}" y2="${(origin.y + 12).toFixed(2)}" stroke="#ff1744" stroke-width="2"/></g>${legend}</svg>`;
fs.writeFileSync(`/tmp/plumas-floor${floor}-preview.svg`, svg);
