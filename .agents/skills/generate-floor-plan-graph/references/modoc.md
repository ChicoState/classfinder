# Modoc Hall (`modoc`)

## Indoor junction audit — 2026-11-04 (completed)

Inspected the saved graph against every supplied source floor page and temporary
source overlays. Three-way Ts and forks count as well as crossroads. Room-door
spurs, standalone bends and vertical transfers alone are not circulation junctions.
The campus outdoor dataset is excluded by user instruction.

Marked the main west and east service-cross-passage Ts on both floors and the second-floor 221 passage T. Upper north stair access, room-suite doorway fans and the existing first-floor yard graph do not add indoor corridor junctions.

### floor-1.json

Source: csuc-floor-plans/Modoc/modc-1.pdf; page 1 of each PDF.
Date: 2009-09-15. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `modoc-1-exit-southwest-ao`; projected native PDF origin (192, 521.5).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `modoc-1-hall-west-980` | (225.00, 490.01) |
| `modoc-1-hall-east-980` | (368.50, 490.01) |
### floor-2.json

Source: csuc-floor-plans/Modoc/modc-2.pdf; page 1 of each PDF.
Date: 2008-07-15. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `modoc-1-exit-southwest-ao`; projected native PDF origin (189, 524.5).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `modoc-2-hall-west-322` | (222.00, 161.00) |
| `modoc-2-hall-west-986` | (222.00, 493.01) |
| `modoc-2-hall-east-986` | (364.99, 493.01) |

Focused validation preserves every original connected component after resolving
merged IDs. All 34 floors have distinct node positions within a floor. Marked
intersections have nonzero immediate segments and distinct circulation headings;
production-loader tests preserve every marker. Origins, building transforms,
transfer chains, weights and accessibility evidence are retained. No final preview
under src/data was refreshed. No stored exit lists, headings or grouping fields
were added. The existing PDFs remain approximate and do not establish current
access or furnishing-dependent paths through open rooms/lobbies. Instruction
wording and ordinal turn generation remain outside this data audit.
