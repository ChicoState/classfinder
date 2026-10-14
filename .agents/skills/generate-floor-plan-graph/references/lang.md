# Langdon Hall (`lang`)

Display name: Langdon Hall. Alias: Langdon. Source CAD IDs LANG-1 and LANG-2 establish the `lang` dataset ID; building number 28.

## Sources and inventory

- `csuc-floor-plans/Langdon/lang-1.pdf`: first floor, sheet 2 of 3.
- `csuc-floor-plans/Langdon/lang-2.pdf`: second floor in the lower plan, third floor in the upper plan, sheet 3 of 3. Filename numbering is not a floor inventory.
- Both sheets are dated September 2, 2010, with printed scale 1 inch = 30 feet.
- Native PDF pages: 612 × 792 points, rotation 0. Labels are vector outlines; text extraction is empty.
- Runtime files: `src/data/lang/floor-1.json`, `floor-2.json`, `floor-3.json`, and `connections.json`. Loader discovers these without an import change.
- No basement, roof, or other floor plan is supplied. UP/DN arrows alone do not establish routes to additional floors.

## Coordinates and alignment

Units are feet, at 30/72 feet per native PDF point. Positive X is drawing-right; positive Y is drawing-up, not geographic east/north. Manual doorway positions were inspected at 2.25 and 3 pixels per PDF point, with temporary overlays reconstructed from saved JSON.

Reference origin: `lang-1-exit-119-west`, west exterior doorway of room 119, native top-left PDF point `(105.33333333333333, 160)`; saved position exactly `(0, 0)`.

Transforms into the first-floor PDF coordinate system (before feet conversion):

| Floor |  PDF translation X |  PDF translation Y | Projected origin on source PDF |
| ----- | -----------------: | -----------------: | ------------------------------ |
| 1     |                  0 |                  0 | (105.33333333333333, 160)      |
| 2     | 1.3333333333333333 |                172 | (104, -12)                     |
| 3     | 1.3333333333333333 | 393.77777777777777 | (104, -233.77777777777777)     |

All use rotation 0 and scale factor 1. Negative projected Y on the upper-floor sheet is legitimate: the reference origin lies outside those cropped building footprints. Supporting landmarks are the elevator/crossed shaft block, east stair core, and west/east exterior walls. At 2.25 pixels per point the first-floor south wing starts near X=107 and upper-floor wings near X=104; the elevator frontage is near Y=1209, 823, and 324 respectively. A roughly 1 pixel residual remains in vertical alignment. This is approximate manual registration, not a survey or GPS calibration.

## Topology and access

Separate east and west stair cores connect 1–2 and 2–3 only: four serialized transfer edges. Landings have their shown plan-view coordinates. No transfer-distance override is stored; runtime costs omit vertical rise and stair effort and can be very small. No accessibility claim is made: stair edges are false; other accessibility flags are omitted.

Elevator shafts are labelled on all floors but enclosed without explicit drawn door openings. They and the crossed shaft beside them are excluded from routing pending doorway evidence. Wheelchair symbols at first-floor toilets/elevator do not establish accessible paths.

First floor:

- 121A is inside 121; 122A/B inside 122; 121 also opens to 119.
- 119A/B are inside 119; 119B has a second door to 118.
- 118A uses its small vestibule from 118; 118B and the north custodial room open onto the spine corridor.
- 117A is inside 117; 117 also opens into 116.
- 115 is represented by `exit-115-loading-dock`, its only shown entrance. The depicted loading dock adjoins the south circulation strip; short outdoor edges connect it. No connection to the room 118 exterior doorway or an unshown campus path is inferred.
- 114 and its lettered rooms use the west vestibule and inner room openings. 101 retains its vestibule doorway and doors to 104 and 100.
- The dashed north end of the spine is not treated as an invented exterior door. The unlabelled narrow space west of the women's restroom has a destination node at its visible opening.

Second floor:

- 207 is approached through its north vestibule; 206 also opens into 207. 207A/B/D use 207, and 207B also opens to the service corridor.
- 205A is inside 205; 203 has doors from the main corridor and 204; 203A has doors to 204 and 200. 200 retains both main-corridor doors.
- The dotted west service corridor provides doors to 209A/F/G/H/J, electrical, telecom, custodial, storage, and toilets. Women's toilets use a small vestibule.

Third floor:

- The west service corridor reaches 307D/E/F/G, mechanical, electrical, telecom, custodial, storage, and toilets.
- 303A is inside 303; lower doors connect 303–302–300. 300 retains both north openings. 304 is telecom.

## Integration and validation

The adapter previously searched all buildings by local coordinates. Adding Langdon reproduced an O'Connell instruction test failure because the origins overlap. `getReadableInstructions` now filters both endpoints by an optional seventh `buildingId` argument, default `ocon` for compatibility. Pass `lang` explicitly for this building. Dijkstra and the loader are unchanged.

Data tests check unique IDs and undirected pairs, finite positions/distances, floor ownership, endpoints, no serialized distance, two-way expansion, every destination reachable in both directions, distinct building components, corresponding adjacent stair endpoints, floor-aware candidate selection, and selected interior-only rooms. Existing loader tests include both buildings and verify attribute preservation and independent loads. Source overlays were initially temporary `/tmp` verification artifacts. The user subsequently requested `src/data/lang/floor-1-preview.png`; it is generated from saved JSON over the original PDF and was refreshed for the fence correction.

Validation results and final counts are recorded after review below.

Initial inventory before the fence correction (2026-10-12): floor 1 had 86 nodes / 91 edges; floor 2 has 55 / 60; floor 3 has 36 / 39. Total 177 nodes and 194 undirected edges including four transfers (388 loaded directed edges). Every Langdon node is reachable from the reference entrance. Langdon and O'Connell remain separate components.

Independent read-only review inspected all three overlays, enlarged service areas, adapter changes, and tests; no required corrections were found. Unit tests: 34 passed. Lint, typecheck, coverage, smoke, production build, and `docker compose config` passed. Coverage: 92.25% statements, 89.70% branches, 85.71% functions, 92.02% lines. E2E command succeeded with no tests present. Repository-wide formatting failed on pre-existing `.github/workflows/pr-checks.yml` syntax and formatting in `src/lib/graph.ts`, `src/main.tsx`, and `src/styles.css`; unrelated files were left unchanged. No containers were started.

Remaining uncertainty: current permissions, elevator entrances, stair vertical geometry, exact field dimensions, and outdoor/campus integration require additional evidence. No requested floors remain unfinished.

## User-confirmed fence correction

The user identified only the three dashed sections above rooms approximately 105–103 as fences, each with one gate, and explicitly approved placing gates at section midpoints. This interpretation does **not** apply to every dotted or dashed line. At 2.25 pixels per PDF point, these sections run from X=755 to 884, 884 to 1014, and 1014 to 1143 at Y=1148. Midpoints are X=819.5, 949, and 1078.5. Native PDF endpoints and this provenance are stored in floor 1 metadata under `fences`.

Added `lang-1-fence-gate-west`, `lang-1-fence-gate-middle`, and `lang-1-fence-gate-east`, each with one door edge to a new junction on the existing corridor. The corridor lies on the drawing-south side and runs parallel to the fences, so its east-west continuity remains valid. No other crossing or unshown exterior path was added. Gate accessibility and current permissions remain unknown.

Current floor 1 inventory: **92 nodes / 97 edges**. Whole Langdon dataset: **183 nodes / 200 undirected edges**, including four stair transfers. Preview labels Gate 1–3 identify the approved approximate placements. All 35 tests pass, including the new regression for gate positions and doorway connections; lint, typecheck, coverage, build, changed-file formatting, and diff checks pass. Earlier repository-wide formatting failures remain unrelated.
