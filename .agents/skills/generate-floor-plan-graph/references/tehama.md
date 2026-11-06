# Tehama Hall (`tehama`)

## Indoor junction audit — 2026-11-04 (completed)

Inspected the saved graph against every supplied source floor page and temporary
source overlays. Three-way Ts and forks count as well as crossroads. Room-door
spurs, standalone bends and vertical transfers alone are not circulation junctions.
The campus outdoor dataset is excluded by user instruction.

Marked source-supported cross-passage and gallery Ts on all three floors. Where a degree-2 corridor alias occupied the intersection itself, its approach was moved up to two feet along its existing unobstructed branch to give a nonzero initial vector; doorway and transfer positions were preserved. Remaining redundant coincident nodes were merged. This avoids zero-length junction headings without storing bearings.

### floor-1.json

Source: csuc-floor-plans/Tehama/tehama-1.pdf; page 1 of each PDF.
Date: 2008-08-05. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `tehama-1-exit-north-ao`; projected native PDF origin (362, 139).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `tehama-1-hall-north-553` | (276.51, 158.99) |
| `tehama-1-hall-main-1115` | (276.51, 557.51) |
| `tehama-1-hall-main-427` | (276.51, 213.50) |

Corrected circulation point positions: `tehama-1-hall-main-318`, `tehama-1-hall-south-553`. Doorway positions and the origin were preserved.
### floor-2.json

Source: csuc-floor-plans/Tehama/tehama-2.pdf; page 1 of each PDF.
Date: 2008-08-05. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `tehama-1-exit-north-ao`; projected native PDF origin (394, 155).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `tehama-2-hall-west-644` | (176.01, 321.99) |
| `tehama-2-hall-east-644` | (335.01, 321.99) |
| `tehama-2-hall-west-1154` | (176.01, 576.99) |
| `tehama-2-hall-east-1154` | (335.01, 576.99) |
| `tehama-2-hall-north-771` | (385.50, 174.01) |
| `tehama-2-hall-stair-east-389` | (385.50, 194.50) |
| `tehama-2-hall-east-540` | (335.01, 270.01) |

Corrected circulation point positions: `tehama-2-hall-cross-352`, `tehama-2-hall-cross-670`, `tehama-2-hall-south-352`, `tehama-2-hall-south-670`, `tehama-2-hall-stair-east-348`, `tehama-2-hall-northeast-771`. Doorway positions and the origin were preserved.
### floor-3.json

Source: csuc-floor-plans/Tehama/tehama-3.pdf; page 1 of each PDF.
Date: 2008-08-05. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `tehama-1-exit-north-ao`; projected native PDF origin (374.5, 132.5).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `tehama-3-hall-west-311` | (159.51, 155.49) |
| `tehama-3-hall-north-576` | (288.00, 155.49) |
| `tehama-3-hall-north-725` | (362.50, 155.49) |
| `tehama-3-hall-west-1108` | (159.51, 553.99) |
| `tehama-3-hall-east-1108` | (315.00, 553.99) |
| `tehama-3-hall-center-410` | (288.00, 205.00) |
| `tehama-3-hall-center-497` | (288.00, 248.49) |
| `tehama-3-hall-west-675` | (159.51, 337.51) |
| `tehama-3-hall-west-776` | (159.51, 388.00) |
| `tehama-3-hall-west-872` | (159.51, 436.00) |

Corrected circulation point positions: `tehama-3-hall-north-319`, `tehama-3-hall-center-311`, `tehama-3-hall-stair-east-311`, `tehama-3-hall-south-319`, `tehama-3-hall-south-630`, `tehama-3-hall-cluster-a-319`, `tehama-3-hall-cluster-b-319`, `tehama-3-hall-cluster-c-319`. Doorway positions and the origin were preserved.

Merged redundant coincident nodes (old → retained):

- `tehama-1-hall-east-725` → `tehama-1-hall-north-725`
- `tehama-1-hall-north-667` → `tehama-1-room-105`
- `tehama-2-hall-west-348` → `tehama-2-hall-north-352`
- `tehama-2-hall-northeast-889` → `tehama-2-room-203`

Focused validation preserves every original connected component after resolving
merged IDs. All 34 floors have distinct node positions within a floor. Marked
intersections have nonzero immediate segments and distinct circulation headings;
production-loader tests preserve every marker. Origins, building transforms,
transfer chains, weights and accessibility evidence are retained. No final preview
under src/data was refreshed. No stored exit lists, headings or grouping fields
were added. The existing PDFs remain approximate and do not establish current
access or furnishing-dependent paths through open rooms/lobbies. Instruction
wording and ordinal turn generation remain outside this data audit.
