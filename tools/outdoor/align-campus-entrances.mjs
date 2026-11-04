// Offline extension of the existing campus registration; source floor JSON is unchanged.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fit } from './similarity.mjs';
import { format } from 'prettier';
const read = async (path) => JSON.parse(await readFile(path, 'utf8'));
const alignment = await read('src/graph/campusAlignment.json');
const remainingAlignment = await read('tools/outdoor/remaining-alignment.json');
const remainingEntrances = await read('tools/outdoor/remaining-entrances.json');
const config = {
  ...(await read('tools/outdoor/entrance-alignment.json')),
  ...Object.fromEntries(
    Object.entries(remainingAlignment).map(([id, spec]) => [
      id,
      { ...spec, ...remainingEntrances[id] }
    ])
  )
};

const osm = await read('campus-osm.json');
osm.elements.push(
  ...(await read('tools/outdoor/remaining-footprints-osm.json')).elements
    .filter((w) => w.type === 'way')
    .map((w) => ({ ...w, tags: { building: 'university' } }))
);
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

alignment.provenance.entranceExtensionDate = '2026-10-28';
alignment.provenance.floorSources = [
  ...new Set([
    ...alignment.provenance.floorSources,
    ...Object.keys(config).map((id) => `src/data/${id}/floor-1.json`)
  ])
];

const { distance, inside, route, clear } = await import('./entrance-paths.mjs');
const campus = await read('src/data/outdoor/campus.json');
const obstacles = osm.elements
  .filter(
    (w) =>
      w.tags?.building &&
      w.geometry?.length > 3 &&
      !Object.values(config).some(
        (s) => s.sourceObstacleOverride?.osmWayId === w.id
      )
  )
  .map((w) => w.geometry.map(project));
const barriers = osm.elements
  .filter(
    (w) =>
      ['fence', 'wall'].includes(w.tags?.barrier) ||
      w.tags?.waterway === 'stream'
  )
  .map((w) => w.geometry.map(project));
const transform = (q, t) => ({
  x: t.a * q.x - t.b * q.y + t.tx,
  y: t.b * q.x + t.a * q.y + t.ty
});
for (const [id, spec] of Object.entries(config)) {
  if (!spec.sourceObstacleOverride) continue;
  const m = (await read(`src/data/${id}/floor-1.json`)).metadata;
  const o = m.origin.pdfPoint ?? m.origin.pdfPointFromTopLeft;
  const ox = o.x ?? o[0],
    oy = o.y ?? o[1],
    factor = m.feetPerPdfPoint ?? m.scale.feetPerPdfPoint;
  for (const polygon of spec.sourceObstacleOverride.referencePdfPolygons)
    obstacles.push(
      polygon.map(([x, y]) =>
        transform(
          { x: (x - ox) * factor, y: (oy - y) * factor },
          alignment.buildings[id]
        )
      )
    );
}
for (const [id, spec] of Object.entries(config))
  for (const line of spec.sourceBarriers ?? []) {
    barriers.push(line.map((q) => transform(q, alignment.buildings[id])));
  }
const round = (q) => ({ x: Number(q.x.toFixed(2)), y: Number(q.y.toFixed(2)) });
// Connect to the component containing the campus origin, not an isolated OSM stub.
const adjacency = new Map(campus.nodes.map((n) => [n.id, []]));
for (const e of campus.edges) {
  adjacency.get(e.from).push(e.to);
  adjacency.get(e.to).push(e.from);
}
const reached = new Set([alignment.globalFrame.originNodeId]);
for (const id of reached)
  for (const next of adjacency.get(id)) reached.add(next);
const targets = campus.nodes.filter((n) => reached.has(n.id));
const output = {
  metadata: {
    name: 'Campus building entrance approaches',
    units: 'feet',
    undirected: true,
    date: '2026-10-28',
    alignment: 'src/graph/campusAlignment.json',
    sourceImage: 'campusmap.png',
    osmSource: 'campus-osm.json',
    method:
      'Explicit source doorway inventory; provisional open-area approaches inferred from campusmap.png under user campus walkability guidance. Visibility paths avoid OSM building footprints, mapped fences/walls and streams. Missing or dated geometry still needs review.',
    sourceBarriers: Object.fromEntries(
      Object.entries(config)
        .filter(([, s]) => s.sourceBarriers)
        .map(([id, s]) => [
          id,
          {
            lines: s.sourceBarriers,
            source: `src/data/${id}/floor-1.json`,
            reason: s.barrierReason
          }
        ])
    ),
    obstacleOverrides: Object.fromEntries(
      Object.entries(config)
        .filter(([, s]) => s.sourceObstacleOverride)
        .map(([id, s]) => [id, s.sourceObstacleOverride])
    ),
    accessibility:
      'Unknown. No accessible flag is inferred from indoor AO markings.',
    connections: [],
    doorwaysViaGates: Object.values(config).flatMap((s) =>
      (s.doorwaysViaGates ?? []).map((nodeId) => ({
        nodeId,
        gateNodeIds: s.gateNodeIds,
        evidence:
          'Existing source-shown yard circulation and gates; no new shortcut through the yard fence.'
      }))
    ),
    reviewAreas: []
  },
  nodes: [],
  edges: []
};
for (const [id, spec] of Object.entries(config)) {
  const floor = await read(`src/data/${id}/floor-1.json`),
    t = alignment.buildings[id];
  for (const [entryIndex, entry] of spec.entrances.entries()) {
    const n = floor.nodes.find((n) => n.id === entry.nodeId);
    if (!n) throw new Error(`Unknown entrance ${entry.nodeId}`);
    const reviewId = `ENT-${id.toUpperCase()}-${String(entryIndex + 1).padStart(2, '0')}`;
    const door = transform(n.position, t),
      direction = entry.outwardLocal;
    let approach;
    // Registration residuals can put a doorway just inside the mapped facade.
    // Move outward along its source-shown side until outside all footprints.
    for (let offset = 5; offset <= 35; offset += 2) {
      const q = round(
        transform(
          {
            x: n.position.x + (offset * direction.x) / t.scale,
            y: n.position.y + (offset * direction.y) / t.scale
          },
          t
        )
      );
      if (!obstacles.some((poly) => inside(q, poly))) {
        approach = q;
        break;
      }
    }
    if (!approach)
      throw new Error(
        `${reviewId}: source outward approach conflicts with footprint`
      );
    if (!clear(door, approach, [], barriers))
      throw new Error(`${reviewId}: doorway approach crosses a mapped barrier`);
    const nearest = targets
      .filter(
        (n) => !entry.outdoorTargetNodeId || n.id === entry.outdoorTargetNodeId
      )
      .map((n) => ({ ...n.position, id: n.id }))
      .sort((a, b) => distance(a, approach) - distance(b, approach))
      .slice(0, 35);
    const path = [approach, ...route(approach, nearest, obstacles, barriers)];
    let from = n.id;
    const edgeIds = [],
      nodeIds = [];
    for (const [i, q] of path.entries()) {
      const to = q.id ?? `outdoor-0-${id}-entrance-${entryIndex + 1}-${i}`;
      if (!q.id)
        output.nodes.push({
          id: to,
          buildingId: null,
          floorId: 0,
          position: round(q)
        });
      output.edges.push({
        from,
        to,
        weight: 1,
        type: i === 0 ? 'door' : 'outdoor'
      });
      edgeIds.push([from, to]);
      nodeIds.push(to);
      from = to;
    }
    output.metadata.connections.push({
      indoorNodeId: n.id,
      outdoorNodeId: nodeIds[0],
      osmTargetNodeId: from,
      reviewId
    });
    output.metadata.reviewAreas.push({
      id: reviewId,
      status: 'inferred; needs review',
      sourceImage: 'campusmap.png',
      sourceFloor: `src/data/${id}/floor-1.json`,
      location: round(door),
      initialApproachFeet: Number(distance(door, approach).toFixed(2)),
      ...(spec.sourceObstacleOverride
        ? { obstacleOverride: spec.sourceObstacleOverride.reason }
        : {}),
      nodeIds: [n.id, ...nodeIds],
      edgeIds,
      reasoning:
        'Source shows this exterior doorway; the campus map shows surrounding open circulation. Approach is inferred under user walkability guidance, with OSM footprint/barrier checks. The initial outward segment follows the source doorway side and includes registration/covered-approach differences; inspect it with the source plan.',
      date: '2026-10-28'
    });
    console.log(reviewId, n.id, 'to', from, 'segments', path.length);
  }
}
await writeFile(
  'src/data/outdoor/entrance-connections.json',
  await format(JSON.stringify(output), {
    ...(await read('.prettierrc.json')),
    parser: 'json'
  })
);

await writeFile(
  'src/graph/campusAlignment.json',
  await format(JSON.stringify(alignment), {
    ...(await read('.prettierrc.json')),
    parser: 'json'
  })
);
