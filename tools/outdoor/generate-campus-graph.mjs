// Offline preparation only; does not query services or modify indoor data.
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const sourcePath = 'campus-osm.json';
const source = await readFile(sourcePath);
const osm = JSON.parse(source);
if (osm.remark) throw new Error(osm.remark);
const ways = osm.elements.filter((e) => e.type === 'way' && e.tags?.highway);
const feetPerMeter = 1 / 0.3048;
const radians = Math.PI / 180;
const reference = { lat: 39.73, lon: -121.85 };
const latitude = reference.lat * radians;
// WGS84 meridional and prime-vertical radii at the campus reference latitude.
const a = 6378137;
const eccentricitySquared = 6.6943799901413165e-3;
const denominator = 1 - eccentricitySquared * Math.sin(latitude) ** 2;
const northRadius = (a * (1 - eccentricitySquared)) / denominator ** 1.5;
const eastRadius = (a / Math.sqrt(denominator)) * Math.cos(latitude);
const coordinates = new Map();
for (const way of ways) {
  if (way.nodes.length !== way.geometry.length)
    throw new Error(`Incomplete way ${way.id}`);
  way.nodes.forEach((id, index) => {
    const p = way.geometry[index];
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon))
      throw new Error('Invalid coordinates');
    const existing = coordinates.get(id);
    if (existing && (existing.lat !== p.lat || existing.lon !== p.lon))
      throw new Error(`Conflicting node ${id}`);
    coordinates.set(id, p);
  });
}

function exclusion(tags) {
  const allowed = new Set(['yes', 'designated', 'permissive']);
  if (tags.indoor === 'yes' || tags.highway === 'corridor') return 'indoor';
  if (tags['oneway:foot'] && tags['oneway:foot'] !== 'no')
    return 'directional pedestrian access';
  if (tags.foot && !allowed.has(tags.foot)) return 'pedestrian restriction';
  if (tags.access && !allowed.has(tags.access) && !allowed.has(tags.foot))
    return 'access restriction';
  if (
    tags.informal === 'yes' ||
    tags.sac_scale ||
    tags.smoothness === 'impassable'
  )
    return 'rough or informal trail';
  if (
    ['dirt', 'ground', 'grass', 'sand', 'stepping_stones'].includes(
      tags.surface
    )
  )
    return 'unpaved trail';
  if (['footway', 'steps', 'pedestrian'].includes(tags.highway)) return null;
  if (tags.highway === 'path') return 'unverified path';
  if (tags.highway === 'cycleway')
    return allowed.has(tags.foot)
      ? null
      : 'cycleway pedestrian permission unknown';
  if (tags.highway === 'service' && allowed.has(tags.foot)) return null;
  return 'road without explicit pedestrian permission';
}

const included = ways.filter((way) => exclusion(way.tags) === null);
const excluded = ways.filter((way) => exclusion(way.tags) !== null);
const originOsmId = included[0].nodes[0];
const origin = coordinates.get(originOsmId);
function project(p) {
  return {
    x: Number(
      ((p.lon - origin.lon) * radians * eastRadius * feetPerMeter).toFixed(2)
    ),
    y: Number(
      ((p.lat - origin.lat) * radians * northRadius * feetPerMeter).toFixed(2)
    )
  };
}
const nodeId = (id) => `outdoor-0-osm-${id}`;
const positions = new Map([...coordinates].map(([id, p]) => [id, project(p)]));
const membership = new Map();
for (const way of ways)
  for (const id of new Set(way.nodes))
    membership.set(id, (membership.get(id) ?? 0) + 1);

function perpendicularDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t =
    dx || dy
      ? Math.max(
          0,
          Math.min(
            1,
            ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)
          )
        )
      : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

// Remove only sub-half-foot deviations. Endpoints, shared nodes, and turns remain.
function simplify(ids) {
  if (ids.length <= 2) return ids;
  let pivot = -1;
  let max = 0.5;
  for (let i = 1; i < ids.length - 1; i++) {
    if (membership.get(ids[i]) > 1) {
      pivot = i;
      break;
    }
    const distance = perpendicularDistance(
      positions.get(ids[i]),
      positions.get(ids[0]),
      positions.get(ids.at(-1))
    );
    if (distance > max) {
      pivot = i;
      max = distance;
    }
  }
  return pivot < 0
    ? [ids[0], ids.at(-1)]
    : [
        ...simplify(ids.slice(0, pivot + 1)).slice(0, -1),
        ...simplify(ids.slice(pivot))
      ];
}

const used = new Set();
const edgeMap = new Map();
const sourceWays = [];
for (const way of included) {
  const ids = simplify(way.nodes);
  sourceWays.push({
    osmWayId: way.id,
    tags: way.tags,
    nodeIds: ids.map(nodeId)
  });
  for (let i = 1; i < ids.length; i++) {
    const from = ids[i - 1];
    const to = ids[i];
    if (
      from === to ||
      Math.hypot(
        positions.get(from).x - positions.get(to).x,
        positions.get(from).y - positions.get(to).y
      ) === 0
    )
      throw new Error('Degenerate edge');
    const key = [from, to].sort((a, b) => a - b).join('|');
    const type = way.tags.highway === 'steps' ? 'stairs' : 'outdoor';
    const edge = { from: nodeId(from), to: nodeId(to), weight: 1, type };
    if (type === 'stairs' || way.tags.wheelchair === 'no')
      edge.isAccessible = false;
    const existing = edgeMap.get(key);
    if (
      existing &&
      (existing.type !== edge.type ||
        existing.isAccessible !== edge.isAccessible)
    )
      throw new Error(`Conflicting duplicate ${key}`);
    edgeMap.set(key, edge);
    used.add(from);
    used.add(to);
  }
}
const nodes = [...used]
  .sort((a, b) => a - b)
  .map((id) => ({
    id: nodeId(id),
    buildingId: null,
    floorId: 0,
    position: positions.get(id)
  }));
const edges = [...edgeMap.values()];
const adjacency = new Map(nodes.map((n) => [n.id, new Set()]));
for (const edge of edges) {
  adjacency.get(edge.from).add(edge.to);
  adjacency.get(edge.to).add(edge.from);
}
const seen = new Set();
const components = [];
for (const n of nodes) {
  if (seen.has(n.id)) continue;
  const queue = [n.id];
  seen.add(n.id);
  for (let i = 0; i < queue.length; i++)
    for (const next of adjacency.get(queue[i]))
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
  components.push({ nodeIds: queue });
}
components.sort((a, b) => b.nodeIds.length - a.nodeIds.length);
const savedNodes = new Map(nodes.map((n) => [n.id, n]));
function center(points) {
  return {
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    y: points.reduce((s, p) => s + p.y, 0) / points.length
  };
}
const issues = [];
for (const [index, component] of components.entries()) {
  component.id = `component-${index + 1}`;
  if (index > 0)
    issues.push({
      kind: 'disconnected',
      description: `${component.id}: ${component.nodeIds.length} nodes; confirm whether a connection exists. No gap was bridged.`,
      nodeIds: component.nodeIds,
      position: center(
        component.nodeIds.map((id) => savedNodes.get(id).position)
      )
    });
}
for (const way of excluded) {
  const reason = exclusion(way.tags);
  if (
    [
      'indoor',
      'cycleway pedestrian permission unknown',
      'rough or informal trail',
      'unpaved trail',
      'unverified path'
    ].includes(reason)
  )
    issues.push({
      kind: reason,
      description: `Excluded OSM way ${way.id}: ${reason}.`,
      osmWayIds: [way.id],
      position: center(way.geometry.map(project))
    });
}
for (const way of included) {
  if (
    way.tags.highway === 'steps' &&
    (way.tags.ramp === 'yes' || way.tags['ramp:wheelchair'] === 'yes')
  )
    issues.push({
      kind: 'stairs with ramp',
      description: `OSM way ${way.id}: stairs and ramp share a way; retained as stairs, accessibility false. Confirm the ramp route separately.`,
      osmWayIds: [way.id],
      position: center(way.geometry.map(project))
    });
  if (way.tags.highway === 'service')
    issues.push({
      kind: 'shared service road',
      description: `OSM way ${way.id}: explicit pedestrian permission; check shared vehicle movement and practical walking line.`,
      osmWayIds: [way.id],
      position: center(way.geometry.map(project))
    });
}
// Geographic grouping makes map callouts readable; each issue retains its own position.
const reviewAreas = [];
for (const issue of issues) {
  let area = reviewAreas.find(
    (a) =>
      Math.hypot(
        a.position.x - issue.position.x,
        a.position.y - issue.position.y
      ) < 160
  );
  if (!area) {
    area = {
      id: `R${String(reviewAreas.length + 1).padStart(2, '0')}`,
      position: issue.position,
      issues: []
    };
    reviewAreas.push(area);
  }
  area.issues.push(issue);
}

const data = {
  metadata: {
    name: 'CSU Chico provisional outdoor walking graph',
    status:
      'manual review required; node-level barriers and access tags unavailable',
    source: {
      path: sourcePath,
      sha256: createHash('sha256').update(source).digest('hex'),
      timestamp: osm.osm3s.timestamp_osm_base,
      query:
        'Campus-area highway ways from scripts/fetch-osm-campus-map.mjs; no wider street network',
      nodeTagRetrieval:
        'Single bounded historical Overpass query timed out on 2026-10-25; no supplemental data received.'
    },
    license: {
      attribution: '© OpenStreetMap contributors',
      name: 'ODbL-1.0',
      url: 'https://opendatacommons.org/licenses/odbl/1-0/',
      copyrightUrl: 'https://www.openstreetmap.org/copyright'
    },
    units: 'feet',
    undirected: true,
    buildingId: null,
    floorId: 0,
    origin: {
      nodeId: nodeId(originOsmId),
      osmNodeId: originOsmId,
      latitude: origin.lat,
      longitude: origin.lon,
      description:
        'Existing OSM footway node; outdoor coordinate origin only, unrelated to indoor origins.'
    },
    projection: {
      method:
        'Local WGS84 linearization at campus reference latitude; suitable for campus-scale approximate horizontal distances',
      referenceLatitude: reference.lat,
      semiMajorAxisMeters: a,
      eccentricitySquared,
      radiansPerDegree: radians,
      eastRadiusMeters: eastRadius,
      northRadiusMeters: northRadius,
      feetPerMeter,
      axes: 'positive X east; positive Y north',
      formula:
        'x=(lon-origin.lon)*radiansPerDegree*eastRadiusMeters*feetPerMeter; y=(lat-origin.lat)*radiansPerDegree*northRadiusMeters*feetPerMeter; round to 0.01 ft'
    },
    conventions: {
      ids: 'outdoor-0-osm-<OSM node ID>; new outdoor convention',
      floor:
        '0 denotes outdoors for the existing numeric floorId contract; buildingId is null',
      distance:
        'Loader derives every distance from endpoint positions; weight 1; stairs omit vertical rise',
      geometry:
        'RDP tolerance 0.5 feet, preserving endpoints and every node shared with another source highway; no proximity snapping or inferred crossings',
      access:
        'Footway/steps presumed walkable unless restricted; cycleways and service roads require explicit foot=yes/designated/permissive. Mode-specific foot permission overrides general access. Ordinary vehicle roads excluded.',
      accessibility:
        'Stairs and explicit wheelchair=no are false; otherwise unknown. No true flags, no accessible-routing claim.',
      boundaries:
        'Uses pedestrian features in the collected campus-area export; boundary coverage and disconnected fragments remain provisional.'
    },
    uncertainties: [
      'Missing node-level entrance, barrier, gate, kerb and access tags affect the entire graph.',
      'This file contains outdoor geometry only; building entrance connections and geographic alignment are stored separately.',
      'Shared-node topology retained; geometric line intersections do not create connections.',
      'Disconnected components deliberately retained for review; no invented links.',
      'OSM snapshot does not establish current closures, opening hours or access permissions.',
      'Indoor corridors, rough trails, unapproved cycleways and most vehicle roads excluded; missing outdoor alternatives may cause legitimate route failures.'
    ],
    components,
    reviewAreas,
    sourceWays,
    excludedWays: excluded.map((w) => ({
      osmWayId: w.id,
      reason: exclusion(w.tags),
      tags: w.tags
    })),
    counts: {
      sourceHighwayWays: ways.length,
      includedWays: included.length,
      excludedWays: excluded.length,
      nodes: nodes.length,
      edges: edges.length,
      components: components.length,
      reviewAreas: reviewAreas.length
    }
  },
  nodes,
  edges
};
await mkdir('src/data/outdoor', { recursive: true });
await writeFile(
  'src/data/outdoor/campus.json',
  JSON.stringify(data, null, 2) + '\n'
);
const report = [
  '# Outdoor graph manual review',
  '',
  'Provisional general-walking outdoor geometry. Subsequent O’Connell/Langdon entrance connections and alignment are documented in ocon-lang-route.md and src/graph/campusAlignment.json.',
  '',
  '**Whole-map issue:** node-level barriers, gates, kerbs and access tags are unavailable because the supplemental request timed out. All included routes need this check; numbered markers are additional localized issues.',
  '',
  'The preview uses only local OSM vector geometry. Blue: main component; purple: disconnected components; orange: stairs; dashed gray: excluded ways; amber numbered circles: review areas. Markers cover grouped issues, not a claim that the rest is verified.',
  '',
  `Snapshot: ${data.metadata.source.timestamp}. ${nodes.length} nodes, ${edges.length} undirected edges, ${components.length} components.`,
  '',
  'The supplied screenshot is a visual cross-check only; no lines were traced or joined from its pixels. Building footprints are background context, not aligned indoor graphs.',
  '',
  '## Numbered areas',
  ''
];
for (const area of reviewAreas) {
  const lat =
    origin.lat + area.position.y / (northRadius * feetPerMeter * radians);
  const lon =
    origin.lon + area.position.x / (eastRadius * feetPerMeter * radians);
  report.push(
    `### ${area.id}`,
    '',
    `Approximate center: ${lat.toFixed(6)}, ${lon.toFixed(6)}.`,
    ''
  );
  for (const issue of area.issues)
    report.push(
      `- ${issue.description}${issue.osmWayIds ? ' ' + issue.osmWayIds.map((id) => `[way ${id}](https://www.openstreetmap.org/way/${id})`).join(', ') : ''}`
    );
  report.push('');
}
report.push(
  '## Source and reuse',
  '',
  'Map data © OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). See [OSM copyright](https://www.openstreetmap.org/copyright). The outdoor derived dataset is ODbL-1.0; it does not relicense application code or independent indoor data.',
  '',
  'The one-off supplemental request used Overpass, a named User-Agent, a 25-second server timeout, a 16 MiB resource limit, one request and no automatic retries. No map tiles were downloaded. See [Overpass usage guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html).',
  ''
);
await writeFile('src/data/outdoor/manual-review.md', report.join('\n'));
console.log(data.metadata.counts);
