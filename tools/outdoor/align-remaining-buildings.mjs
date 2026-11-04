// Offline extension of the existing campus registration; source floor JSON is unchanged.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fit } from './similarity.mjs';
import { format } from 'prettier';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const alignment = await read('src/graph/campusAlignment.json');
const config = await read('tools/outdoor/remaining-alignment.json');
const osm = await read('campus-osm.json');
const additional = await read('tools/outdoor/remaining-footprints-osm.json');
osm.elements.push(...additional.elements);
const { latitude, longitude, outdoorProjection: p } = alignment.globalFrame;
function project(g) {
  return {
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
  };
}
for (const [id, spec] of Object.entries(config)) {
  const source = `src/data/${id}/floor-1.json`;
  const floor = await read(source);
  const m = floor.metadata;
  const origin = m.origin.pdfPoint ?? m.origin.pdfPointFromTopLeft;
  const ox = origin.x ?? origin[0],
    oy = origin.y ?? origin[1];
  const factor = m.feetPerPdfPoint ?? m.scale.feetPerPdfPoint;
  const way = osm.elements.find((w) => w.id === spec.osmFootprintWayId);
  const anchors = spec.anchors.map(
    ({ osmVertexIndex: i, pdfPointFromTopLeft: q }) => ({
      description: `Footprint ${way.id} vertex ${i}; corresponding source exterior corner`,
      pdfPointFromTopLeft: q,
      osmNodeId: way.nodes[i],
      localPosition: { x: (q.x - ox) * factor, y: (oy - q.y) * factor },
      globalPosition: project(way.geometry[i])
    })
  );
  alignment.buildings[id] = {
    ...fit(
      anchors,
      `Manual source-PDF exterior corners matched to OSM footprint ${way.id}; drawing axes and printed scale checked. Approximate, not surveyed.`
    ),
    source,
    sourceSha256: createHash('sha256')
      .update(await readFile(source))
      .digest('hex'),
    date: '2026-10-28',
    ...(spec.osmRelationId
      ? {
          osmRelationId: spec.osmRelationId,
          footprintSource: 'tools/outdoor/remaining-footprints-osm.json'
        }
      : {})
  };
  if (alignment.buildings[id].maxResidualFeet > spec.reviewLimitFeet)
    throw new Error(`${id}: landmark residual exceeds review limit`);
  console.log(
    id,
    JSON.stringify({
      scale: alignment.buildings[id].scale,
      rotation: alignment.buildings[id].rotationDegrees,
      maxFeet: alignment.buildings[id].maxResidualFeet
    })
  );
}

alignment.provenance.remainingAlignmentDate = '2026-10-28';
alignment.provenance.floorSources = [
  ...new Set([
    ...alignment.provenance.floorSources,
    ...Object.keys(config).map((id) => `src/data/${id}/floor-1.json`)
  ])
];
await writeFile(
  'src/graph/campusAlignment.json',
  await format(JSON.stringify(alignment), {
    ...(await read('.prettierrc.json')),
    parser: 'json'
  })
);
