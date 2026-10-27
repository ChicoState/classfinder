// Reproducible offline similarity fits from matched PDF/OSM landmarks.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const osm = JSON.parse(await readFile('campus-osm.json', 'utf8'));
const outdoor = JSON.parse(
  await readFile('src/data/outdoor/campus.json', 'utf8')
);
const ocon = JSON.parse(await readFile('src/data/ocon/floor-1.json', 'utf8'));
const lang = JSON.parse(await readFile('src/data/lang/floor-1.json', 'utf8'));
const sourceNodes = new Map(
  osm.elements.flatMap((way) =>
    (way.nodes ?? []).map((id, i) => [id, way.geometry[i]])
  )
);
const { origin, projection } = outdoor.metadata;
function project(p) {
  return {
    x:
      (p.lon - origin.longitude) *
      projection.radiansPerDegree *
      projection.eastRadiusMeters *
      projection.feetPerMeter,
    y:
      (p.lat - origin.latitude) *
      projection.radiansPerDegree *
      projection.northRadiusMeters *
      projection.feetPerMeter
  };
}
function anchor(description, localPosition, osmNodeId, extra = {}) {
  return {
    description,
    localPosition,
    osmNodeId,
    globalPosition: project(sourceNodes.get(osmNodeId)),
    ...extra
  };
}
const oconAnchors = [
  [
    'ocon-1-exit-lower-ao',
    5849825682,
    'Lower AO lobby doorway to the southeast covered OSM footway endpoint'
  ],
  [
    'ocon-1-exit-upper-ao',
    5849825683,
    'Upper AO lobby doorway to the northwest covered OSM footway endpoint'
  ],
  [
    'ocon-1-exit-west-ao',
    11938244696,
    'West AO corridor doorway at the southwest covered OSM footway endpoint'
  ]
].map(([id, osmNodeId, description]) =>
  anchor(
    description,
    ocon.nodes.find((node) => node.id === id).position,
    osmNodeId,
    { localNodeId: id }
  )
);

// Native PDF points measured on the reference floor, not chat image dimensions.
const langCorners = [
  ['northwest stem corner', 105, 65.5, 4502036602],
  ['northeast stem corner', 335.5, 65.5, 4502036601],
  ['inside elbow', 335.5, 510.5, 4502036600],
  ['east wing north corner', 566, 510.5, 4502036599],
  ['east wing south corner', 566, 638.5, 4502036598],
  ['west wing south corner', 47.5, 638.5, 4502036605],
  ['west wing north corner', 47.5, 510.5, 4502036604]
];
const pdfOrigin = lang.metadata.origin.pdfPointFromTopLeft;
const langAnchors = langCorners.map(([description, x, y, osmNodeId]) =>
  anchor(
    description,
    {
      x: (x - pdfOrigin.x) * lang.metadata.feetPerPdfPoint,
      y: (pdfOrigin.y - y) * lang.metadata.feetPerPdfPoint
    },
    osmNodeId,
    { pdfPointFromTopLeft: { x, y } }
  )
);

function fit(anchors, evidence) {
  const average = (side, axis) =>
    anchors.reduce((sum, item) => sum + item[side][axis], 0) / anchors.length;
  const lx = average('localPosition', 'x');
  const ly = average('localPosition', 'y');
  const gx = average('globalPosition', 'x');
  const gy = average('globalPosition', 'y');
  let denominator = 0;
  let real = 0;
  let imaginary = 0;
  for (const anchor of anchors) {
    const x = anchor.localPosition.x - lx;
    const y = anchor.localPosition.y - ly;
    const u = anchor.globalPosition.x - gx;
    const v = anchor.globalPosition.y - gy;
    denominator += x * x + y * y;
    real += x * u + y * v;
    imaginary += x * v - y * u;
  }
  if (denominator === 0) throw new Error('Alignment needs separated landmarks');
  const a = real / denominator;
  const b = imaginary / denominator;
  const tx = gx - a * lx + b * ly;
  const ty = gy - b * lx - a * ly;
  const errors = anchors.map((anchor) =>
    Math.hypot(
      a * anchor.localPosition.x -
        b * anchor.localPosition.y +
        tx -
        anchor.globalPosition.x,
      b * anchor.localPosition.x +
        a * anchor.localPosition.y +
        ty -
        anchor.globalPosition.y
    )
  );
  return {
    a,
    b,
    tx,
    ty,
    scale: Math.hypot(a, b),
    rotationDegrees: (Math.atan2(b, a) * 180) / Math.PI,
    rmsResidualFeet: Math.sqrt(
      errors.reduce((sum, error) => sum + error * error, 0) / errors.length
    ),
    maxResidualFeet: Math.max(...errors),
    method:
      'Least-squares orientation-preserving similarity: xGlobal=a*xLocal-b*yLocal+tx; yGlobal=b*xLocal+a*yLocal+ty',
    evidence,
    anchors: anchors.map((anchor, i) => ({
      ...anchor,
      residualFeet: errors[i]
    }))
  };
}
const alignment = {
  globalFrame: {
    id: 'campus-feet',
    units: 'feet',
    originNodeId: origin.nodeId,
    latitude: origin.latitude,
    longitude: origin.longitude,
    axes: 'X east, Y north',
    outdoorProjection: projection
  },
  excludedBuildingIds: ['holt'],
  provenance: {
    date: '2026-10-25',
    osmSource: 'campus-osm.json',
    osmSnapshot: outdoor.metadata.source.timestamp,
    floorSources: ['src/data/ocon/floor-1.json', 'src/data/lang/floor-1.json'],
    license: outdoor.metadata.license,
    uncertainties: [
      'Manual landmark matching and dated PDFs; approximate, not surveyed.',
      'O’Connell requires an approximately 12% scale correction to match the three outdoor doorway endpoints. The adjustment applies to all its loaded floor distances.',
      'Langdon gate positions are approximate user-approved fence midpoints. Courtyard walkability and gate connections were confirmed by the user on 2026-10-25; exact approach geometry is inferred.',
      'Entrance links span small registration residuals. Other door and building access permissions remain unverified; no wheelchair accessibility is inferred.',
      'Indoor JSON stays in its traceable source coordinates; all returned runtime nodes use campus-feet. Holt is explicitly omitted until aligned.'
    ]
  },
  buildings: {
    ocon: fit(
      oconAnchors,
      'Three spread entrance matches supported by ground-floor AO openings and OSM indoor corridors ending at outdoor footways (1320210552, 1320210554, 1334646833–1334646835). Indoor OSM corridors are evidence only; they are not imported as routing shortcuts.'
    ),
    lang: fit(
      langAnchors,
      'Seven ground-floor architectural corners matched to OSM footprint way 453472915. Source PDF csuc-floor-plans/Langdon/lang-1.pdf, 612×792 points, scale 30/72 feet per point. The long stem and perpendicular east-west wing disambiguate orientation.'
    )
  }
};
for (const path of alignment.provenance.floorSources) {
  alignment.provenance[
    `${path.includes('/ocon/') ? 'ocon' : 'lang'}SourceSha256`
  ] = createHash('sha256')
    .update(await readFile(path))
    .digest('hex');
}
const langTransform = alignment.buildings.lang;
const gateApproaches = ['west', 'middle', 'east'].map((section) => {
  const gate = lang.nodes.find(
    (node) => node.id === `lang-1-fence-gate-${section}`
  );
  const { a, b, tx, ty, scale } = langTransform;
  // Five global feet toward positive drawing Y keeps the walking line outside
  // the fence; only each existing gate doorway crosses the fence itself.
  return {
    gateNodeId: gate.id,
    node: {
      id: `outdoor-0-lang-gate-${section}-approach`,
      buildingId: null,
      floorId: 0,
      position: {
        x: Number(
          (
            a * gate.position.x -
            b * gate.position.y +
            tx -
            (5 * b) / scale
          ).toFixed(2)
        ),
        y: Number(
          (
            b * gate.position.x +
            a * gate.position.y +
            ty +
            (5 * a) / scale
          ).toFixed(2)
        )
      }
    }
  };
});
const links = {
  metadata: {
    name: 'O’Connell and Langdon entrance links to campus-feet outdoor graph',
    undirected: true,
    units: 'feet',
    alignment: 'src/graph/campusAlignment.json',
    provenance:
      'O’Connell uses three matched AO doorway endpoints. Langdon connects its loading-dock approach and all three existing gates through the user-confirmed walkable courtyard.',
    accessibility:
      'Unknown; no true flag is inferred from a nearby AO doorway.',
    review:
      'Registration residuals and precise approach geometry remain approximate. Gate/courtyard walkability is user-confirmed. No proximity search creates these links.',
    walkabilityConfirmation: {
      date: '2026-10-25',
      source: 'User confirmation in this task',
      statement:
        'The entire section between the gates in Langdon and the O’Connell doors used in the test is walkable; the gates can safely connect to the outdoor graph.',
      geometry:
        'Three approach points five global feet outside the existing gate midpoints, connected parallel to the fence. The west approach joins existing courtyard OSM node 12217284216; the east approach joins existing O’Connell exterior approach OSM node 5862340697. These paths stay in the confirmed open area; only gate edges cross the fence.',
      accessibility:
        'General walkability only; no accessible-route or ramp-compliance assertion.'
    },
    connections: [
      ...oconAnchors.map((anchor) => ({
        indoorNodeId: anchor.localNodeId,
        outdoorNodeId: `outdoor-0-osm-${anchor.osmNodeId}`,
        evidence: anchor.description
      })),
      {
        indoorNodeId: 'lang-1-loading-dock-south',
        outdoorNodeId: 'outdoor-0-osm-11938244697',
        evidence:
          'Shown open loading-dock south circulation and mapped footway 1301833214 at the west wing. This connects outdoor approaches, not room 115 directly.'
      },
      ...gateApproaches.map(({ gateNodeId, node }) => ({
        indoorNodeId: gateNodeId,
        outdoorNodeId: node.id,
        evidence:
          'Existing user-approved gate midpoint; exterior courtyard walkability and gate connection confirmed by the user on 2026-10-25. The five-foot approach offset is schematic geometry.'
      }))
    ]
  },
  nodes: gateApproaches.map(({ node }) => node),
  edges: []
};
links.edges = links.metadata.connections.map((link) => ({
  from: link.indoorNodeId,
  to: link.outdoorNodeId,
  weight: 1,
  type: link.indoorNodeId === 'lang-1-loading-dock-south' ? 'outdoor' : 'door'
}));
links.edges.push(
  {
    from: gateApproaches[0].node.id,
    to: gateApproaches[1].node.id,
    weight: 1,
    type: 'outdoor'
  },
  {
    from: gateApproaches[1].node.id,
    to: gateApproaches[2].node.id,
    weight: 1,
    type: 'outdoor'
  },
  {
    from: gateApproaches[0].node.id,
    to: 'outdoor-0-osm-12217284216',
    weight: 1,
    type: 'outdoor'
  },
  {
    from: gateApproaches[2].node.id,
    to: 'outdoor-0-osm-5862340697',
    weight: 1,
    type: 'outdoor'
  }
);
await writeFile(
  'src/graph/campusAlignment.json',
  JSON.stringify(alignment, null, 2) + '\n'
);
await writeFile(
  'src/data/outdoor/building-connections.json',
  JSON.stringify(links, null, 2) + '\n'
);
for (const [id, transform] of Object.entries(alignment.buildings))
  console.log(id, {
    scale: transform.scale,
    rotationDegrees: transform.rotationDegrees,
    rmsFeet: transform.rmsResidualFeet,
    maxFeet: transform.maxResidualFeet
  });
