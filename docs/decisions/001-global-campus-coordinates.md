# One runtime campus coordinate frame

Accepted 2026-10-25 at the user's request.

Indoor datasets were drawn in separate local feet frames with overlapping
origins. Connecting them directly to geographic outdoor nodes would produce
invalid edge distances, turns and nearest-node selections.

Retain source JSON for PDF traceability, and transform every included building
into the outdoor graph's existing east/north feet frame when loading. The global
origin is OSM node 4715296203 (39.7276776, -121.8456054). Derive distances only
after all endpoint positions have been transformed. Loaded nodes keep their
existing IDs, building and floor identities, and one global position; they do
not carry a second local position.

`src/graph/campusAlignment.json` records orientation-preserving similarity fits
and landmark evidence. O’Connell uses three matched doors; Langdon uses seven
footprint corners. A uniform scale preserves angles and relative geometry within
each building while correcting source/map scale differences. The transforms
apply to all floors. Seven serialized entrance links are stored separately from
the outdoor path geometry and indoor floors. Dijkstra and its cost model remain
unchanged.

The user explicitly chose to omit unaligned Holt. An unknown, non-excluded
building causes an alignment error instead of silently mixing frames. Holt's
source geometry remains available for later alignment and standalone topology
tests. A campus-wide meters migration and rewriting indoor source coordinates
were unnecessary for this request.

O’Connell's 11.67% scale increase and approximately 3.60-foot maximum fitting
residual require review; Langdon has a 0.39% scale increase and approximately
4.01-foot maximum residual. The preview and loaded route report expose these
limits. Following user confirmation that the entire area between Langdon's gates
and the tested O’Connell doors is walkable, all three gates connect through three
exterior approaches. A walking line stays outside the fence and joins existing
outdoor nodes at both ends. Five-foot approach offsets are schematic geometry,
not measured gate locations. The updated route enters through the east gate
without stairs. Other unmatched entrances remain unlinked.

Consumers that receive loaded positions must use global coordinates. Displaying
those positions on a source PDF requires an inverse conversion at the display
boundary. The user explicitly excluded runtime display and UI changes from this
task. The existing floor-plan viewer is unchanged; its display compatibility
with global positions is outside this task's scope.
