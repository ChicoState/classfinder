# Agent Guidance

## Project status

This repository has an infrastructure foundation, a React application shell, and initial graph loading and routing logic. `infrastructure_plan.md` is the source of truth for platform and tooling decisions; class-entry and navigation user flows are not implemented yet.

## Repository map

- `infrastructure_plan.md`: approved infrastructure plan.
- `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`: TypeScript tooling.
- `Dockerfile`, `compose.yml`, `.dockerignore`: development container setup.
- `scripts/`: infrastructure smoke checks only.
- `tests/unit`: graph loading, assembly, and Dijkstra tests. `tests/ui` and `tests/e2e`: reserved for future user-flow tests.
- `.github/workflows/`: pull-request and GitHub Pages release automation.
- `src/`: React application source, graph contracts and Dijkstra in `lib/`, and the graph loader in `graph/`.
- `src/data/<building-id>/*.json`: automatically discovered at build time by the loader; each file has `edges` and may have `nodes` (connection files need no nodes). All nodes are initialized before two-way edges are added.
- `src/data/ocon/floor-1.json` through `floor-4.json`: bundled O'Connell graphs in approximately aligned, shared coordinates measured in feet. Undirected edges are stored once; the loader returns fresh maps and expands both directions.
- `src/data/ocon/connections.json`: adjacent-floor stairs and elevators, currently using user-selected provisional distances of 15 feet. Filter starting-node candidates by building and floor before coordinate-based routing.
- `src/data/ocon/floor-*-preview.png`: local visual verification artifacts, not application imports or files to commit.
- `csuc-floor-plans/`: original reference PDFs for digitization.
- API/backend, database, and local services: not required by the plan.
- `.agents/skills/`: local skill instructions.

## Required reading and boundaries

Read `infrastructure_plan.md`, this file, and applicable local skill instructions before changing infrastructure. Do not alter plan decisions without revising the plan through the infrastructure-planning process. Do not commit secrets, generated artifacts, `node_modules`, coverage output, or Playwright reports.

Infrastructure-only work must not create product pages, components, routes, handlers, domain models, route data, authentication, or business tests. Application work should use the frontend UI, test-driven development, browser-testing, security, documentation, review, CI/CD, and git-workflow skills as applicable; use infra-planner before changing infrastructure decisions and infra-builder to implement an approved plan.

## Verification

Run the applicable commands before a change is handed off:

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

The pull-request workflow mirrors these checks when application files and tests exist. Run `docker compose down` after local container work; do not leave containers or volumes running unintentionally.

## Change checklist

- Keep npm as the sole package manager and retain `package-lock.json`.
- Keep Docker development-only; GitHub Pages receives static build output, never a production container.
- Add or update meaningful tests with application behavior, then enforce the coverage threshold selected in the plan.
- Update this file and `README.md` whenever commands, paths, services, or workflows change.
- Use documentation and code-review skills before merging material changes.
