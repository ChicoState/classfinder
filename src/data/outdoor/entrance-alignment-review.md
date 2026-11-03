# Campus entrance alignment review — 2026-10-28

All 12 indoor building IDs now have transforms in `src/graph/campusAlignment.json`.
Each transform applies to every floor before runtime distances are computed;
indoor source JSON stays unchanged. The full graph loads 4,915 nodes and 10,774
directed edges, with no exclusions.

This extension connects ten buildings through 92 explicit outdoor portal links,
including two Modoc yard gates. Three Modoc yard doorways reach campus through
the existing yard circulation and gates, bringing the tested inventory to 95
portals/doorways. The seven older O’Connell/Langdon entrance links remain in
`building-connections.json`.

| Building | Direct outdoor links | Yard doors via gates |   Scale | Rotation | Max landmark residual (ft) |
| -------- | -------------------: | -------------------: | ------: | -------: | -------------------------: |
| acker    |                   25 |                    0 | 0.98043 |   30.34° |                       7.18 |
| ayres    |                   10 |                    0 | 1.00301 | -138.76° |                       6.50 |
| trinity  |                    7 |                    0 | 1.01348 |  -48.00° |                       6.88 |
| yolo     |                   10 |                    0 | 1.00752 |   28.47° |                       6.08 |
| butte    |                   12 |                    0 | 0.99059 |  -60.78° |                       1.33 |
| glenn    |                    8 |                    0 | 0.99893 |  -49.10° |                       0.52 |
| modoc    |                    6 |                    3 | 1.02263 |   29.85° |                       4.24 |
| tehama   |                    4 |                    0 | 0.97429 |  -60.91° |                       6.92 |
| holt     |                    7 |                    0 | 0.99245 |  -60.89° |                       1.53 |
| plumas   |                    3 |                    0 | 1.00705 |   29.25° |                       0.55 |

Fits use corresponding source PDF exterior corners and OSM footprint vertices.
The eight-foot review limit accommodates differences between dated drawings and
OSM, including covered first-floor approaches versus roof outlines. Existing
O’Connell/Langdon limits remain unchanged. These are approximate registrations,
not surveyed locations or current access/accessibility certifications.

`tools/outdoor/entrance-alignment.json` records the first four registrations and
entrance inventories. `remaining-alignment.json` records the six later fits;
`remaining-entrances.json` records their doorway inventories and Modoc fence.
All are under `tools/outdoor`. Exact native PDF positions, OSM vertex indices,
source paths, hashes and per-anchor residuals are saved for reproducibility.
Local floor metadata records source dates, scales, origins and floor alignment.

## Missing OSM relation geometry

The original collector queried building-tagged ways, omitting the untagged outer
members of Holt relation 7031762 and Plumas relation 7029746. The small source
extract `tools/outdoor/remaining-footprints-osm.json` records their outer ways,
node coordinates, relation IDs, versions, timestamps, direct OSM API URL and
ODbL attribution. It was retrieved on 2026-10-28; the saved outer/relation versions
predate the campus snapshot. It supplies alignment and obstacle evidence only;
it does not replace the outdoor routing snapshot or add OSM indoor shortcuts.

## Doorway and approach interpretation

All new approaches are inferred from `campusmap.png` under the user's campus
walkability guidance. Each has a stable `ENT-<BUILDING>-NN` review ID, date,
location, affected node/edge IDs and source provenance in
`entrance-connections.json`. Current access and accessibility remain unknown;
no accessible flags are added. Initial outward segments are 5–27 feet and
include registration and covered-approach differences; each length is recorded.

- Acker includes the six exterior-only north rooms, west storage and annex door.
  Its second-floor covered walkway reaches outdoors through existing stairs.
- Ayres includes exterior-only rooms 129A/B and studio doors. Enclosed courtyard
  doors retain their existing source circulation.
- Butte includes the four exterior classroom doors and both room-150 south doors.
  Roof coverage exceeds the ground-floor built outline in places; approach
  geometry is provisional beneath that coverage.
- Glenn includes the two unnumbered north facade doors and exterior-only 108C.
- Holt includes all seven ground-floor exits, including separate stair-room exits.
  No new same-floor stair bypass or indoor corridor is invented.
- Modoc has four building exits plus two yard gates connected explicitly. Yard
  doors 125, 129 and 131 use existing source circulation to those gates. The
  source fence is modeled as a barrier; the southwest gate connects to the
  outdoor approach east of the building instead of cutting back through the yard.
  Normal shortest routes can also use the building's other entrances.
- Plumas has east, west and south links. Roof projections around stair entrances
  are treated as covered-approach differences; no direct courtyard shortcut.
- Tehama has north, south and both western entrance links.

Interior approach nodes containing 'exit' in their name are not extra exterior
portals. Alignment and entrance links preserve indoor geometry and transfers. A later
Holt correction restored ten approach/junction nodes and fifteen corridor/door
links under the prior user-confirmed stair-room walkability: its first-floor
graph now has one component. Missing floor-to-floor transfers elsewhere are
not repaired by campus entrance links.

## Obstacles and provisional geometry

Visibility paths avoid building footprints, mapped fence/wall lines and streams.
Holt/Plumas relation outer members are included as building obstacles. Modoc's
source-shown fence is an additional barrier with openings at existing gates.
Fence endpoints and corners cannot be crossed as shortcuts.

The broad OSM Physical Education footprint fills the open area west of Acker's
narrow annex; the Ayres footprint fills the exterior gap north of studio 120.
Their source-derived obstacle overrides, exact polygons and reasons remain in
config and output metadata. These provisional areas deserve particular review.
Geometry checks cannot establish the absence of unmapped obstacles.

Targets belong to the outdoor component containing the campus origin. The
short initial doorway segment follows the source doorway side; subsequent
segments are checked against modeled obstacles. Paths are selected offline,
not by a runtime proximity rule.

## Regeneration and verification

```sh
node tools/outdoor/align-campus-entrances.mjs
node tools/outdoor/render-entrance-verification.mjs
npm test -- tests/unit/entranceAlignment.test.ts tests/unit/remainingAlignment.test.ts
node tools/outdoor/entrance-paths.test.mjs
```

The generator fits all ten added registrations before regenerating their links.
`align-buildings.mjs` regenerates O’Connell/Langdon then runs this extension.
`align-remaining-buildings.mjs` regenerates just the six additional transforms;
run the entrance generator after changing any alignment input.
No generation step uses the network or new dependencies.

Temporary overlays at `/tmp/<building>-entrance-review.png` label every inferred
approach. Purple outlines mark source obstacle corrections; magenta marks
Modoc's fence. All six source/footprint overlays and entrance overlays were
inspected. No official PNG previews under `src/data` were updated.

The production-loader tests verify every saved node, two directed edges per
serialized edge, globally transformed positions and finite distances. Real
Dijkstra verifies all 92 direct portals in both directions and the three Modoc
legacy yard doors through existing gate circulation. Geometry tests verify wall
and fence detours and rejection of a path through a closed fence.

All graph integration and Holt first-floor tests pass; the adapter suite cannot parse
the pre-existing unfinished `while` at `src/pathingAdapter.ts:158`. Coverage is
blocked by the same failures. Changed code passes ESLint and Prettier; smoke
checks and Docker configuration validation pass. E2E exits successfully with no
implemented tests. Existing repository format/lint/typecheck/build errors remain
(workflow YAML, unused App import, adapter syntax and unresolved `react-router`).

## Entrance inventory

| Review ID      | Source portal                                      | Outdoor target              |
| -------------- | -------------------------------------------------- | --------------------------- |
| ENT-ACKER-01   | `acker-1-exit-lobby-east-ao`                       | `outdoor-0-osm-5862340690`  |
| ENT-ACKER-02   | `acker-1-exit-lobby-south-1`                       | `outdoor-0-osm-5862340689`  |
| ENT-ACKER-03   | `acker-1-exit-lobby-south-2`                       | `outdoor-0-osm-5862340689`  |
| ENT-ACKER-04   | `acker-1-exit-lobby-south-3`                       | `outdoor-0-osm-5862340689`  |
| ENT-ACKER-05   | `acker-1-exit-gym-west-north-1`                    | `outdoor-0-osm-12016040164` |
| ENT-ACKER-06   | `acker-1-exit-gym-west-north-2`                    | `outdoor-0-osm-12016040164` |
| ENT-ACKER-07   | `acker-1-exit-gym-west-north-3`                    | `outdoor-0-osm-12012115813` |
| ENT-ACKER-08   | `acker-1-exit-gym-west-north-4`                    | `outdoor-0-osm-12012115813` |
| ENT-ACKER-09   | `acker-1-exit-gym-west-south-1`                    | `outdoor-0-osm-12847941565` |
| ENT-ACKER-10   | `acker-1-exit-gym-west-south-2`                    | `outdoor-0-osm-12847941565` |
| ENT-ACKER-11   | `acker-1-exit-gym-west-south-3`                    | `outdoor-0-osm-12847941565` |
| ENT-ACKER-12   | `acker-1-exit-gym-west-south-4`                    | `outdoor-0-osm-12847941565` |
| ENT-ACKER-13   | `acker-1-storage-west-exterior-door`               | `outdoor-0-osm-12847941565` |
| ENT-ACKER-14   | `acker-1-room-151`                                 | `outdoor-0-osm-5849876256`  |
| ENT-ACKER-15   | `acker-1-room-152`                                 | `outdoor-0-osm-5849876256`  |
| ENT-ACKER-16   | `acker-1-room-153`                                 | `outdoor-0-osm-12013138474` |
| ENT-ACKER-17   | `acker-1-room-154`                                 | `outdoor-0-osm-12013138474` |
| ENT-ACKER-18   | `acker-1-room-155`                                 | `outdoor-0-osm-12012115817` |
| ENT-ACKER-19   | `acker-1-room-156`                                 | `outdoor-0-osm-12012115817` |
| ENT-ACKER-20   | `acker-1-exit-southeast-ao`                        | `outdoor-0-osm-10123191877` |
| ENT-ACKER-21   | `acker-1-exit-locker-south`                        | `outdoor-0-osm-313659073`   |
| ENT-ACKER-22   | `acker-1-unnumbered-annex-northwest-exterior-door` | `outdoor-0-osm-313659073`   |
| ENT-ACKER-23   | `acker-1-exit-annex-west`                          | `outdoor-0-osm-10123191881` |
| ENT-ACKER-24   | `acker-1-exit-annex-south`                         | `outdoor-0-osm-10123191881` |
| ENT-ACKER-25   | `acker-1-exit-127-north`                           | `outdoor-0-osm-10123191877` |
| ENT-AYRES-01   | `ayres-1-entrance-northwest`                       | `outdoor-0-osm-5861595679`  |
| ENT-AYRES-02   | `ayres-1-entrance-southwest`                       | `outdoor-0-osm-5849825626`  |
| ENT-AYRES-03   | `ayres-1-room-121-exterior`                        | `outdoor-0-osm-5849825626`  |
| ENT-AYRES-04   | `ayres-1-room-129-exterior`                        | `outdoor-0-osm-12062031833` |
| ENT-AYRES-05   | `ayres-1-room-129A`                                | `outdoor-0-osm-12062031833` |
| ENT-AYRES-06   | `ayres-1-room-129B`                                | `outdoor-0-osm-12062031833` |
| ENT-AYRES-07   | `ayres-1-entrance-studio-south`                    | `outdoor-0-osm-4715296150`  |
| ENT-AYRES-08   | `ayres-1-entrance-southeast`                       | `outdoor-0-osm-5849825627`  |
| ENT-AYRES-09   | `ayres-1-entrance-studio-120B`                     | `outdoor-0-osm-471730317`   |
| ENT-AYRES-10   | `ayres-1-room-130-east`                            | `outdoor-0-osm-4715296178`  |
| ENT-TRINITY-01 | `trinity-1-exit-east-ao`                           | `outdoor-0-osm-5849825649`  |
| ENT-TRINITY-02 | `trinity-1-exit-west-middle`                       | `outdoor-0-osm-12062291671` |
| ENT-TRINITY-03 | `trinity-1-exit-west-north`                        | `outdoor-0-osm-12062291672` |
| ENT-TRINITY-04 | `trinity-1-exit-west-south`                        | `outdoor-0-osm-12062291671` |
| ENT-TRINITY-05 | `trinity-1-exit-west-stair`                        | `outdoor-0-osm-12062291670` |
| ENT-TRINITY-06 | `trinity-1-exit-main-west`                         | `outdoor-0-osm-12062291674` |
| ENT-TRINITY-07 | `trinity-1-exit-south-ao`                          | `outdoor-0-osm-12291397691` |
| ENT-YOLO-01    | `yolo-1-exit-north-ao`                             | `outdoor-0-osm-12847941558` |
| ENT-YOLO-02    | `yolo-1-exit-142-north`                            | `outdoor-0-osm-12012115821` |
| ENT-YOLO-03    | `yolo-1-exit-east-wing-north`                      | `outdoor-0-osm-12012115822` |
| ENT-YOLO-04    | `yolo-1-exit-south-ao`                             | `outdoor-0-osm-7701180205`  |
| ENT-YOLO-05    | `yolo-1-exit-112-west`                             | `outdoor-0-osm-7700051609`  |
| ENT-YOLO-06    | `yolo-1-exit-109-west`                             | `outdoor-0-osm-7700051607`  |
| ENT-YOLO-07    | `yolo-1-exit-145-east`                             | `outdoor-0-osm-10123191883` |
| ENT-YOLO-08    | `yolo-1-exit-150-east`                             | `outdoor-0-osm-12012115822` |
| ENT-YOLO-09    | `yolo-1-exit-155-east`                             | `outdoor-0-osm-12012115822` |
| ENT-YOLO-10    | `yolo-1-exit-166-east`                             | `outdoor-0-osm-12012115822` |
| ENT-BUTTE-01   | `butte-1-exit-north-east-ao`                       | `outdoor-0-osm-12217013243` |
| ENT-BUTTE-02   | `butte-1-exit-north-west`                          | `outdoor-0-osm-12217013243` |
| ENT-BUTTE-03   | `butte-1-room-101-exterior-door`                   | `outdoor-0-osm-12217013244` |
| ENT-BUTTE-04   | `butte-1-room-103-exterior-door`                   | `outdoor-0-osm-13043534417` |
| ENT-BUTTE-05   | `butte-1-exit-west-stairs`                         | `outdoor-0-osm-13043534416` |
| ENT-BUTTE-06   | `butte-1-room-102-exterior-door`                   | `outdoor-0-osm-12217013241` |
| ENT-BUTTE-07   | `butte-1-room-104-exterior-door`                   | `outdoor-0-osm-5447422344`  |
| ENT-BUTTE-08   | `butte-1-exit-east-service`                        | `outdoor-0-osm-5447422344`  |
| ENT-BUTTE-09   | `butte-1-exit-southeast-stairs`                    | `outdoor-0-osm-12016281796` |
| ENT-BUTTE-10   | `butte-1-exit-south-ao`                            | `outdoor-0-osm-12333501185` |
| ENT-BUTTE-11   | `butte-1-room-150-south-west-door`                 | `outdoor-0-osm-12333501189` |
| ENT-BUTTE-12   | `butte-1-room-150-south-east-door`                 | `outdoor-0-osm-12333501188` |
| ENT-GLENN-01   | `glenn-1-entrance-north`                           | `outdoor-0-osm-5849876274`  |
| ENT-GLENN-02   | `glenn-1-unnumbered-northwest-door`                | `outdoor-0-osm-5849876274`  |
| ENT-GLENN-03   | `glenn-1-unnumbered-north-middle-door`             | `outdoor-0-osm-5849876274`  |
| ENT-GLENN-04   | `glenn-1-entrance-west`                            | `outdoor-0-osm-12141514200` |
| ENT-GLENN-05   | `glenn-1-entrance-106B-west`                       | `outdoor-0-osm-12141514200` |
| ENT-GLENN-06   | `glenn-1-entrance-108C-west`                       | `outdoor-0-osm-5447420618`  |
| ENT-GLENN-07   | `glenn-1-entrance-east`                            | `outdoor-0-osm-3641807009`  |
| ENT-GLENN-08   | `glenn-1-entrance-south`                           | `outdoor-0-osm-5849876272`  |
| ENT-MODOC-01   | `modoc-1-exit-north-wheelchair`                    | `outdoor-0-osm-5849825638`  |
| ENT-MODOC-02   | `modoc-1-exit-southwest-ao`                        | `outdoor-0-osm-12062170254` |
| ENT-MODOC-03   | `modoc-1-exit-southeast-wheelchair`                | `outdoor-0-osm-12062170239` |
| ENT-MODOC-04   | `modoc-1-exit-east-landing`                        | `outdoor-0-osm-7698079280`  |
| ENT-MODOC-05   | `modoc-1-gate-yard-north`                          | `outdoor-0-osm-7708714098`  |
| ENT-MODOC-06   | `modoc-1-gate-yard-southwest`                      | `outdoor-0-osm-7698079280`  |
| ENT-TEHAMA-01  | `tehama-1-exit-north-ao`                           | `outdoor-0-osm-12062081754` |
| ENT-TEHAMA-02  | `tehama-1-exit-west-north`                         | `outdoor-0-osm-5447257029`  |
| ENT-TEHAMA-03  | `tehama-1-exit-west-south`                         | `outdoor-0-osm-5849844046`  |
| ENT-TEHAMA-04  | `tehama-1-exit-south`                              | `outdoor-0-osm-5862340473`  |
| ENT-HOLT-01    | `holt-1-exit-south-ao`                             | `outdoor-0-osm-5849779141`  |
| ENT-HOLT-02    | `holt-1-exit-south-west`                           | `outdoor-0-osm-5849779141`  |
| ENT-HOLT-03    | `holt-1-exit-north-ao`                             | `outdoor-0-osm-5849825631`  |
| ENT-HOLT-04    | `holt-1-exit-west-south`                           | `outdoor-0-osm-5849825632`  |
| ENT-HOLT-05    | `holt-1-exit-west-north`                           | `outdoor-0-osm-12057911483` |
| ENT-HOLT-06    | `holt-1-exit-east-south`                           | `outdoor-0-osm-5849825629`  |
| ENT-HOLT-07    | `holt-1-exit-east-north`                           | `outdoor-0-osm-5861595673`  |
| ENT-PLUMAS-01  | `plumas-1-exit-east-ao`                            | `outdoor-0-osm-12062081747` |
| ENT-PLUMAS-02  | `plumas-1-exit-west`                               | `outdoor-0-osm-10123331542` |
| ENT-PLUMAS-03  | `plumas-1-exit-south`                              | `outdoor-0-osm-5849825660`  |

Modoc yard doors via gates: `modoc-1-exit-125-yard`, `modoc-1-exit-129-yard`, `modoc-1-exit-131-yard`.
