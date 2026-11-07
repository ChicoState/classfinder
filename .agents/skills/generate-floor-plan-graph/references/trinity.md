# Trinity Hall (`trinity`)

## Indoor junction audit — 2026-11-04 (completed)

Inspected the saved graph against every supplied source floor page and temporary
source overlays. Three-way Ts and forks count as well as crossroads. Room-door
spurs, standalone bends and vertical transfers alone are not circulation junctions.
The campus outdoor dataset is excluded by user instruction.

The south block has distinct source-supported lobby/ramp and corridor intersections. Lobby entries attach through new junctions directly below their doorways instead of diagonal links from a distant corner. Floor-2 ramp-bottom is the physical T; an overlapping direct east-west shortcut was replaced. Redundant coincident corner aliases were separated along their corridors. Northwest/northeast staircase-only spurs and room-door fans remain distinguishable from hallway branches.

### floor-1.json

Source: csuc-floor-plans/Trinity/trnt-1.pdf; page 1 of each PDF.
Date: 2009-09-15. Units: feet; conversion 0.2777777777777778 feet/PDF point.
Origin: `trinity-1-exit-south-ao`; projected native PDF origin (349.5, 655.5).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `trinity-1-northeast-hall` | (445.01, 175.01) |
| `trinity-1-south-west-1248` | (346.01, 624.00) |
| `trinity-1-south-lobby-junction` | (373.51, 416.50) |
| `trinity-1-south-east-entry-junction` | (425.50, 416.50) |

Added necessary approaches/junctions: `trinity-1-south-lobby-junction`, `trinity-1-south-east-entry-junction`.

Corrected circulation point positions: `trinity-1-south-hall-top`, `trinity-1-south-west-833`, `trinity-1-south-east-833`. Doorway positions and the origin were preserved.
### floor-2.json

Source: csuc-floor-plans/Trinity/trnt-2.pdf; page 1 of each PDF.
Date: 2008-07-14. Units: feet; conversion 0.2777777777777778 feet/PDF point.
Origin: `trinity-1-exit-south-ao`; projected native PDF origin (349.5, 655.5).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `trinity-2-ramp-bottom` | (412.00, 416.50) |
| `trinity-2-south-west-1248` | (346.01, 624.00) |
| `trinity-2-south-lobby-junction` | (373.51, 416.50) |

Added necessary approaches/junctions: `trinity-2-south-lobby-junction`.

Corrected circulation point positions: `trinity-2-south-west-833`. Doorway positions and the origin were preserved.

Focused validation preserves every original connected component after resolving
merged IDs. All 34 floors have distinct node positions within a floor. Marked
intersections have nonzero immediate segments and distinct circulation headings;
production-loader tests preserve every marker. Origins, building transforms,
transfer chains, weights and accessibility evidence are retained. No final preview
under src/data was refreshed. No stored exit lists, headings or grouping fields
were added. The existing PDFs remain approximate and do not establish current
access or furnishing-dependent paths through open rooms/lobbies. Instruction
wording and ordinal turn generation remain outside this data audit.
