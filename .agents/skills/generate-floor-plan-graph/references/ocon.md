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
