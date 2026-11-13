# Plumas Hall (`plumas`)

## Indoor junction audit — 2026-11-04 (completed)

Inspected the saved graph against every supplied source floor page and temporary
source overlays. Three-way Ts and forks count as well as crossroads. Room-door
spurs, standalone bends and vertical transfers alone are not circulation junctions.
The campus outdoor dataset is excluded by user instruction.

The first-floor main crossroad, east entry T and southwest/south-exit T are marked. The east-south hall-109 point is a dead-end doorway fan, not a third corridor. Upper-floor corridor loops and room-door/stair fans are unmarked. The first-floor courtyard is existing outdoor circulation and was not asserted to contain fixed indoor junctions.

### floor-1.json

Source: csuc-floor-plans/Plumas/plms-1.pdf; page 1 of each PDF.
Date: 2010-04-07. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `plumas-1-exit-east-ao`; projected native PDF origin (480, 496.2).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `plumas-1-hall-main` | (304.80, 496.20) |
| `plumas-1-hall-east-junction` | (441.60, 496.20) |
| `plumas-1-hall-south-west` | (304.80, 595.20) |
### floor-2.json

Source: csuc-floor-plans/Plumas/plms-2.pdf; page 1 of each PDF.
Date: 2006-07-18. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `plumas-1-exit-east-ao`; projected native PDF origin (483.6, 497.4).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

No source-supported circulation junctions requiring markers were found; existing corridor bends and doorway/transfer fans remain unmarked.
### floor-3.json

Source: csuc-floor-plans/Plumas/plms-3.pdf; page 1 of each PDF.
Date: 1999-11-08. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `plumas-1-exit-east-ao`; projected native PDF origin (483.3, 499.8).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

No source-supported circulation junctions requiring markers were found; existing corridor bends and doorway/transfer fans remain unmarked.

Focused validation preserves every original connected component after resolving
merged IDs. All 34 floors have distinct node positions within a floor. Marked
intersections have nonzero immediate segments and distinct circulation headings;
production-loader tests preserve every marker. Origins, building transforms,
transfer chains, weights and accessibility evidence are retained. No final preview
under src/data was refreshed. No stored exit lists, headings or grouping fields
were added. The existing PDFs remain approximate and do not establish current
access or furnishing-dependent paths through open rooms/lobbies. Instruction
wording and ordinal turn generation remain outside this data audit.
