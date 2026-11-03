# ClassFinder

ClassFinder will help students enter classes and receive campus directions. The repository now contains the initial Vite/React application shell; class-entry behavior, routing logic, and campus data are still being built.

## Repository map

- `infrastructure_plan.md` — selected infrastructure decisions.
- `package.json` — npm scripts and development dependencies.
- `Dockerfile`, `compose.yml`, `.dockerignore` — reproducible Node.js development environment.
- `scripts/` — infrastructure verification and the existing OSM source collector.
- `tools/outdoor/` — offline outdoor graph generation and preview rendering.
- `index.html` — Vite's browser document shell.
- `src/` — React application source, with `main.tsx` as the entrypoint, `App.tsx` as the root component, shared graph contracts in `lib/graph.ts`, and graph-assembly helpers in `graph/`.
- `src/data/` — bundled floor-plan JSON and a local visual verification preview.
- `tests/unit/` — graph loading, graph assembly, and Dijkstra tests; `tests/ui/` and `tests/e2e/` are reserved for future flows.
- `.github/workflows/` — pull-request checks and GitHub Pages release deployment.
- `.agents/skills/` — project-provided agent skills.

## Floor-plan graph data

`src/graph/graphLoader.ts` discovers all `src/data/<building-id>/*.json` files
at build time using Vite's eager glob imports and returns fresh
`[Graph, Nodes]` maps. Each JSON edge is stored once and loaded in both directions,
preserving its weight, kind, and optional accessibility flag; its runtime distance
is derived from the transformed endpoint coordinates. All returned coordinates
and distances use one global campus frame in feet. Source JSON retains its local
drawing coordinates. For O'Connell, the lower lobby's AO-marked exterior doorway serves as
the source origin. Upper floors are approximately aligned using the passenger elevator
shaft. The JSON metadata records the PDF scale and digitization limitations.
The upper stair connects floors 1–2 only; the west and lower stairs
and both elevators connect floors 1–4.

Langdon Hall (`lang`) has three floor datasets in `src/data/lang/` and four
adjacent-floor stair connections plus two elevator connections. Floors 2 and 3 share `Langdon/lang-2.pdf`;
all sheets are dated September 2, 2010. The west exterior door of room 119 is
the local origin. The elevator is connected across all three floors and marked accessible based on
user confirmation (2026-10-14); corridor-facing entrance locations are approximate.
Stair distances use aligned plan-view coordinates and omit vertical rise.

Holt Hall (`holt`) has a first-floor dataset at `src/data/holt/floor-1.json`,
digitized from `Holt/holt-1.pdf` (February 17, 2011; 1 inch = 40 feet).
The drawing-bottom AO entrance is its local origin. All numbered destinations
are connected through the shown doorways. Walkable paths through the stair rooms,
confirmed by the user on October 19, 2026, connect the east landings to the main
circulation using corridor edges. No upper floors or vertical transfers are included yet. Only the
two AO-marked end entrance edges are marked accessible. The requested
`src/data/holt/floor-1-preview.png` overlays the saved graph on the source plan
and is a local review artifact, not an application import or commit artifact.
Holt is no longer excluded from runtime loading (user request, October 28, 2026).
It now has a geographic alignment and seven outdoor entrance links (October 28, 2026).

Filter candidate nodes by building before using `findNodeNearPosition` with the
known starting floor, then pass the resulting
start node and the destination node to `calculatePath`. Each returned path edge
contains both `from` and `to` node IDs so instruction code can derive the direction
of consecutive segments. Nearest-node lookup uses only X/Y within the requested
floor.

`src/pathingAdapter.ts` converts a computed path into ordered, generic navigation
instructions. Corridors and outdoor paths use left/right/straight guidance; doors,
ramps, stairs, and elevators use their movement type, with vertical transfers naming
their destination floor. `getReadableInstructions` accepts an optional seventh
argument, `buildingId` (`'lang'` for Langdon); it defaults to `'ocon'` for
existing callers. Both endpoints are selected within that building. Unknown
buildings return `null`. Coordinate arguments and returned positions are global
campus feet, matching the loaded nodes. For routes between different buildings,
select the loaded start/destination nodes and call `calculatePath` directly.

`gpsToCampusPosition(latitude, longitude)` in `pathingAdapter.ts` converts GPS
degrees into the same global campus feet coordinates used by loaded nodes
(`x` east, `y` north), using the saved campus origin and projection. It does not
choose a building, infer a floor, or snap to a graph node.

This data belongs in `src/data` because it is part of the application and is
imported by the loader. A root-level data directory would make more sense for
independent source datasets or preprocessing inputs. The original PDFs remain in
`csuc-floor-plans/`; `src/data/ocon/floor-*-preview.png` files are local review aids
and are not imported by the application or intended for commits. The loader
trusts the bundled dataset; it is not an arbitrary JSON upload parser.

## Outdoor graph data

`src/data/outdoor/campus.json` contains a provisional, separate CSU Chico outdoor
walking graph, automatically discovered by the existing loader. Its 1,310 nodes
and 1,449 undirected edges form 10 components; disconnected regions have not been
joined artificially. Outdoor nodes use `buildingId: null`, numeric `floorId: 0`,
and IDs `outdoor-0-osm-<OSM node ID>`. Coordinates are approximate local WGS84
east/north coordinates in **feet**, with the complete conversion and source hash
in metadata. O’Connell and Langdon are transformed into this frame at load time
and linked through `src/data/outdoor/building-connections.json`.

The dataset retains mapped footways, stairs, and cycleways/service roads with
explicit pedestrian permission. It excludes indoor corridors, rough informal
trails, cycleways without explicit foot permission, and other vehicle roads.
Every included route has weight 1. Stair costs omit vertical rise. Accessibility
is false for stairs or explicit wheelchair prohibitions and otherwise unknown;
the graph does not provide an accessible-routing guarantee.

`src/data/outdoor/campus-preview.png` is the explicitly requested local review
artifact, not an application import or a commit artifact. Its 37 numbered areas
correspond to `src/data/outdoor/manual-review.md`, which links to OSM ways and
explains disconnected sections, excluded routes, service roads, and mixed
stair/ramp tags. Node-level barriers and access tags remain unavailable: the
single supplemental Overpass request timed out. This is a whole-map review issue,
including routes outside the numbered areas.

Regenerate from the existing `campus-osm.json` source, without network requests:

```sh
node tools/outdoor/generate-campus-graph.mjs
node tools/outdoor/render-campus-preview.mjs
npx prettier --write src/data/outdoor/campus.json src/data/outdoor/manual-review.md
```

The preview tool reuses the machine-local `@napi-rs/canvas` installation documented
in the floor-plan skill. Set `CLASSFINDER_PDF_TOOLS` to that tool directory on
another machine; no application dependency was added. Filter outdoor snapping
saved outdoor nodes use `buildingId: null`; loaded candidates use
`buildingId === 'outside'` and `floorId === 0` under the current loader. The existing
building-oriented instruction adapter is unchanged; use the graph and Dijkstra
directly for outdoor-only paths.

### O’Connell–Langdon alignment and route verification

`src/graph/campusAlignment.json` defines the global origin (existing outdoor OSM
node 4715296203 at 39.7276776, -121.8456054), the building similarity transforms,
matched landmarks, and fitting errors. `src/graph/coordinates.ts` applies each
building's rotation, uniform scale and translation before the loader creates any
edges. Runtime nodes contain only global positions; all floors of each building
use the same transform. An unrecognized building alignment fails explicitly;
all 12 building IDs, including Holt, are now registered with no exclusions.

O’Connell uses three matched AO doorway endpoints: scale **1.11667**, rotation
**39.03°**, maximum fitting error **3.60 feet**. Langdon uses seven matched
architectural corners: scale **1.00393**, rotation **41.35°**, maximum error
**4.01 feet**. The O’Connell scale correction is substantial and remains a manual
review item. It changes all loaded O’Connell distances, including transfers;
indoor source coordinates and original PDF transforms remain unchanged.

Seven bidirectional entrance links connect O’Connell's three AO doors, Langdon's
loading-dock approach, and all three Langdon gates. The user confirmed the entire
courtyard between the gates and the tested O’Connell doors is walkable
(2026-10-25). Three outdoor approaches sit approximately five feet outside the
gate midpoints, joined parallel to the fence and to existing OSM nodes at both
ends. Only existing gates cross the fence. Approach geometry is schematic;
accessibility remains unspecified. The connection file adds three nodes and
eleven undirected edges.

The route from `ocon-1-room-124` to `lang-1-room-120` and back is now **387.97
feet**, 27 edges each way, using real Dijkstra and the production loader. It
enters through the east gate without stairs, replacing the initial 744.30-foot
dock route. The full loaded graph has 1,778 nodes and 3,948 directed edges.
Indoor source geometry and alignment transforms are unchanged.

`src/data/outdoor/ocon-lang-preview.png` shows only the ground-floor building
graphs and relevant outdoor nodes in global coordinates, with the tested route
highlighted and entrance links labelled A–G (E–G mark gates). `ocon-lang-route.md` lists each edge
and registration concerns. The older full-campus preview describes the original
outdoor-only snapshot. PNG previews are local review artifacts, not imports or
commit artifacts.

Regenerate the alignment, links, and loaded-data preview offline:

```sh
node tools/outdoor/align-buildings.mjs
node tools/outdoor/render-connected-preview.mjs
npx vitest run tests/unit/campusAlignment.test.ts
```

The preview tool uses Vite's SSR module loader to execute the actual graph loader
and Dijkstra without loading the application UI or starting a listening server.
No application dependencies, routing algorithms, or UI controls were added.

Outdoor map data © OpenStreetMap contributors, distributed under
[ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/); see
[OSM copyright](https://www.openstreetmap.org/copyright). Include attribution when
displaying or redistributing the derived outdoor data. This does not relicense
independent indoor datasets or application code. The preview uses local vector
data and downloads no map tiles. Supplemental collection follows the
[Overpass usage guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html).

## Getting Started

### Prerequisites

1. Install [Git](https://git-scm.com/downloads) and confirm `git --version` works.
2. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows or macOS, or Docker Engine on Linux. Confirm `docker version` and `docker compose version` work.
3. Install a current browser. A code editor with TypeScript support is recommended.

Node.js and npm run inside the development container. The image is pinned to Node.js 22.14.0; update it deliberately to a supported LTS line.

### Install dependencies

On a host with Node.js 22 LTS installed, run:

```sh
npm ci
```

Or start the development environment with Docker:

```sh
docker compose up --build
```

The container bind-mounts the repository and keeps `node_modules` in a named volume. Stop it with:

```sh
docker compose down
```

### Verify the infrastructure

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run coverage
npm run test:e2e
npm run test:smoke
docker compose config
```

Unit tests cover graph loading and routing. UI and end-to-end coverage must be
added as application flows are implemented.

## GitHub configuration

The release workflow deploys version tags to GitHub Pages. Before its first release, enable GitHub Pages with **GitHub Actions** as the source and create/protect the `production` environment if an approval gate is wanted. No deployment secret is required for GitHub Pages; the workflow uses GitHub's scoped `GITHUB_TOKEN` permissions.

## Troubleshooting

- **`docker` is not recognized or the daemon is unavailable:** Start Docker Desktop (or the Docker service) and rerun `docker version`.
- **Dependency install fails:** Use Node.js 22 LTS and rerun `npm ci`; do not mix npm with another package manager.
- **Port is already in use:** Stop the process using the future Vite development port or change the Compose port mapping when application development begins.
- **Docker reports an npm permission error:** Recreate the dependency volume after a prior run created it with root ownership:

  ```sh
  docker compose down -v
  docker compose up --build
  ```

  The `-v` removes only the local `node_modules` volume; dependencies will be installed again from `package-lock.json`.

- **GitHub Pages deployment fails:** Confirm Pages is enabled for GitHub Actions and that the repository allows the workflow's `pages: write` and `id-token: write` permissions.

### Additional campus entrance alignments

Acker, Ayres, Trinity and Yolo now have campus transforms and 52 exterior doorway
connections. Source coordinates remain local. These approximate registrations and
map-inferred approaches are documented in
[src/data/outdoor/entrance-alignment-review.md](src/data/outdoor/entrance-alignment-review.md).
Regenerate with `node tools/outdoor/align-campus-entrances.mjs`;
`node tools/outdoor/render-entrance-verification.mjs` creates temporary review
overlays in `/tmp`. All 12 building IDs now have transforms and the full campus loader succeeds.
No runtime exclusions are present.

Butte, Glenn, Holt, Modoc, Plumas and Tehama are also aligned and connected through
41 exterior doorways and two Modoc yard gates. The full graph has 4,915 nodes and
10,774 directed edges. The linked review inventory documents all 92 direct added
portal links, the three Modoc doors that use its gates, and approximate geometry.
The new tests use the production loader and real Dijkstra in both directions.

### Holt first-floor review

The user-confirmed stair-room passages have been restored using the current
PDF origin. First floor now has 193 nodes, 208 undirected edges and one indoor
component. The [requested preview](src/data/holt/floor-1-preview.png) highlights
restored regions H1–H3 and the former isolated southeast landing. Regenerate with
`node tools/indoor/render-holt-first-floor.mjs`. The PNG is a local review artifact
and should not be committed.

### All-building route verification

`npx vitest run tests/unit/dijkstras.test.ts` checks all 132 ordered pairs across
12 buildings using fixed indoor endpoints, the production graph loader, and real
Dijkstra. Each returned edge must exist in the loaded adjacency list, form a
continuous route, and reach its destination through the outdoor graph.
`tools/routing/campus-endpoints.json` records the representative endpoints; this
check does not assert that every room belongs to the connected component.

Run `node tools/routing/render-campus-routes.mjs` to generate the local
[route gallery](artifacts/campus-routes/index.html), twelve PNGs (one starting
building with eleven differently colored outgoing routes), and `routes.json`
with every traversal and distance. The offline renderer uses the existing
machine-local canvas installation (`CLASSFINDER_PDF_TOOLS` can override it).
`tools/routing/map-registration.json` records the manual footprint landmarks used
to fit `open-street-view-map.png`; this display registration does not modify graph
coordinates. Shared routes use slight parallel offsets for visibility. Numbered
review markers identify inferred entrance approaches. These are connectivity
review artifacts, not assertions of current physical access or accessibility.
Generated gallery files are ignored by git.

Plumas floors 2–3 now connect through both stair cores and the east elevator,
verified against their source PDFs. `tests/unit/plumasGraph.test.ts` checks all
three two-way transfers and routes from campus to all 82 third-floor nodes and
back. Elevator availability/access remains unknown; costs still omit vertical
rise and waiting time.
