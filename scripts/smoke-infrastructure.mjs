import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const requiredFiles = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'eslint.config.js',
  'vitest.config.ts',
  'playwright.config.ts',
  'Dockerfile',
  'compose.yml',
  '.github/workflows/pr-checks.yml',
  '.github/workflows/release.yml'
];
for (const file of requiredFiles) await access(resolve(file));

const pkg = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
for (const script of [
  'format:check',
  'lint',
  'typecheck',
  'test',
  'coverage',
  'test:e2e',
  'build',
  'preview'
]) {
  if (!pkg.scripts?.[script])
    throw new Error(`Missing required npm script: ${script}`);
}
console.log('Infrastructure configuration files and npm scripts are present.');
