# Outdoor and GPS design direction

## Implemented campus frame (2026-10-25)

The user explicitly requested global runtime coordinates, outdoor connections
for `ocon` and `lang`, an actual loaded Dijkstra test, and a graph-only preview.
These are now implemented using the outdoor graph's existing east/north **feet**
frame and origin OSM node 4715296203 (39.7276776, -121.8456054). Indoor source JSON
remains local; `src/graph/campusAlignment.json` defines a similarity for each
registered building, and the loader converts nodes before computing any edge
distance. Runtime nodes have only global positions. The user explicitly chose
to omit unaligned `holt` until later; unknown non-excluded alignments fail.

See `references/ocon.md`, `references/lang.md`, `references/outdoor.md` for the
matched landmarks, residuals, explicit entrance links and manual-review limits.
No GPS-input API, meter migration, accessibility router or routing algorithm
redesign was introduced. Historical design recommendations below remain context
and do not override the implemented feet convention.

## Map-informed outdoor walkability (user guidance, 2026-10-25)

The user states that the majority of the area around campus buildings is
walkable. Treat this as a user-provided working assumption for campus outdoor
graphs. Give visual analysis of the campus map image greater weight than strict
OSM way/node coverage when filling gaps: an apparently continuous open courtyard,
plaza or building approach can justify a provisional walking connection even
when no exact OSM path backs it. Missing OSM geometry alone is not a reason to
leave an otherwise plausible connection absent.

Keep these inferences easy to find and correct:

- Assign each assumed connection or area a stable review ID. Record the affected
  node/edge IDs, location or extent, source image path, visual reasoning, date,
  and status in graph metadata and companion manual-review notes. Label it as
  inferred from the map under the general walkability assumption, separately
  from OSM-backed geometry and specifically user-confirmed connections.
- Mark each assumed location with its review ID in verification overlays and
  any requested final preview. Show the affected segment/area clearly enough
  that a reviewer can identify and correct a mistaken inference, rather than
  relying on an unlocated general disclaimer. Preserve its provenance when
  regenerating the data or preview.
- Respect visible walls, fences, water, level differences and explicit access
  restrictions. General outdoor walkability does not establish an unshown
  doorway, an opening through a fence, or wheelchair accessibility. Ask a
  targeted question where imagery leaves a material obstruction or ambiguity.

The map image remains a rendered interpretation of source data, not a field
survey. This guidance permits labelled, reviewable inference; it does not turn
those assumptions into verified OSM facts. It does not authorize runtime
display/UI changes or unrequested final-preview regeneration.

## Earlier discussion

The user intends to connect indoor graphs to a separate outdoor graph at entrance nodes, anchor a node geographically, and derive GPS coordinates for the rest. This discussion did not authorize GPS conversion during ordinary floor generation. This design is also not confirmed.

## Anchor limitations

One GPS point fixes translation/location, not rotation or scale. It suffices mathematically only when orientation and scale are independently known. Otherwise, two well-separated matched reference points establish translation, rotation, and uniform scale; three or more help detect errors. Each independently drawn building needs alignment. Outdoor connectivity alone does not determine placement.

Check a known real-world measurement where available. Anchoring cannot remove errors in printed scale, north arrows, manual digitization, dated drawings, or reference measurements. Do not relabel arbitrary X/Y as latitude/longitude or call provisional vertical distances surveyed.

## Coordinate representations

The recommendation was to retain local drawing coordinates for PDF comparison, establish shared campus coordinates in meters for future geometry and routing, and derive latitude/longitude for GPS input and map display. **Current local graphs remain in feet.** Campus meters are a future recommendation, not an implemented migration; any future migration must convert coordinates/distances consistently and retain source transforms.

Latitude/longitude are angular units. The current Euclidean X/Y nearest-node calculation must not treat them as feet/meters. Transform incoming GPS through an appropriate geographic/projected coordinate system. Preserve building/floor identity because vertically stacked rooms share horizontal coordinates and GPS generally cannot reliably determine indoor floors.

Connect outdoor paths to explicit entrance IDs through verified walkable segments, not proximity across walls. Stair, ramp, winding-path, and elevator distances/costs remain distinct from horizontal endpoint distance. Waiting time and effort are cost-model choices, not physical measurements.

When only digitizing floors, retain the existing building frame and enough provenance for later calibration. Do not silently introduce a campus origin, switch coordinates to GPS, or redesign the routing API.
