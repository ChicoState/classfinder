# ClassFinder

ClassFinder gives students room-to-room directions across twelve campus buildings. Select two rooms to see both building maps and the outdoor walking route. Click the destination building marker to jump to arrival directions. The interface uses the existing campus map and floor plans.

## Repository map

- `infrastructure_plan.md` — selected infrastructure decisions.
- `package.json` — npm scripts and development dependencies.
- `Dockerfile`, `compose.yml`, `.dockerignore` — reproducible Node.js development environment.
- `scripts/` — infrastructure-only verification.
- `index.html` — Vite's browser document shell.
- `src/` — React application source, with `main.tsx` as the entrypoint, `App.tsx` as the root component, shared graph contracts in `lib/graph.ts`, and graph-assembly helpers in `graph/`.
- `src/data/` — bundled floor-plan JSON and a local visual verification preview.
- `tests/unit/` — graph loading and routing tests; `tests/ui/` and `tests/e2e/` verify room selection and the outdoor-to-indoor handoff.
- `src/routing/` — bundled OpenStreetMap paths, entrance handoffs, room inventory and journey planning.
- `tools/import-campus-paths.py` — optional maintainer tool to refresh the outdoor snapshot.
- `.github/workflows/` — pull-request checks and GitHub Pages release deployment.
- `.agents/skills/` — project-provided agent skills.

## Floor-plan graph data

`src/graph/graphLoader.ts` discovers all `src/data/<building-id>/*.json` files
at build time using Vite's eager glob imports and returns fresh
`[Graph, Nodes]` maps. Each JSON edge is stored once and loaded in both directions,
preserving its weight, kind, and optional accessibility flag; its runtime distance
is derived from the endpoint coordinates. Coordinates and distances are in feet. For O'Connell, the lower lobby's AO-marked exterior doorway serves as
the origin. Upper floors are approximately aligned using the passenger elevator
shaft. The JSON metadata records the PDF scale and digitization limitations.
The upper stair connects floors 1–2 only; the west and lower stairs
and both elevators connect floors 1–4.

Filter nodes by building before using `findNodeNearPosition` with the known starting floor, then pass the resulting
start node and the destination node to `calculatePath`. Each returned path edge
contains both `from` and `to` node IDs so instruction code can derive the direction
of consecutive segments. Nearest-node lookup uses only X/Y within the requested
floor.

`src/pathingAdapter.ts` converts a computed path into ordered, generic navigation
instructions. Corridors and outdoor paths use left/right/straight guidance; doors,
ramps, stairs, and elevators use their movement type, with vertical transfers naming
their destination floor.

This data belongs in `src/data` because it is part of the application and is
imported by the loader. A root-level data directory would make more sense for
independent source datasets or preprocessing inputs. The original PDFs remain in
`csuc-floor-plans/`; registered `floor-*-preview.png` files are application assets
used by the indoor viewer and must be preserved. The loader
trusts the bundled dataset; it is not an arbitrary JSON upload parser.

## Getting Started

### Prerequisites

1. Install [Git](https://git-scm.com/downloads) and confirm `git --version` works.
2. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows or macOS, or Docker Engine on Linux. Confirm `docker version` and `docker compose version` work.
3. Install a current browser. A code editor with TypeScript support is recommended.

Node.js and npm run inside the development container. The image is pinned to Node.js 22.14.0; update it deliberately to a supported LTS line.

### Install dependencies

On a host with Node.js 22 LTS installed, run:

```sh
npm ci
```

Or start the development environment with Docker:

```sh
docker compose up --build
```

The container bind-mounts the repository and keeps `node_modules` in a named volume. Stop it with:

```sh
docker compose down
```

### Verify the infrastructure

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

Tests cover graph loading, indoor/outdoor routing, room selection and the building-marker handoff.
See [classroom directions](docs/classroom-directions.md) for the data source, refresh process and known limitations.

## GitHub configuration

The release workflow deploys version tags to GitHub Pages. Before its first release, enable GitHub Pages with **GitHub Actions** as the source and create/protect the `production` environment if an approval gate is wanted. No deployment secret is required for GitHub Pages; the workflow uses GitHub's scoped `GITHUB_TOKEN` permissions.

## Troubleshooting

- **`docker` is not recognized or the daemon is unavailable:** Start Docker Desktop (or the Docker service) and rerun `docker version`.
- **Dependency install fails:** Use Node.js 22 LTS and rerun `npm ci`; do not mix npm with another package manager.
- **Port is already in use:** Stop the process using the future Vite development port or change the Compose port mapping when application development begins.
- **Docker reports an npm permission error:** Recreate the dependency volume after a prior run created it with root ownership:

  ```sh
  docker compose down -v
  docker compose up --build
  ```

  The `-v` removes only the local `node_modules` volume; dependencies will be installed again from `package-lock.json`.

- **GitHub Pages deployment fails:** Confirm Pages is enabled for GitHub Actions and that the repository allows the workflow's `pages: write` and `id-token: write` permissions.

Indoor maps are linked from the home page for all twelve bundled buildings.
`src/buildings/registry.ts` connects their floor images, coordinate calibration,
and initial routes to the shared viewer. The existing preview images are reused;
Holt floor 1 uses a raster rendering of its source PDF with the shared route
overlay. All buildings use plain maps and floor buttons without an embedded PDF
toolbar or dashboard. Campus markers without bundled graphs
show “Indoor map coming soon”.
