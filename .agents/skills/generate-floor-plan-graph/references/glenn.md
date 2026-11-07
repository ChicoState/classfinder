# Glenn Hall (`glenn`)

## Indoor junction audit — 2026-11-04 (completed)

Inspected the saved graph against every supplied source floor page and temporary
source overlays. Three-way Ts and forks count as well as crossroads. Room-door
spurs, standalone bends and vertical transfers alone are not circulation junctions.
The campus outdoor dataset is excluded by user instruction.

The first-floor west exit and east entry passages form T intersections. The east entrance now shares the existing stair approach rather than appearing as a second parallel east exit at the spine. Suite 204 entrance links share their actual east-side approaches; no false intersections are marked within its room-door fans.

### floor-1.json

Source: csuc-floor-plans/Glenn/glenn-1.pdf; page 1 of each PDF.
Date: 2009-09-15. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `glenn-1-entrance-north`; projected native PDF origin (319, 66.5).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `glenn-1-hall-west-exit` | (319.00, 300.50) |
| `glenn-1-hall-elevator` | (319.00, 317.49) |
### floor-2.json

Source: csuc-floor-plans/Glenn/glenn-2.pdf; page 1 of each PDF.
Date: 2008-07-14. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `glenn-1-entrance-north`; projected native PDF origin (323.5, 67).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

No source-supported circulation junctions requiring markers were found; existing corridor bends and doorway/transfer fans remain unmarked.
### floor-3.json

Source: csuc-floor-plans/Glenn/glenn-3.pdf; page 1 of each PDF.
Date: 2008-07-14. Units: feet; conversion 0.4166666666666667 feet/PDF point.
Origin: `glenn-1-entrance-north`; projected native PDF origin (319.5, 71.5).
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
