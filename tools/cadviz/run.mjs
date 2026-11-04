// Runs cli.ts on any Node 22.6+: newer Node strips TypeScript types by default; older 22.x needs a flag.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const flags = process.features.typescript
  ? []
  : ['--experimental-strip-types', '--disable-warning=ExperimentalWarning'];
const cli = fileURLToPath(new URL('./cli.ts', import.meta.url));
const result = spawnSync(
  process.execPath,
  [...flags, cli, ...process.argv.slice(2)],
  {
    stdio: 'inherit'
  }
);
process.exit(result.status ?? 1);
