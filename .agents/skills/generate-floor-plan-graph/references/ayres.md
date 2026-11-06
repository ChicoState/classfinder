# Ayres Hall (`ayres`)

## Indoor junction audit — 2026-11-04 (completed)

Inspected the saved graph against every supplied source floor page and temporary
source overlays. Three-way Ts and forks count as well as crossroads. Room-door
spurs, standalone bends and vertical transfers alone are not circulation junctions.
The campus outdoor dataset is excluded by user instruction.

The theatre-passage T moves north to its actual meeting with the west hall. A short east approach preserves the initial heading toward 112. The second-floor restroom T now lies below its north branch rather than diagonally east of it. Courtyard/open room routes retain their existing topology.

### floor-1.json

Source: csuc-floor-plans/Ayres/ayrs-1.pdf; page 1 of each PDF.
Date: 2008-07-14. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `ayres-1-entrance-northwest`; projected native PDF origin (161.5, 70.5).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `ayres-1-hall-north-stair` | (162.00, 263.51) |
| `ayres-1-hall-105` | (162.00, 322.50) |
| `ayres-1-hall-111` | (162.00, 453.49) |
| `ayres-1-hall-southwest` | (162.00, 559.00) |

Added necessary approaches/junctions: `ayres-1-hall-112-west-approach`.

Corrected circulation point positions: `ayres-1-hall-north-stair`. Doorway positions and the origin were preserved.
### floor-2.json

Source: csuc-floor-plans/Ayres/ayrs-2.pdf; page 1 of each PDF.
Date: 2008-07-14. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `ayres-1-entrance-northwest`; projected native PDF origin (191, 69.5).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `ayres-2-hall-212` | (264.49, 559.00) |

Corrected circulation point positions: `ayres-2-hall-212`. Doorway positions and the origin were preserved.

Focused validation preserves every original connected component after resolving
merged IDs. All 34 floors have distinct node positions within a floor. Marked
intersections have nonzero immediate segments and distinct circulation headings;
production-loader tests preserve every marker. Origins, building transforms,
transfer chains, weights and accessibility evidence are retained. No final preview
under src/data was refreshed. No stored exit lists, headings or grouping fields
were added. The existing PDFs remain approximate and do not establish current
access or furnishing-dependent paths through open rooms/lobbies. Instruction
wording and ordinal turn generation remain outside this data audit.
