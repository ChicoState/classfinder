# Agent Guidance

## Project status

This repository has an infrastructure foundation for the planned ClassFinder web application. `infrastructure_plan.md` is the source of truth for platform and tooling decisions; production application source, routes, data, and user flows are not created yet.

## Repository map

- `infrastructure_plan.md`: approved infrastructure plan.
- `package.json`, `tsconfig.json`, `eslint.config.js`, `.prettierrc.json`: TypeScript tooling.
- `Dockerfile`, `compose.yml`, `.dockerignore`: development container setup.
- `scripts/`: infrastructure smoke checks only.
- `tests/unit`, `tests/ui`, `tests/e2e`: reserved for future product tests.
- `.github/workflows/`: pull-request and GitHub Pages release automation.
- `src/`: not created yet; future frontend implementation location.
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
