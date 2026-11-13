# Acker Gymnasium (`acker`)

## Indoor junction audit — 2026-11-04 (completed)

Inspected the saved graph against every supplied source floor page and temporary
source overlays. Three-way Ts and forks count as well as crossroads. Room-door
spurs, standalone bends and vertical transfers alone are not circulation junctions.
The campus outdoor dataset is excluded by user instruction.

Inspected both first-floor partial sheets and the second floor. Only the south gym/changing passage and east-spine T are circulation junctions. Gym doorway fans, locker-room interiors, stair transfers and exterior-only northern room doors are not marked.

### floor-1.json

Source: csuc-floor-plans/Acker/agym-1.pdf, csuc-floor-plans/Acker/agym-2.pdf; page 1 of each PDF.
Date: 2008-07-14. Units: feet; conversion 0.5555555555555556 feet/PDF point.
Origin: `acker-1-exit-lobby-east-ao`; projected native PDF origin (427, 329.5).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

| Junction ID | Native PDF point (top-left) |
| --- | --- |
| `acker-1-south-gym-hall-350` | (175.00, 461.49) |
| `acker-1-east-hall-923` | (345.50, 461.49) |
### floor-2.json

Source: csuc-floor-plans/Acker/agym-3.pdf; page 1 of each PDF.
Date: 2008-07-14. Units: feet; conversion 0.5555555555555556 feet/PDF point.
Origin: `acker-1-exit-lobby-east-ao`; projected native PDF origin (427, 329.5).
Axes: drawing-right X / drawing-up Y. Existing floor/building alignment is retained;
its transform and landmarks are recorded in the floor metadata.

No source-supported circulation junctions requiring markers were found; existing corridor bends and doorway/transfer fans remain unmarked.

Merged redundant coincident nodes (old → retained):

- `acker-1-south-gym-hall-691` → `acker-1-east-hall-923`

Focused validation preserves every original connected component after resolving
merged IDs. All 34 floors have distinct node positions within a floor. Marked
intersections have nonzero immediate segments and distinct circulation headings;
production-loader tests preserve every marker. Origins, building transforms,
transfer chains, weights and accessibility evidence are retained. No final preview
under src/data was refreshed. No stored exit lists, headings or grouping fields
were added. The existing PDFs remain approximate and do not establish current
access or furnishing-dependent paths through open rooms/lobbies. Instruction
wording and ordinal turn generation remain outside this data audit.
