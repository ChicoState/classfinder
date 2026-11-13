/** DWG -> DXF with the free ODA File Converter installed on this computer. DXF files pass through. */
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';

function onPath(name: string): string | undefined {
  for (const dir of (process.env.PATH ?? '').split(
    process.platform === 'win32' ? ';' : ':'
  )) {
    for (const ext of process.platform === 'win32' ? ['.exe', ''] : ['']) {
      if (dir && existsSync(join(dir, name + ext)))
        return join(dir, name + ext);
    }
  }
  return undefined;
}

/** The ODA File Converter: $CADVIZ_ODA, on PATH, the usual install places, or an AppImage. */
export function findOda(): string | undefined {
  if (process.env.CADVIZ_ODA) return process.env.CADVIZ_ODA;
  const places = [
    '/Applications/ODAFileConverter.app/Contents/MacOS/ODAFileConverter',
    '/usr/bin/ODAFileConverter'
  ];
  const inDir = (dir: string, test: (name: string) => boolean) =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter(test)
          .sort()
          .map((f) => join(dir, f))
      : [];
  return (
    onPath('ODAFileConverter') ??
    places.find((p) => existsSync(p)) ??
    inDir('C:/Program Files/ODA', (f) => f.startsWith('ODAFileConverter'))
      .map((d) => join(d, 'ODAFileConverter.exe'))
      .find((p) => existsSync(p)) ??
    [join(homedir(), 'Applications'), join(homedir(), 'Downloads')]
      .flatMap((d) => inDir(d, (f) => /^ODAFileConverter.*\.AppImage$/.test(f)))
      .at(-1)
  );
}

/** Path to a DXF for the drawing, converting (and caching next to it) when it is a DWG. */
export function toDxf(src: string): string {
  if (src.toLowerCase().endsWith('.dxf')) return src;
  const out = src.replace(/\.dwg$/i, '.dxf');
  if (existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs)
    return out;
  const oda = findOda();
  if (!oda) {
    throw new Error(
      'no DWG converter: install the free ODA File Converter, or use DXF files'
    );
  }
  const tmp = mkdtempSync(join(tmpdir(), 'cadviz-'));
  try {
    // ODA converts whole folders, so give it a folder with just this drawing.
    copyFileSync(src, join(tmp, basename(src)));
    mkdirSync(join(tmp, 'out'));
    let cmd = oda;
    let args = [
      tmp,
      join(tmp, 'out'),
      'ACAD2018',
      'DXF',
      '0',
      '1',
      basename(src)
    ];
    if (
      process.platform === 'linux' &&
      !process.env.DISPLAY &&
      onPath('xvfb-run')
    ) {
      [cmd, args] = ['xvfb-run', ['-a', oda, ...args]];
    }
    try {
      execFileSync(cmd, args, { stdio: 'pipe', timeout: 600_000 });
    } catch {
      // The converter's exit code is unreliable; whether a DXF appeared decides below.
    }
    const made = readdirSync(join(tmp, 'out')).find((f) =>
      f.toLowerCase().endsWith('.dxf')
    );
    if (!made) throw new Error(`conversion failed for ${basename(src)}`);
    mkdirSync(dirname(out), { recursive: true });
    copyFileSync(join(tmp, 'out', made), out); // copy: the temp folder may be on another disk
    return out;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
