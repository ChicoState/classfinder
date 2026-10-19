# Holt Hall (`holt`)

Digitized 2026-10-19. Display name: Holt Hall; source folder/alias: Holt.

## Sources and inventory

- `csuc-floor-plans/Holt/holt-1.pdf`: first floor, sheet 2 of 4, building 25, printed date 2/17/11. PDF creation/modification date is also 2011-02-17. One 612 × 792 point page, rotation 0, UserUnit 1. Labels are vector outlines; text extraction is empty.
- `csuc-floor-plans/Holt/holt-2.pdf` and `holt-3.pdf` exist but have not been inspected or digitized in this task.
- `src/data/holt/floor-1.json`: 246 nodes and 264 undirected edges. Automatically included by the existing eager JSON loader; no loader implementation changes.
- `src/data/holt/floor-1-preview.png`: explicitly requested source overlay, rendered from the final saved JSON. Local review aid; do not commit.
- No `connections.json` yet: no other Holt floors are present.

## Coordinates and alignment

Printed scale is **1 inch = 40 feet**, unlike O'Connell/Langdon. Standard PDF points give `feetPerPdfPoint = 40/72`. The source has no nonstandard unit or rotation.

Reference origin: `holt-1-exit-south-ao`, the drawing-bottom AO/wheelchair-marked exterior doorway in the east end vestibule, native top-left PDF point **(354, 681)**. This doorway maps exactly to (0, 0). Native coordinates are manually selected approximations, not survey measurements.

`x = (pdfX - 354) * 40/72`; `y = (681 - pdfY) * 40/72`; round saved feet coordinates to two decimals. Positive X is drawing-right and positive Y drawing-up, not geographic east/north. Reference-floor translation (0,0), rotation 0°, scale factor 1. Upper-floor alignment is not established; preserve this origin and compare stair cores and elevator when adding floors.

## Topology and access evidence

- North/south blocks have circulation around the lecture hall/open court; the middle block has circulation around its courtyard. The west corridor links the blocks. The middle west hall ends at the south courtyard ring, then the main route turns into the central corridor between offices/shafts; it does not continue through 165A/135.
- Both building-end AO entrances have true accessibility flags on their entrance edges. Other door/landing permissions and elevator operation remain unknown. Lecture stair traversal is false. No complete accessible route is asserted.
- Elevator: visible gap on its north frontage near native (239,273), serving the north-west connector vestibule. Keep its transfer chain separate from stairs when future floors are added.
- Separate end stair cores are retained, including their exterior stair-side doors. Their floor ranges are not yet established. The west middle stair is marked DN; the lecture hall west access leads to a DN stair toward B/SEE SHEET 1. No lower-level graph is inferred.
- **User correction, 2026-10-19:** the stair landings are connected by a walkable path all the way through the rooms containing the stairs. This supersedes the initial interpretation that the stair graphics blocked same-floor passage. Both connector rooms now have approximate centerlines through their interiors, joining both west landing doors to the east stair access. The north-east upper/lower approaches are also connected. These passages use `corridor` edges, with accessibility unknown, rather than `stairs` edges. Do not restore the former disconnected-region restriction based on the stair symbols.
- All 246 nodes form one component, including the east connector exterior doors and every numbered destination. `metadata.stairRoomPassages` records the user confirmation and approximate geometry. No unshown campus paths are added.
- No shortcuts connect different lecture-hall entry doors through seating. Rear west/east vestibules each serve a seating doorway and a door into 170A; 170A itself provides a shown interior alternative.
- Preserve parent-room access: 177 through 181; 185A through 185; 175A through 175; 171A through 171; 157A through 157; 131A/B through 131; 129A through 129B; 125A through 125 or 127. 189A opens from 189. 187A has doors from the hall and 187. 183/181 have an internal connecting opening.
- The upper 101 suite reaches 101D/E/F. The partition stub blocks a direct route to the lower 101C door. 101A/B/C are reached through the lower notch from room 111, with a necessary bend around the partition.
- 169 has a north vestibule entry, an internal door to 161, and a south door to 165. 161 also opens east to the main corridor. 165A/135 open west into 165, not into the central corridor; 135 also opens south to the west connector. 137 opens south to that connector; 167 opens north onto the courtyard ring.
- Room 141 extends into its open lower lobby and serves 141A/C and the partitioned 141B area. Keep the gap into the unnumbered west bay of 141A; do not invent room 139. 139A has its own narrow vestibule. Do not add a south exterior door through the solid 141B wall.
- 115 has a door into 119; 119 also has its own entrance off the small end corridor serving 117/121/123. Both shown doors of 117 are retained.
- Dotted room partitions (129/129B and 141B/141C) are not treated as confirmed openings. Both sides have shown access; permissions and operability are unknown.
- Courtyard destinations are the shown doorways. No decorative nodes, courtyard crossings, neighboring buildings, or unshown outdoor routes are included.

## Validation and remaining work

After the user's stair-room correction, all 40 unit tests and coverage checks pass (92.02% line coverage). The new reachability test verifies every node from the origin in both directions; passage tests verify short corridor-only paths through the stair rooms, with accessibility left unknown. Changed-file formatting, test lint and `git diff --check` pass. The preview was regenerated from the corrected JSON and the obsolete separate-landing annotations were removed.

Overlay inspection corrected wall crossings, branch positions and parent-room access. The initial three-component interpretation was superseded by user-confirmed stair-room passages on 2026-10-19. Validation now requires one connected component and short corridor-only routes through each confirmed passage. Loaded graph/Dijkstra tests also cover unique IDs, existing endpoints, finite coordinates, no self-links/duplicate pairs, no serialized distance overrides, parent access, reverse edges, attributes, distance derivation and building/floor candidate filtering.

2026-10-19 checks: `npm test` and `npm run coverage` passed (39 tests in six files; 92.02% line coverage). Changed JSON/tests/README/AGENTS formatting passed; changed tests passed ESLint. Infrastructure smoke checks and `docker compose config` passed. E2E exited successfully with no tests. Repository-wide formatting is blocked by existing malformed YAML at `.github/workflows/pr-checks.yml:34` and existing source formatting; lint by an unused `Link` import in `src/App.tsx`; typecheck by missing `react-router` and `usemap` in `src/Appbackup.tsx`; build by missing `react-router`. These files were not changed. No containers were started. The saved persistent PDF helper was successfully exercised on the Holt source.

Before extending: inspect floors 2/3 separately, align fixed features against the reference floor, and confirm stair serving ranges and transfer elevations. Preserve the user-confirmed same-floor passages through the stair rooms. Consult additional lecture-hall/basement sheets before routing inside the tiered seating or joining its B landing. Present-day access and elevator availability need separate evidence. No GPS alignment has been performed.

PDF tools are saved at `/home/eyebaian/.local/share/classfinder-pdf-tools/`; the skill entrypoint documents the reusable `view-pdf.mjs` command. Reuse those installed tools on this machine.
