# Yolo Hall (`yolo`)

## Indoor junction audit — 2026-11-04 (completed)

Inspected the saved graph against every supplied source floor page and temporary
source overlays. Three-way Ts and forks count as well as crossroads. Room-door
spurs, standalone bends and vertical transfers alone are not circulation junctions.
The campus outdoor dataset is excluded by user instruction.

The first-floor lobby east passage now has a shared elevator approach, so its immediate east exit is unique. North entrance/restroom circulation joins are marked. Second-floor west/east gallery Ts and the south hall junctions are marked, including the separate nearby 226 approach T above the 229 bridge. First-floor large-room door fans are not circulation intersections.

### floor-1.json

Source: csuc-floor-plans/Yolo/yolo-1.pdf; page 1 of each PDF.
Date: 2008-08-04. Units: feet; conversion 0.5555555555555556 feet/PDF point.
Origin: `yolo-1-exit-south-ao`; projected native PDF origin (237, 637).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `yolo-1-lobby-main` | (237.00, 579.00) |
| `yolo-1-hall-north` | (241.50, 129.99) |
| `yolo-1-hall-north-west` | (205.00, 122.51) |

Added necessary approaches/junctions: `yolo-1-lobby-east-approach`.
### floor-2.json

Source: csuc-floor-plans/Yolo/yolo-2.pdf; page 1 of each PDF.
Date: 2008-08-04. Units: feet; conversion 0.5555555555555556 feet/PDF point.
Origin: `yolo-1-exit-south-ao`; projected native PDF origin (223, 635).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `yolo-2-hall-west-north` | (203.99, 221.00) |
| `yolo-2-hall-west-218` | (203.99, 332.49) |
| `yolo-2-hall-west-229` | (203.99, 433.00) |
| `yolo-2-hall-west-south` | (203.99, 544.50) |
| `yolo-2-hall-southwest` | (203.99, 579.51) |
| `yolo-2-hall-east-north` | (314.01, 221.00) |
| `yolo-2-hall-east-229` | (314.01, 444.00) |
| `yolo-2-hall-southeast` | (314.01, 579.51) |
| `yolo-2-hall-south-center` | (255.00, 579.51) |
| `yolo-2-hall-west-226-junction` | (203.99, 426.00) |

Added necessary approaches/junctions: `yolo-2-hall-west-226-junction`.

Focused validation preserves every original connected component after resolving
merged IDs. All 34 floors have distinct node positions within a floor. Marked
intersections have nonzero immediate segments and distinct circulation headings;
production-loader tests preserve every marker. Origins, building transforms,
transfer chains, weights and accessibility evidence are retained. No final preview
under src/data was refreshed. No stored exit lists, headings or grouping fields
were added. The existing PDFs remain approximate and do not establish current
access or furnishing-dependent paths through open rooms/lobbies. Instruction
wording and ordinal turn generation remain outside this data audit.
