#Infrastructure Plan

> Planning only. This document describes future infrastructure work. No installations, configuration changes, containers, workflows, deployments, or other implementation files were created by the infrastructure-planning process.

## 1. Project and User Experience

- **Application:** ClassFinder, a campus class-direction tool.
- **Primary users:** Students.
- **Primary user task:** Enter classes and receive directions to them inside and outside campus buildings.
- **Selected platform:** Standard browser-based web application.
- **User-experience rationale:** Students can open a link immediately on a phone or computer without installing an app.
- **Required operating systems, browsers, or devices:** Current Chrome, Edge, Firefox, and Safari on desktop and mobile devices.
- **Offline or native-device requirements:** None; the app requires a connection to load and does not require native-device integration.

## 2. Connectivity and Application Shape

- **Connectivity model:** Self-contained.
- **Accounts and authentication:** None.
- **Backend required:** No; routes and campus reference data are bundled with the static application.
- **Cross-device persistence:** None.
- **Interaction between accounts:** None.
- **Primary application components:** React user interface, class-entry form, client-side route/directions logic, and static campus map/location data.

## 3. Selected Technology Stack

| Area                  | Selected technology | Purpose                                                    | Version policy                                                        |
| --------------------- | ------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| Primary language      | TypeScript          | Safer browser application code                             | Current supported stable release compatible with the selected tooling |
| Application framework | React               | Build the class-entry and directions interface             | Maintained stable major version                                       |
| Runtime or SDK        | Node.js             | Development, build, and test runtime                       | Supported LTS release                                                 |
| Package manager       | npm                 | Install and lock JavaScript dependencies                   | Version bundled with selected Node.js LTS                             |
| Build tool            | Vite                | Local development server and optimized static build        | Maintained stable major version                                       |
| Backend framework     | Omitted             | No backend is needed for the selected self-contained model | —                                                                     |

## 4. Storage and Persistence

- **Storage model:** No persistent user data.
- **Primary data store:** None; students re-enter classes for each use.
- **User files or object storage:** None.
- **Local-development storage:** Static campus route data kept in the future application source tree.
- **Production hosting model:** Static compiled assets on the selected managed static web host.
- **Schema and migration approach:** Not applicable; there is no database.
- **Backup, export, or recovery approach:** Version static campus data in Git; restore by releasing a prior verified build if needed.
- **Secrets and connection-string approach:** None in application code; any deployment credential is stored only as a GitHub Actions secret.
- **Reason this storage fits the access pattern:** The product explicitly does not save class entries and does not use accounts.

## 5. Testing Tools

| Test layer       | Tool or library                   | Planned scope                                                             | Planned execution point              |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| Unit             | Vitest                            | Direction calculations, validation, and data transformations              | Local and pull requests              |
| Integration / UI | React Testing Library with Vitest | Form entry, route-result rendering, and user feedback                     | Local and pull requests              |
| End-to-end       | Playwright                        | Student enters a class and receives suitable directions in a real browser | Pull requests and release validation |

## 6. Test Analysis

| Capability                            | Tool                       | Planned policy                                                                                                 |
| ------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Coverage                              | Vitest V8 coverage         | Collect coverage for unit and UI tests in pull requests                                                        |
| Coverage threshold or regression rule | Vitest coverage thresholds | Require a modest project threshold; set the initial numeric target after the first representative suite exists |
| Mutation testing                      | Omitted                    | Not selected                                                                                                   |
| Flaky-test or duration analysis       | Playwright reports         | Review failed traces and duration data when browser checks fail                                                |
| Reporting                             | GitHub Actions artifacts   | Upload coverage output and Playwright reports for failures                                                     |

## 7. Static Analysis and Security

| Check                             | Tool                | Planned enforcement                                                                                           |
| --------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| Formatting                        | Prettier            | Verify formatting in every pull request                                                                       |
| Linting                           | ESLint              | Block pull requests on lint failures                                                                          |
| Type checking                     | TypeScript compiler | Block pull requests on type errors                                                                            |
| Anti-pattern analysis             | Omitted             | Not selected for this minimal profile                                                                         |
| Dependency vulnerability scanning | Omitted             | Not selected; reassess before public launch                                                                   |
| Secret scanning                   | Omitted             | Not selected because the application has no runtime secrets; protect deployment credentials in GitHub secrets |
| Static security analysis          | Omitted             | Not selected for this minimal profile                                                                         |
| Container scanning                | Omitted             | No production container is released                                                                           |

## 8. Development Technologies Requiring Manual Installation

These are developer-workstation prerequisites that will not be supplied by the planned Docker environment.

| Technology                                              | Why it is needed                                | Required on which machines                          | Version policy                            | Planned installation or verification method               | Why Docker does not provide it                               |
| ------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| Git                                                     | Clone, branch, and contribute to the repository | All developer workstations                          | Maintained stable release                 | Future setup guide verifies `git --version`               | Docker does not provide host source-control integration      |
| Docker Desktop (Windows/macOS) or Docker Engine (Linux) | Run the reproducible development container      | Developer workstations using the container workflow | Supported release compatible with host OS | Future setup guide verifies Docker is running             | The host container engine manages containers and bind mounts |
| Web browser                                             | Manually exercise the student experience        | All developer workstations                          | Current stable browser                    | Future setup guide verifies a supported browser           | Browser interaction is a host-user activity                  |
| Code editor with TypeScript support                     | Edit and review the project                     | All contributors                                    | Maintained stable release                 | Developer preference; document a recommended editor later | Editor integration belongs on the host                       |

### Host tools intentionally not required

- **Not required because Docker supplies them:** Node.js, npm, Vite, test tools, and project dependencies.
- **Not required for this platform:** Native mobile SDKs, desktop packaging tools, database clients, and signing tools.

## 9. Docker Plan

- **Planned Docker role:** Reproducible development environment only.
- **Future files that would be created during implementation:** `Dockerfile`, `compose.yml` if convenient, `.dockerignore`, and development documentation.
- **Planned images and services:** One Node.js LTS development image; no database or other service container.
- **Development container behavior:** Bind-mount the source tree, install dependencies into a managed container volume, and expose the Vite development server.
- **Ports:** The future Vite development port only, with the exact port documented in the implementation configuration.
- **Bind mounts and named volumes:** Source bind mount; named volume for container-side dependencies to avoid host-platform conflicts.
- **Environment-variable and secret handling:** No runtime secrets; never bake deployment credentials into an image or source tree.
- **Local database or service containers:** None.
- **Production image or non-container release path:** Build static assets and deploy them directly to the selected managed static web host; no production image is used.
- **Build stages and hardening:** If a future preview image is added, use a multi-stage build, non-root user, minimal runtime image, `.dockerignore`, and no embedded secrets.
- **Planned future development command:** Document the Compose or Docker development command only when the implementation files exist.
- **Planned future production command:** Run the Vite production build in CI, then deploy its static output through the host's approved deployment mechanism.

## 10. GitHub Actions Plan

### A. Automated pull-request checks

- **Future workflow file:** `.github/workflows/pr-checks.yml`
- **Trigger:** `pull_request`.
- **Runner or matrix:** Ubuntu latest with the selected Node.js LTS release; add the requested browser dependencies for Playwright.
- **Permissions:** Read-only `contents`; grant no write permissions.
- **Planned jobs in order:**
  1. Checkout, set up Node.js, restore npm cache, and install from the lockfile.
  2. Verify Prettier formatting, run ESLint, and run TypeScript type checks.
  3. Run Vitest unit/UI tests with V8 coverage and enforce the agreed threshold.
  4. Build the static application.
  5. Run Playwright end-to-end tests against the built preview.
- **Service containers:** None.
- **Caching:** Cache npm's package-download directory using the lockfile as the cache key.
- **Coverage and analysis reporting:** Retain coverage output as an artifact; report test failures in workflow logs.
- **Failure artifacts:** Upload Playwright HTML report, traces, screenshots, and coverage output when relevant.
- **Checks that should block merging:** Formatting, linting, type checking, unit/UI tests, coverage threshold, production build, and end-to-end tests.
- **Proposed branch-protection settings:** Require the pull-request workflow checks, require an up-to-date branch, and require at least one approving review when collaborators are added.

### B. New-release deployment

- **Future workflow file:** `.github/workflows/release.yml`
- **Release trigger:** A pushed `v*` tag or manual `workflow_dispatch` after validation.
- **Release destination:** A managed static web-hosting provider, selected before implementation.
- **Runner or matrix:** Ubuntu latest with Node.js LTS.
- **Planned jobs in order:**
  1. Checkout, lockfile-enforced install, formatting/lint/type checks, tests, and production build.
  2. Deploy the validated static build to the configured hosting environment.
  3. Request the deployed public URL and run a smoke check of the main page.
- **Build artifacts:** The Vite static build directory; retain it temporarily for diagnosis.
- **Signing, notarization, or store requirements:** None for a web deployment.
- **Database migration step:** None.
- **Environment approval:** Use a protected GitHub `production` environment once a hosting account is connected.
- **Post-deployment verification:** Confirm the public page responds and the class-entry workflow loads.
- **Failed-release or rollback approach:** Redeploy the prior verified static build or revert the release tag, following the hosting provider's rollback process.

### GitHub configuration required later

| Name                        | Type               | Purpose                                                                                          |
| --------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `production`                | GitHub environment | Optional protected gate for live deployment                                                      |
| `STATIC_HOST_DEPLOY_TOKEN`  | GitHub secret      | Hosting-provider deployment credential; name may change to the provider's documented requirement |
| `STATIC_HOST_SITE_ID`       | GitHub variable    | Identifies the target site when the selected host requires it                                    |
| Managed static-host account | Provider account   | Owns the public deployment and domain settings                                                   |

## 11. Planned Repository Artifacts - Not Created by This Skill

- [ ] Application manifest or project file: `package.json`
- [ ] Lockfile: npm lockfile
- [ ] Test configuration: Vitest and Playwright configuration
- [ ] Static-analysis configuration: Prettier, ESLint, and TypeScript configuration
- [ ] Docker or Compose files: development `Dockerfile`, optional `compose.yml`, and `.dockerignore`
- [ ] `.github/workflows/pr-checks.yml`: pull-request validation workflow
- [ ] `.github/workflows/release.yml`: static-host deployment workflow
- [ ] Deployment configuration: provider-specific static-host configuration if required

## 12. Assumptions and Open Items

- **Assumptions:** Campus buildings, indoor paths, outdoor paths, and class-location mappings are available as maintainable static reference data; the first release does not need real-time closures, accessibility routing, or accounts.
- **Decisions still requiring an external account, credential, certificate, or organizational approval:** Select a managed static-host provider; obtain its account and deployment credential; confirm permission to publish campus wayfinding information.
- **Items to confirm before implementation begins:** The source and update process for campus route data, the intended public URL/domain, responsive design requirements, and the initial coverage threshold.
