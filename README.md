# ClassFinder

ClassFinder will help students enter classes and receive campus directions. The repository now contains the initial Vite/React application shell; class-entry behavior, routing logic, and campus data are still being built.

## Repository map

- `infrastructure_plan.md` — selected infrastructure decisions.
- `package.json` — npm scripts and development dependencies.
- `Dockerfile`, `compose.yml`, `.dockerignore` — reproducible Node.js development environment.
- `scripts/` — infrastructure-only verification.
- `index.html` — Vite's browser document shell.
- `src/` — React application source, with `main.tsx` as the entrypoint, `App.tsx` as the root component, shared graph contracts in `lib/graph.ts`, and graph-assembly helpers in `graph/`.
- `src/data/` — bundled floor-plan JSON and a local visual verification preview.
- `tests/unit/` — graph loading, graph assembly, and Dijkstra tests; `tests/ui/` and `tests/e2e/` are reserved for future flows.
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

Use `findNodeNearPosition` with the known starting floor, then pass the resulting
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
`csuc-floor-plans/`; `src/data/ocon/floor-*-preview.png` files are local review aids
and are not imported by the application or intended for commits. The loader
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
npm run test:e2e
npm run test:smoke
docker compose config
```

Unit tests cover graph loading and routing. UI and end-to-end coverage must be
added as application flows are implemented.

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
