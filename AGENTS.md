# Agent Guidance

## Project status

This repository has an infrastructure foundation, a React application shell, and initial graph loading and routing logic. `infrastructure_plan.md` is the source of truth for platform and tooling decisions; class-entry and navigation user flows are not implemented yet.

## Repository map

- `infrastructure_plan.md`: approved infrastructure plan.
- `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`: TypeScript tooling.
- `Dockerfile`, `compose.yml`, `.dockerignore`: development container setup.
- `scripts/`: infrastructure smoke checks and the existing OSM source collector.
- `tools/outdoor/`: offline graph generation and engineering preview rendering; no network requests or new application dependencies.
- Outdoor walkability guidance: the user states most areas around campus buildings are walkable. Use campus-map image analysis to fill plausible open-area gaps even without exact OSM geometry. Give every inferred connection/area a stable review ID, record its location and affected node/edge IDs with image provenance in metadata/manual-review notes, and mark it in verification overlays and requested previews. See the graph skill's `references/geographic-alignment.md`. Respect visible obstacles; this does not establish accessibility or authorize runtime UI changes.
- `tests/unit`: graph loading, assembly, and Dijkstra tests. `tests/ui` and `tests/e2e`: reserved for future user-flow tests.
- `.github/workflows/`: pull-request and GitHub Pages release automation.
- `src/`: React application source, graph contracts and Dijkstra in `lib/`, and the graph loader in `graph/`.
- `src/data/<building-id>/*.json`: automatically discovered at build time by the loader; each file has `edges` and may have `nodes` (connection files need no nodes). Registered buildings are converted to global campus feet before two-way edges and distances are created. Unknown alignments fail; explicitly excluded buildings are omitted.
- `src/data/ocon/floor-1.json` through `floor-4.json`: bundled O'Connell graphs in approximately aligned, shared coordinates measured in feet. Undirected edges are stored once; the loader returns fresh maps and expands both directions.
- `src/data/ocon/connections.json`: adjacent-floor stairs and elevators. Distances derive from globally transformed endpoint coordinates; no transfer override. Filter starting-node candidates by building and floor before coordinate-based routing.
- `src/data/ocon/floor-*-preview.png`: local visual verification artifacts, not application imports or files to commit.
- `src/data/lang/floor-1.json` through `floor-3.json` and `connections.json`: Langdon Hall, from two PDFs (the second contains floors 2 and 3). Shared local feet coordinates; both stair cores connect adjacent floors. The elevator connects floors 1–2–3 with accessible transfers based on user confirmation (2026-10-14); entrance positions are approximate.
- `src/data/holt/floor-1.json`: Holt Hall first floor, from `Holt/holt-1.pdf` (2011-02-17), at 1 inch = 40 feet. Origin is the drawing-bottom AO doorway. User confirmed walkable paths through the stair rooms (2026-10-19); corridor edges connect the connector landings and north-east approaches into one component. No vertical transfers yet; only the two AO entrance edges assert accessibility. `floor-1-preview.png` is a requested local review artifact, not an application import or commit artifact.
- `src/pathingAdapter.ts`: coordinate-based instructions use global campus feet and accept an optional building ID, defaulting to `ocon`; pass `lang` for Langdon. Filter nearest-node candidates by building before floor-aware snapping. Cross-building routes use loaded nodes with Dijkstra directly.
- `src/graph/campusAlignment.json` and `coordinates.ts`: one runtime east/north campus frame in feet, origin at outdoor OSM node 4715296203. Load-time similarity transforms now cover all 12 indoor building IDs; all floors share their building transform. Source indoor JSON stays local for PDF comparisons. The user removed the `holt` exclusion (2026-10-28); Holt is now aligned and loaded (2026-10-28).
- `src/data/outdoor/campus.json`: provisional outdoor graph from `campus-osm.json` (2026-10-21 snapshot). 1,310 nodes, 1,449 undirected edges, 10 outdoor-only components. Outdoor identity is `buildingId: null`, numeric `floorId: 0`; IDs use `outdoor-0-osm-<OSM node ID>`. Coordinates define the global east/north feet frame with a documented WGS84 projection. `building-connections.json` adds three outdoor gate approaches and eleven undirected edges, including seven entrance links: O’Connell's three AO doors, Langdon's dock and three gates. User confirmed the courtyard between those gates and the tested O’Connell doors is walkable (2026-10-25). Gate approaches are approximately five feet outside the fence, joined to OSM nodes 12217284216 and 5862340697. Accessibility is unspecified; other campus barrier/access tags remain unavailable.
- `src/data/outdoor/campus-preview.png` and `manual-review.md`: explicitly requested review image and 37 numbered review areas. The PNG is a local artifact, not an application import or commit artifact. Regenerate with `node tools/outdoor/generate-campus-graph.mjs` then `node tools/outdoor/render-campus-preview.mjs`; the renderer reuses the floor-plan skill's machine-local canvas tools (`CLASSFINDER_PDF_TOOLS` can override the directory). Filter outdoor nearest-node candidates by null building and floor 0. The instruction adapter remains building-oriented.
- `src/data/outdoor/ocon-lang-preview.png` and `ocon-lang-route.md`: explicitly requested graph-only review and loaded Dijkstra traversal (O’Connell room 124 ↔ Langdon room 120, now 387.97 feet, 27 edges, through the east gate without stairs). Labels E–G mark gates. Regenerate with `node tools/outdoor/align-buildings.mjs` and `node tools/outdoor/render-connected-preview.mjs`. PNGs are local artifacts, not imports or commit artifacts. Alignment review limits remain O’Connell scale 1.11667 / max residual 3.60 feet, Langdon scale 1.00393 / max residual 4.01 feet. Full loaded graph now: 4,915 nodes / 10,774 directed edges (2026-10-28 extension). Other unmatched doors remain unconnected. Runtime display/UI changes are explicitly out of scope.
- `csuc-floor-plans/`: original reference PDFs for digitization.
- API/backend, database, and local services: not required by the plan.
- `.agents/skills/`: local skill instructions.

## Required reading and boundaries

Read `infrastructure_plan.md`, this file, and applicable local skill instructions before changing infrastructure. Do not alter plan decisions without revising the plan through the infrastructure-planning process. Do not commit secrets, generated artifacts, `node_modules`, coverage output, or Playwright reports.

Infrastructure-only work must not create product pages, components, routes, handlers, domain models, route data, authentication, or business tests. Application work should use the frontend UI, test-driven development, browser-testing, security, documentation, review, CI/CD, and git-workflow skills as applicable; use infra-planner before changing infrastructure decisions and infra-builder to implement an approved plan.

## Verification

Run the applicable commands before a change is handed off:

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

The pull-request workflow mirrors these checks when application files and tests exist. Run `docker compose down` after local container work; do not leave containers or volumes running unintentionally.

## Change checklist

- Keep npm as the sole package manager and retain `package-lock.json`.
- Keep Docker development-only; GitHub Pages receives static build output, never a production container.
- Add or update meaningful tests with application behavior, then enforce the coverage threshold selected in the plan.
- Update this file and `README.md` whenever commands, paths, services, or workflows change.
- Use documentation and code-review skills before merging material changes.

- Campus alignment extension (2026-10-28): `acker`, `ayres`, `trinity`, and `yolo` now have building-wide transforms and 92 direct ground-floor outdoor portal links plus three Modoc yard doorways via two existing gates in `src/data/outdoor/entrance-connections.json`. See `entrance-alignment-review.md` for provisional geometry, 8-foot landmark limits, source footprint overrides and review IDs. Regenerate with `node tools/outdoor/align-campus-entrances.mjs`; temporary labeled overlays: `node tools/outdoor/render-entrance-verification.mjs`. All remaining buildings are now aligned; no exclusions are present.

- Remaining alignment and entrances (2026-10-28): `butte`, `glenn`, `holt`, `modoc`, `plumas`, `tehama` have landmark-verified campus transforms. Their 41 exterior doorways and two Modoc gates reach the main campus component. Missing Holt/Plumas multipolygon evidence is saved in `tools/outdoor/remaining-footprints-osm.json`; generator inputs are `remaining-alignment.json` and `remaining-entrances.json`. `node tools/outdoor/align-campus-entrances.mjs` regenerates all ten added fits/links offline. Production-loader and Dijkstra tests cover all datasets; source indoor topology is unchanged.

- Holt floor-1 restoration (2026-10-28): 10 missing stair-room approach/junction nodes and 15 links restored from historical source evidence and prior user-confirmed walkability, rechecked against the PDF using current origin (355,682). All 193 floor-1 nodes / 208 undirected edges form one indoor component. Tests now use current parent-room IDs. Requested `src/data/holt/floor-1-preview.png` overlays H1–H3 and rings the former isolated southeast landing; regenerate with `node tools/indoor/render-holt-first-floor.mjs`. Local PNG, not an import or commit artifact.

- All-building routing review: `tests/unit/dijkstras.test.ts` verifies all 132 ordered pairs of the 12 indoor endpoints in `tools/routing/campus-endpoints.json` through the production loader and Dijkstra, including edge continuity and outdoor traversal. `node tools/routing/render-campus-routes.mjs` creates 12 combined route overlays and an HTML/JSON report under `artifacts/campus-routes/` (ignored local artifacts). Uses `open-street-view-map.png`, the display-only landmark registration in `tools/routing/map-registration.json`, and machine-local canvas tools. Colors/parallel lanes distinguish routes and numbered markers identify inferred ENT approaches. Does not prove all-room reachability or current physical access.

- Plumas third-floor integration (2026-11-03): corresponding west/east stair and east elevator transfers now connect floors 2–3 after visual comparison of both source PDFs. The former “floor 2 absent” limitation was stale. `tests/unit/plumasGraph.test.ts` checks the three two-way links and campus routes to all 82 third-floor nodes and back. Elevator access remains unknown. The loaded graph gains six directed edges (10,780 total); source floor topology is unchanged.
