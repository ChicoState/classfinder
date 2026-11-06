# O'Connell record

These are retained project-specific decisions, not universal building rules. Inspect current data and sources before modifying them; evidence-based corrections may supersede manual interpretations.

## Sources and file history

- Building ID `ocon`; O'Connell Technology Center, California State University, Chico.
- Sources: `csuc-floor-plans/ocon/ocon-1.pdf` through `ocon-4.pdf`. Four floors, each 612 × 792 PDF points, printed scale `1 inch = 30 feet`.
- Dates: floor 1, 2009-09-16; floor 2, 2003-10-07; floor 3, 2001-02-06; floor 4, 2008-08-05. Dates do not establish current conditions.
- App files: `src/data/ocon/floor-1.json` through `floor-4.json`, plus `connections.json`.
- `data/ocon-1.json` and flat `src/data/ocon-1.json` are historical paths, not copies to maintain. Root-level data initially followed “under data” literally; `src/data` was subsequently chosen because the loader imports it as app data. One floor per file, grouped by building, was preferred for manageable review and expansion.
- Existing `floor-*-preview.png` files were explicitly requested. They are local review artifacts, not app imports or files to commit. Temporary previews for self-verification are allowed; creating or refreshing final previews under `src/data` requires an explicit request.

## Origin and registration

`ocon-1-exit-lower-ao` is `(0, 0)`: the AO/wheelchair-marked exterior doorway on the right side of the lower lobby in the first-floor drawing. Its top-left PDF coordinate is `(443.4, 552.6)` points:

```text
xFeet = (pdfX - 443.4) * 30 / 72
yFeet = (552.6 - pdfY) * 30 / 72
```

Directions in descriptive IDs refer to drawing locations, not surveyed bearings. Upper floors were manually translated using the passenger elevator shaft, with the common scale/orientation retained. Add the following to the source floor's top-left PDF coordinate before applying floor 1's conversion:

| Floor | PDF X offset (points) | PDF Y offset (points) |
| --- | ---: | ---: |
| 1 | 0 | 0 |
| 2 | 129 / 2.25 | -36 / 2.25 |
| 3 | 125 / 2.25 | -17 / 2.25 |
| 4 | 123 / 2.25 | -20 / 2.25 |

The numerators came from a 2.25-pixels-per-PDF-point rendering. Upper floors store equivalent projected origins and alignment metadata. This registration is approximate, not a survey; stair access points on different landings need not coincide.

## Thirteen inter-floor links

- West stairs: 1–2, 2–3, 3–4. Floor 1 retains `ocon-1-stairs-west-exterior-door`; other floors use `ocon-<floor>-stairs-west`. Preserve the first-floor exterior approach.
- Lower stairs: 1–2, 2–3, 3–4 (`stairs-lower`).
- Upper stairs: **1–2 only** (`stairs-upper`); no upper stair appears on floors 3 or 4.
- Passenger elevator: 1–2, 2–3, 3–4 (`elevator-passenger`).
- Service elevator: 1–2, 2–3, 3–4 (`elevator-service`).

Serialized edges do not store distances. The loader derives every runtime distance from the positions of its endpoints, including these transfers. Weight is 1. Stairs are inaccessible; elevator accessibility and service access are unspecified.

## Recorded doorway interpretations

- Floor 1: 106 via custodial; 127A via 127; 130A via 130; 133A connects 136 and 133. Retain the unnumbered space above 133A. A short outdoor edge connects the west stair exit and nearby corridor entrance. Langdon's neighboring outline is excluded.
- Floor 2: retain both ramps beside 255/249 with intermediate access; distances are plan-view with slope unspecified. 241 via 242; 244A via 244; 251A via 251; 249A via 249; 254A via 254. Retain visible unnumbered entrances.
- Floor 3: 347A via 347; 334A via 334; 349 also opens into 341. The compartment directly above the unnumbered room above 349 has no discernible entrance; no opening was invented.
- Floor 4: unnumbered service/mechanical entrances are included, but dashed equipment does not imply public circulation. No shortcut through the upper mechanical area is assumed. 436A lies between 436 and 438; 431A between 431 and 434; 432 has two doors. 431 shares open circulation with the lower stair lobby, so its approach is not an invented doorway.
- Only the three marked AO/wheelchair entrance edges on floor 1 were marked accessible. Paths through rooms and service spaces may be restricted in reality; the current types do not express all such restrictions.
- Overlay review caught straight lines crossing walls despite plausible endpoints. Preserve required bends and inspect multi-door approaches rather than optimizing only node count.

## Tooling and verification history

The original environment lacked `pdftotext`, `pdftoppm`, Python PDF modules, and Python venv support. Temporary `pdfjs-dist` plus `@napi-rs/canvas` under `/tmp` enabled vector-PDF inspection. This is a fallback, not a required dependency: use available tools, respect network approvals, and keep inspection packages out of the app manifest/lockfile. Temporary installations may not persist.

Prior final checks passed unit tests, coverage, lint, typecheck, build, smoke checks, and Docker configuration. E2E ran with no tests. Repository-wide formatting failed on an existing invalid workflow `if` expression in `.github/workflows/pr-checks.yml` and formatting in `src/main.tsx`/`src/styles.css`; changed files passed. These are historical results, not a license to skip checks or assume old failures/test counts remain current.

## Global campus registration (2026-10-25)

User explicitly requested O’Connell/Langdon outdoor connections and one global
runtime coordinate system. Source floor JSON and PDF origins above are unchanged.
The loader now transforms every O’Connell floor using the same similarity in
`src/graph/campusAlignment.json`: scale 1.1166698897430516, rotation
39.03493252634291 degrees counterclockwise, translation
(-483.96293239132564, -47.85735564505134) global feet. The outdoor origin is OSM
node 4715296203 at 39.7276776, -121.8456054; positive X east, Y north.

Three matched reference-floor AO doorways anchor the fit: lower AO → OSM
5849825682, upper AO → 5849825683, west AO → 11938244696. Matches use actual
ground-floor openings and the ends of covered OSM footways; excluded OSM indoor
corridors 1320210552/1320210554 corroborate the entrance identity, not a shortcut.
The fit's RMS error is 2.94 feet, maximum 3.60 feet. The 11.67% scale increase is
a material, provisional correction to the dated PDF coordinate scale and must
be visually reviewed; it is not a surveyed dimension. All loaded O’Connell edge
distances, including transfers, scale accordingly.

Three explicit, bidirectional door links in outdoor `building-connections.json`
span the registration residuals; accessibility is omitted. Combined graph-only
`src/data/outdoor/ocon-lang-preview.png` was explicitly requested and shows ground
floors, nearby outdoors, entrance labels A–D, and the actual loaded Dijkstra route
from O’Connell room 124 to Langdon room 120 (744.30 feet, 26 edges, stairs included).
The associated route report records traversal and review limits. No individual
floor preview was refreshed. Runtime callers must use global coordinates;
source drawing coordinates remain for digitization and provenance only.

Following the user's confirmation of walkability between Langdon's three gates
and the tested O’Connell doorway, all three gates now connect through the outdoor
courtyard. The refreshed combined preview labels these E–G. The same interior
test now enters Langdon's east gate: 387.97 feet / 27 edges, no stairs, equal cost
in reverse. O’Connell entrance matches, alignment and source geometry did not
change; the earlier 744.30-foot dock route is historical.

## Junction audit — 2026-11-04, first indoor batch

Inspected all four source PDF pages and temporary overlays from saved JSON.
This is the first batch of the requested 34-floor indoor audit. The other 30
floors remain unaudited; outdoor was explicitly excluded by the user.

Three-way T intersections and forks count as junctions. Room-door spurs, standalone
bends and stair/elevator transfers alone do not establish circulation junctions.
Thirteen nodes now carry `isJunction: true`:

- Floor 1: `lobby-upper-junction`, `hall-restroom-junction` — page 1, east end of
  the cross corridor below the service elevator; west cross-corridor restroom T.
- Floor 2: `hall-cross-west`, `hall-east-upper`, `hall-ramps`,
  `ramp-middle-landing`, `hall-230` — page 1, restroom frontage, east cross-corridor
  T, ramp entrance, middle ramp landing, and cross passage above 246/247.
- Floor 3: `hall-west-junction`, `hall-restroom-junction`, `hall-east-upper` —
  page 1, west longitudinal T, separate restroom T, east cross-corridor T.
- Floor 4: `hall-north`, `hall-419`, `hall-425` — page 1, restroom approach,
  passage toward 438 beside 419A, lower cross passage above stairs.

IDs omit the existing `ocon-<floor>-` prefix in the inventory above.
Seven necessary junction/approach nodes were added. On floor 1 the restroom
approach now joins a separate T directly below its vestibule. The service-elevator
spur attaches to its own unmarked approach on the cross corridor, eliminating a
duplicate westbound heading at the east T. Open cross-corridor links previously
typed `door` are corrected to `corridor`. `hall-west-junction` remains unmarked:
its descriptive ID alone is insufficient evidence of a junction.

On floor 2, `hall-cross-west` X follows the restroom frontage; `hall-230` Y moves
to the horizontal cross passage (43.03 local feet). On floor 3 the restroom T is
separate from the west longitudinal T. Floors 1–3 have northbound approach nodes
before upper-lobby bends. On floor 4 `hall-419` moves to the meeting with the west
passage (-7.53, 68.21 local feet), with a north approach before the hall offset.
These centerline placements are approximate source observations, not surveys.

Existing doorway positions, origins, transforms, weights, accessibility evidence
and inter-floor links are unchanged. No exit lists or stored headings were added.
The `Node` type now accepts the marker; the loader's existing spread preserves it.
Tests cover marker preservation, independent loads, nonzero neighboring segments,
and reversal of left/right at the floor-3 west T on a straight-through route.

Broad room/lobby door fans remain door approaches. Furnishing-dependent paths
inside those spaces are unresolved by the PDFs. Graph edits do not implement
ordinal instruction wording. No final previews were regenerated under src/data.

Remaining: Acker (2 floors), Ayres (2), Butte (5), Glenn (3), Holt (3), Langdon (3),
Modoc (2), Plumas (3), Tehama (3), Trinity (2), Yolo (2).

Validation: 298 tests pass; coverage 92.03% statements, 83.33% branches, 91.66%
functions, 92.66% lines. Formatting, lint, typecheck, production build, smoke check
and Docker Compose configuration pass. Build reports existing bundle-size and
react-router directive warnings. Playwright initially could not start its preview
server inside the sandbox; a run with permission is pending at this checkpoint.

## Indoor junction audit — 2026-11-04 (completed)

Inspected the saved graph against every supplied source floor page and temporary
source overlays. Three-way Ts and forks count as well as crossroads. Room-door
spurs, standalone bends and vertical transfers alone are not circulation junctions.
The campus outdoor dataset is excluded by user instruction.

All other indoor floors have now also been reviewed; this supersedes the earlier first-batch remaining-work list. The preceding O’Connell geometry decisions remain applicable.

### floor-1.json

Source: csuc-floor-plans/ocon/ocon-1.pdf; page 1 of each PDF.
Date: 2009-09-16. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `ocon-1-exit-lower-ao`; projected native PDF origin (443.4, 552.6).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `ocon-1-lobby-upper-junction` | (403.56, 234.67) |
| `ocon-1-hall-restroom-junction` | (314.66, 234.67) |

Added necessary approaches/junctions: `ocon-1-hall-restroom-junction`, `ocon-1-lobby-upper-south-approach`, `ocon-1-hall-service-approach`.
### floor-2.json

Source: csuc-floor-plans/ocon/ocon-2.pdf; page 1 of each PDF.
Date: 2003-10-07. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `ocon-1-exit-lower-ao`; projected native PDF origin (386.06666666666666, 568.5999999999999).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `ocon-2-hall-cross-west` | (256.90, 249.78) |
| `ocon-2-hall-east-upper` | (379.11, 249.33) |
| `ocon-2-hall-ramps` | (383.11, 383.99) |
| `ocon-2-hall-230` | (379.11, 465.33) |
| `ocon-2-ramp-middle-landing` | (369.34, 383.99) |

Added necessary approaches/junctions: `ocon-2-hall-east-north-approach`.

Corrected circulation point positions: `ocon-2-hall-cross-west`, `ocon-2-hall-230`. Doorway positions and the origin were preserved.
### floor-3.json

Source: csuc-floor-plans/ocon/ocon-3.pdf; page 1 of each PDF.
Date: 2001-02-06. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `ocon-1-exit-lower-ao`; projected native PDF origin (387.84444444444443, 560.1555555555556).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `ocon-3-hall-east-upper` | (381.34, 240.00) |
| `ocon-3-hall-west-junction` | (257.79, 242.23) |
| `ocon-3-hall-restroom-junction` | (280.90, 242.23) |

Added necessary approaches/junctions: `ocon-3-hall-restroom-junction`, `ocon-3-hall-east-north-approach`.
### floor-4.json

Source: csuc-floor-plans/ocon/ocon-4.pdf; page 1 of each PDF.
Date: 2008-08-05. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `ocon-1-exit-lower-ao`; projected native PDF origin (388.73333333333335, 561.4888888888888).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `ocon-4-hall-north` | (281.79, 177.34) |
| `ocon-4-hall-419` | (370.66, 397.78) |
| `ocon-4-hall-425` | (364.45, 505.78) |

Added necessary approaches/junctions: `ocon-4-hall-419-north-approach`.

Corrected circulation point positions: `ocon-4-hall-419`. Doorway positions and the origin were preserved.

Focused validation preserves every original connected component after resolving
merged IDs. All 34 floors have distinct node positions within a floor. Marked
intersections have nonzero immediate segments and distinct circulation headings;
production-loader tests preserve every marker. Origins, building transforms,
transfer chains, weights and accessibility evidence are retained. No final preview
under src/data was refreshed. No stored exit lists, headings or grouping fields
were added. The existing PDFs remain approximate and do not establish current
access or furnishing-dependent paths through open rooms/lobbies. Instruction
wording and ordinal turn generation remain outside this data audit.
