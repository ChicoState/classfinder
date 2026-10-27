#!/usr/bin/env node

const [outputPrefix = 'campus-osm'] = process.argv.slice(2);
const campusName = 'California State University, Chico';
const query = `[out:json][timeout:60];
area["amenity"="university"]["name"="${campusName}"]->.campus;
(
  way(area.campus)[building];
  way(area.campus)[highway];
  way(area.campus)[waterway];
  way(area.campus)[landuse];
  way(area.campus)[leisure];
  way(area.campus)[natural];
);
out geom;`;

const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    'user-agent': 'ClassFinder-campus-map-script/0.1',
  },
  body: new URLSearchParams({ data: query }),
});

if (!response.ok) {
  throw new Error(`Overpass API returned ${response.status} ${response.statusText}`);
}

const osm = await response.json();
const ways = osm.elements.filter(
  (element) => element.type === 'way' && element.geometry?.length > 1,
);

if (ways.length === 0) {
  throw new Error(
    `No OSM features found inside the university area named "${campusName}". Check its OSM boundary and tags.`,
  );
}

const coordinates = ways.flatMap((way) => way.geometry);
const south = Math.min(...coordinates.map(({ lat }) => lat));
const north = Math.max(...coordinates.map(({ lat }) => lat));
const west = Math.min(...coordinates.map(({ lon }) => lon));
const east = Math.max(...coordinates.map(({ lon }) => lon));
const width = 1400;
const height = 1400;
const padding = 24;
const midLat = ((south + north) / 2) * (Math.PI / 180);
const xScale = Math.cos(midLat);
const projectedWidth = (east - west) * xScale;
const projectedHeight = north - south;
const scale = Math.min(
  (width - padding * 2) / projectedWidth,
  (height - padding * 2) / projectedHeight,
);
const mapWidth = projectedWidth * scale;
const mapHeight = projectedHeight * scale;
const offsetX = (width - mapWidth) / 2;
const offsetY = (height - mapHeight) / 2;
const project = ({ lat, lon }) =>
  `${(offsetX + (lon - west) * xScale * scale).toFixed(2)},${(
    offsetY + (north - lat) * scale
  ).toFixed(2)}`;
const escapeXml = (value) =>
  String(value).replace(/[<>&"']/g, (character) => {
    const entities = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return entities[character];
  });

const features = ways
  .map((way) => {
    const tags = way.tags ?? {};
    const isBuilding = Boolean(tags.building);
    const isArea =
      isBuilding ||
      Boolean(tags.landuse || tags.leisure || tags.natural === 'wood' || tags.natural === 'water');
    const points = way.geometry.map(project).join(' ');
    const title = escapeXml(tags.name ?? tags.building ?? tags.highway ?? 'OSM feature');

    if (isArea && way.geometry.length > 2) {
      const fill = isBuilding ? '#d6c8b8' : '#d9edce';
      const stroke = isBuilding ? '#887c70' : '#94b58b';
      return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="1"><title>${title}</title></polygon>`;
    }

    if (tags.waterway) {
      return `<polyline points="${points}" fill="none" stroke="#79b9d4" stroke-width="3"><title>${title}</title></polyline>`;
    }

    if (tags.highway) {
      const isPath = ['footway', 'path', 'pedestrian', 'steps', 'cycleway'].includes(tags.highway);
      const stroke = isPath ? '#c99a63' : '#fff';
      const lineWidth = isPath ? 2 : 4;
      return `<polyline points="${points}" fill="none" stroke="${stroke}" stroke-width="${lineWidth}" stroke-linecap="round" stroke-linejoin="round"><title>${title}</title></polyline>`;
    }

    return '';
  })
  .filter(Boolean)
  .join('\n');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f7f4ed" />
  ${features}
  <text x="${width - 12}" y="${height - 12}" text-anchor="end" font-family="sans-serif" font-size="12" fill="#555">© OpenStreetMap contributors</text>
</svg>
`;

const { writeFile } = await import('node:fs/promises');
await writeFile(`${outputPrefix}.json`, `${JSON.stringify(osm, null, 2)}\n`);
await writeFile(`${outputPrefix}.svg`, svg);
console.log(`Wrote ${outputPrefix}.json and ${outputPrefix}.svg (${ways.length} ways).`);
