# ClassFinder

ClassFinder will help students enter classes and receive campus directions. The repository currently contains the development infrastructure only; production application code, screens, routing logic, and campus data have not been created.

## Repository map

- `infrastructure_plan.md` — selected infrastructure decisions.
- `package.json` — npm scripts and development dependencies.
- `Dockerfile`, `compose.yml`, `.dockerignore` — reproducible Node.js development environment.
- `scripts/` — infrastructure-only verification.
- `tests/` — future unit, UI, and end-to-end test locations; no product tests exist yet.
- `.github/workflows/` — pull-request checks and GitHub Pages release deployment.
- `.agents/skills/` — project-provided agent skills.
- `src/` — not created yet; application implementation owns this directory.

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

Or start the development environment with Docker after application code provides the Vite entrypoint:

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

`npm run build` is intentionally not runnable until the application implementation adds Vite's `index.html` and entrypoint. The test commands currently validate the configured harness and pass with no product tests; application work must add meaningful tests before relying on coverage.

## GitHub configuration

The release workflow deploys version tags to GitHub Pages. Before its first release, enable GitHub Pages with **GitHub Actions** as the source and create/protect the `production` environment if an approval gate is wanted. No deployment secret is required for GitHub Pages; the workflow uses GitHub's scoped `GITHUB_TOKEN` permissions.

## Troubleshooting

- **`docker` is not recognized or the daemon is unavailable:** Start Docker Desktop (or the Docker service) and rerun `docker version`.
- **Dependency install fails:** Use Node.js 22 LTS and rerun `npm ci`; do not mix npm with another package manager.
- **Port is already in use:** Stop the process using the future Vite development port or change the Compose port mapping when application development begins.
- **GitHub Pages deployment fails:** Confirm Pages is enabled for GitHub Actions and that the repository allows the workflow's `pages: write` and `id-token: write` permissions.
