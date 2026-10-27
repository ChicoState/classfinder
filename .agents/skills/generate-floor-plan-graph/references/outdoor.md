# CSU Chico outdoor graph

## Scope and provenance

User requested core-campus general walking, outdoor graph first, no building
connections or building alignment. A final annotated preview was explicitly
requested on 2026-10-25. Source: root `campus-osm.json`, Overpass snapshot
2026-10-21T19:49:22Z, collected by the existing
`scripts/fetch-osm-campus-map.mjs`. The source contains 855 ways, including 691
highway ways, with complete way node IDs and geometry but no standalone nodes.
The source SHA-256 is recorded in generated metadata.

`open-street-view-map.png` was inspected as context; it is a rendered OSM map,
not street photography or an independent survey. No graph links were inferred
from apparent intersections or traced from screenshot pixels. Some building
outlines, including Holt's named outline, are absent from the way-only export;
do not treat missing background footprints as absent buildings. No building
alignment was assessed.

## Coordinates and topology

- Dataset: `src/data/outdoor/campus.json`; auto-discovered by the existing loader.
- 1,310 nodes, 1,449 stored two-way edges, 548 included source ways, 143 excluded
  highway ways. Components have 1,224, 44, 12, 8, 7, 5, 4, 2, 2, and 2 nodes.
- IDs: `outdoor-0-osm-<OSM node ID>`. Newly selected outdoor identity convention:
  `buildingId: null`, `floorId: 0`, retaining the existing numeric floor contract.
- Units: feet. Positive X east, Y north. Origin: OSM node 4715296203,
  latitude 39.7276776, longitude -121.8456054. It is an existing footway point,
  not an indoor entrance or a calibration landmark for any building.
- Local WGS84 linearization uses meridional and prime-vertical radii at 39.73°N,
  with exact inverse-foot conversion and saved constants/formula in metadata.
  Coordinates rounded to 0.01 feet; approximate horizontal geometry, not surveyed
  precision. No indoor coordinates changed and no campus-meter migration made.
- RDP tolerance 0.5 feet removes negligible deviations while keeping shared
  source highway nodes and endpoints. No snapping, grids, wall crossings, or
  proximity-based joins. Each edge has weight 1 and runtime Euclidean distance.
- General footways and stairs retained unless restricted. Cycleways/service
  roads require explicit pedestrian permission. Mode-specific permission takes
  precedence over general access. Indoor corridors, rough/informal trails,
  unverified cycleways, and ordinary vehicle roads excluded. Outlying fragments
  remain recorded rather than silently discarded or joined.
- Stairs use `stairs`, accessibility false, including co-tagged ramps pending
  review. Explicit wheelchair prohibitions are false; all other accessibility
  flags omitted. No accessible-routing guarantee; stair distances omit rise.

## Manual review and collection attempt

37 numbered areas in `src/data/outdoor/manual-review.md` and the explicitly
requested `campus-preview.png` identify disconnected components, excluded indoor
shortcuts/trails, cycleway permission gaps, service roads and mixed stairs/ramps.
Purple lines show all disconnected components even where a centroid marker does
not cover their full extent. Markers are issue centers, not exhaustive verified
boundaries. Every route still lacks node-level gate/barrier/access evidence.

User approved retrieving missing data after checking OSM policy. Reviewed
https://dev.overpass-api.de/overpass-doc/en/preface/commons.html and
https://osmfoundation.org/wiki/Attribution_Guidelines. A single historical
Overpass query for nodes of the existing highway ways used a named User-Agent,
25-second server timeout, 16 MiB resource request and 40-second client timeout.
The client timed out without receiving supplemental data. No automatic retries,
parallel downloads, tile downloads or production-service dependency.

Outdoor derived data carries ODbL-1.0 attribution and copyright/license links in
metadata, README, review notes and preview. No claim is made about current
closures, opening hours, gates or entrance permissions.

## Regeneration and validation

`tools/outdoor/generate-campus-graph.mjs` runs offline against the saved source.
`tools/outdoor/render-campus-preview.mjs` renders the final saved JSON and local
OSM background using the existing machine-local canvas installation. Override
its tool directory with `CLASSFINDER_PDF_TOOLS`. Final previews require explicit
permission in each future task. Keep previews out of commits.

Tests cover source provenance, physical scale, shared junction retention,
undirected expansion, finite geometry, optional attributes, independent loads,
component reachability and separation, outdoor snapping and absence of indoor
connections. Record actual final check results in the task handoff; do not
silently repair unrelated application or infrastructure failures.

Final checks (2026-10-25): all 44 tests passed across 7 files. Coverage passed
with 92.02% lines, 92.25% statements, 89.70% branches and 85.71% functions.
Changed files passed targeted Prettier and ESLint checks. Infrastructure smoke
checks and `docker compose config` passed; no containers were started. E2E exited
successfully with no tests and does not establish browser-flow coverage. The
production build failed because existing app imports cannot resolve
`react-router`. Full typecheck additionally reports the existing `usemap` JSX
attribute in `src/Appbackup.tsx`. Full lint reports the existing unused `Link`
import in `src/App.tsx`. Repository-wide formatting is blocked by malformed YAML
at `.github/workflows/pr-checks.yml:34` and existing formatting in source/input
files. These unrelated files were not changed. The PNG was visually inspected
against saved graph geometry and local OSM background.

## Subsequent building integration (2026-10-25)

The user subsequently authorized global alignment for `ocon`/`lang`, explicit
outdoor connections, a loaded Dijkstra check and a combined graph-only preview.
They explicitly chose to omit unaligned Holt. Source `campus.json` still records
10 outdoor-only components; its initial "no building connections" scope above
is historical. Four separate edges in `building-connections.json` connect the
three O’Connell AO doors and Langdon's existing loading-dock south approach.

The outdoor origin remains global zero. All registered indoor nodes are
transformed at load time into the same east/north feet frame, using
`src/graph/campusAlignment.json` and `coordinates.ts`. Source indoor JSON remains
unchanged. No alignment was attempted for Holt, and no mixed-frame Holt nodes
are returned. The full loaded graph has 1,775 nodes and 3,934 directed edges.

The actual Vite-loaded loader and Dijkstra generate
`src/data/outdoor/ocon-lang-preview.png` and `ocon-lang-route.md`: room 124 in
O’Connell to room 120 in Langdon and back, 744.30 feet and 26 edges. The preview
uses graph geometry only, shows first floors plus relevant outdoor nodes, and
labels entrances A–D. No building/background image, proximity-created join,
unconfirmed north door, or new fence crossing was added. Unmatched entrances
remain unlinked; the route includes stairs and an exterior detour. Higher floors
are registered with the same per-building transform and tested, not stacked in
the ground-floor preview.

O’Connell scale 1.11667 and maximum residual 3.60 feet are material manual-review
items. Langdon scale 1.00393, maximum residual 4.01 feet. Exact source landmark
coordinates, source hashes and residuals are stored in the alignment JSON.
`tools/outdoor/align-buildings.mjs` reproduces calibration/links.
`tools/outdoor/render-connected-preview.mjs` executes actual runtime code through
Vite SSR in middleware mode with WebSocket, watchers and dependency discovery
disabled; it closes Vite after rendering. No additional network data was fetched.

The user explicitly excluded all runtime display and UI changes from this task.
The proposed floor-plan viewer compatibility fix (inverse display transform and
building filter) is out of scope, not pending approval. UI code is unchanged.

Integration validation: all 49 tests across 8 files passed. Coverage passed
(92.66% lines, 92.94% statements, 90.00% branches, 86.11% functions). Changed
runtime/tools/tests/data/docs passed targeted ESLint/Prettier checks and
`git diff --check`. Smoke checks and Compose configuration passed. E2E exited
successfully with no tests. Full build/typecheck remain blocked by the existing
missing `react-router` imports and `usemap` JSX typo; full lint by the existing
unused `Link`; full format by existing workflow YAML syntax and source/input
formatting. No dependencies, infrastructure, indoor source data, individual-floor
previews or UI components were changed. No containers or listening preview
services remain running.

## User-confirmed Langdon gate connections (2026-10-25)

User confirmed the entire area between Langdon's gates and the O’Connell doors
used by the test is walkable, authorizing all three gate connections. This
supersedes the earlier decision to leave the gates unlinked. The generator now
adds three global outdoor approach nodes, five feet outside the gate midpoints,
in `building-connections.json`. Two outdoor edges join them in fence order; two
more join existing OSM nodes 12217284216 (west) and 5862340697 (east/O’Connell
approach). Only the existing gate doorways cross the fence. The five-foot offset
and straight walking lines are approximate geometry within the user-confirmed
open area. Accessibility remains unspecified.

The connection file now contains 3 nodes / 11 undirected edges, including 7
entrance connections. Full runtime graph: 1,778 nodes / 3,948 directed edges.
O’Connell room 124 ↔ Langdon room 120 now uses the east gate: 387.97 feet,
27 edges, no stairs, equal cost in reverse. This replaces the original
744.30-foot dock route. Preview labels E–G mark the gates; the route report
records the confirmation and geometric assumptions. Source indoor JSON,
alignment coefficients, loader, routing algorithm and runtime display/UI were
not changed for this update. No new external requests or dependencies.

Gate-update verification: all 50 tests across 8 files and coverage passed
(92.66% lines). Changed files passed targeted lint/format and diff checks. Smoke
checks and Compose configuration passed; E2E exited successfully with no tests.
The same pre-existing missing `react-router`, JSX typo, unused import and
repository formatting/workflow failures still block full build/type/lint/format
checks. The refreshed graph-only PNG was visually inspected. No containers or
preview services were left running.

## General campus walkability guidance (2026-10-25)

The user subsequently stated that most areas around campus buildings are
walkable and authorized giving campus-map image analysis greater weight than
exact OSM coverage to fill apparent outdoor gaps. Such links are assumptions
unless individually confirmed: record their exact locations, affected graph
IDs, image evidence and reasoning under stable review IDs, and visibly mark
them in verification overlays and requested previews. The maintained procedure
is in `references/geographic-alignment.md` under "Map-informed outdoor
walkability". This replaces the earlier conservative requirement for exact OSM
support for every outdoor segment. It does not override visible barriers or
establish accessibility, and it does not authorize runtime display/UI changes.
This guidance-only update does not alter current graph data or previews.
