# Butte Hall (`butte`)

## Indoor junction audit — 2026-11-04 (completed)

Inspected the saved graph against every supplied source floor page and temporary
source overlays. Three-way Ts and forks count as well as crossroads. Room-door
spurs, standalone bends and vertical transfers alone are not circulation junctions.
The campus outdoor dataset is excluded by user instruction.

The first-floor service vestibule forms a T at hall-custodian. Upper-floor loops, office suites and stair/elevator doorway spurs do not establish additional circulation intersections. No junction markers were added merely for the bends of these loops.

### floor-1.json

Source: csuc-floor-plans/Butte/bute-1.pdf; page 1 of each PDF.
Date: 2010-04-07. Units: feet; conversion 0.2777777777777778 feet/PDF point.
Origin: `butte-1-exit-north-east-ao`; projected native PDF origin (291, 135).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `butte-1-hall-custodian` | (215.00, 474.98) |
### floor-2.json

Source: csuc-floor-plans/Butte/bute-2.pdf; page 1 of each PDF.
Date: 2003-01-22. Units: feet; conversion 0.2777777777777778 feet/PDF point.
Origin: `butte-1-exit-north-east-ao`; projected native PDF origin (345, 134).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

No source-supported circulation junctions requiring markers were found; existing corridor bends and doorway/transfer fans remain unmarked.
### floor-3.json

Source: csuc-floor-plans/Butte/bute-3.pdf; page 1 of each PDF.
Date: 2008-08-04. Units: feet; conversion 0.2777777777777778 feet/PDF point.
Origin: `butte-1-exit-north-east-ao`; projected native PDF origin (326, 135).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

No source-supported circulation junctions requiring markers were found; existing corridor bends and doorway/transfer fans remain unmarked.
### floor-4.json

Source: csuc-floor-plans/Butte/bute-4.pdf; page 1 of each PDF.
Date: 2008-08-04. Units: feet; conversion 0.2777777777777778 feet/PDF point.
Origin: `butte-1-exit-north-east-ao`; projected native PDF origin (330, 134).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

No source-supported circulation junctions requiring markers were found; existing corridor bends and doorway/transfer fans remain unmarked.
### floor-5.json

Source: csuc-floor-plans/Butte/bute-5.pdf; page 1 of each PDF.
Date: 2009-09-16. Units: feet; conversion 0.2777777777777778 feet/PDF point.
Origin: `butte-1-exit-north-east-ao`; projected native PDF origin (334, 138).
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
