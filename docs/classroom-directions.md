# Classroom-to-classroom directions

Students select From/To buildings and numbered rooms, then choose Get directions.
Different-building trips consist of a room-to-exit indoor leg, an outdoor walk,
and an entrance-to-room leg. Both building maps appear immediately when directions are generated.
The destination building marker jumps to the arrival directions.
Same-building trips open indoor directions directly. Changing either selection
clears the previous route. Selections are kept only in component state.

## Implementation

- `src/routing/indoorRouting.ts`: numbered-room inventory and indoor routes using
  the existing graph loader, Dijkstra algorithm and instruction formatter.
- `src/routing/campus-paths.json`: bundled OpenStreetMap pedestrian graph.
- `src/routing/entrances.ts`: explicit indoor/outdoor handoff table; graph IDs
  differ from UI building IDs for O'Connell (`ocon` / `oconnell`).
- `src/routing/outdoorRouting.ts`: outdoor graph assembly, distances in feet and
  compass instructions; local projection centered on campus, independent of the
  drawing coordinates used by indoor graphs.
- `src/routing/campusRouting.ts`: validates room IDs and assembles complete trips.
  Missing indoor or outdoor connections return no route rather than partial directions.
- `JourneyPlanner` and `CampusMap`: native room controls, route rendering and
  click-to-arrival interaction. Existing floor images and styling are reused.

Coordinate callers of `getReadableInstructions` must now provide a final
`buildingId` argument (the graph ID). Coordinates overlap between buildings, so
nearest-node searches must be restricted to the intended building and floor.

## Source and limitations

Outdoor data is © OpenStreetMap contributors, licensed under the
[Open Data Commons Open Database License](https://www.openstreetmap.org/copyright).
The bundled extract was downloaded on 2026-11-04 from the
[OpenStreetMap map API](https://api.openstreetmap.org/api/0.6/map?bbox=-121.854,39.723,-121.838,39.736).
The extract bounds are west -121.854, south 39.723, east -121.838, north 39.736.
Way and node IDs are retained for source inspection. Personal contributor metadata
is omitted. Tiles still load from OpenStreetMap; route calculation needs no
external routing API, backend or credentials.

The importer retains footways, pedestrian ways, paths, steps, cycleways and
living streets in the largest connected pedestrian component. It excludes
explicit private/no foot access, indoor ways, area polygons and restricted nodes.
It does not infer routes across disconnected streets or use vehicle-only roads.

Entrance-to-floor-plan matches are provisional manual associations. They are
not surveyed or field-verified. Tehama and Yolo lack connected OSM approaches
at the selected doors; explicit short approximate links (about 9 m and 13 m)
are displayed as dashed lines and described as approximate in the instructions.
Do not replace those with silent nearest-building-center snapping. Before treating
the routes as verified wayfinding, check each entrance match and those approaches
on site. The map marks handoff locations at the chosen entrances.

Floor plans include offices and other numbered rooms, so selectors say “Room”
rather than claiming a verified classroom inventory. Routes do not incorporate
live closures, door locks or accessibility guarantees. All building maps use the
same plain image viewer with floor buttons and a route overlay. Holt floor 1 is
rendered from its source PDF at 2× scale; no PDF toolbar is embedded.

## Refreshing outdoor data

Download the XML extract from the source URL above, then from the repository root:

```sh
python3 tools/import-campus-paths.py /tmp/campus.osm --downloaded YYYY-MM-DD
npx prettier --write src/routing/campus-paths.json
```

Python is optional maintainer tooling, not an application or development-container
requirement. The importer uses only Python's standard library. Review access tags,
entrance matches and approximate links whenever replacing the snapshot. Update
the date in this document and keep the ODbL attribution and source metadata.

## Validation

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run coverage
npm run build
PLAYWRIGHT_WEB_SERVER=true npm run test:e2e
npm run test:smoke
docker compose config
```

Unit tests cover room labels, endpoint validation, same-building and cross-building
routes, and trips to every bundled building. UI tests cover the indoor gate,
floor switching and clearing stale directions. Playwright exercises the actual
map marker, route line, keyboard focus and mobile layout against the production
build. No infrastructure/platform decision changes are required.
