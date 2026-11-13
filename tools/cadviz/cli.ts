/**
 * npm run cadviz -- <drawings or folders...> --building <id> [--style <file.json>]
 *
 * Writes four SVG base maps per floor (facing N, E, S, W) to src/data/<id>/maps/, with maps.json
 * describing each image. When src/data/<id>/floor-N.json exists, it is aligned with the drawing
 * and maps.json gains the matrix that places graph coordinates on each image. A preview page is
 * written to the temp folder for checking the result. Drawings themselves never enter the repo.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { format, resolveConfig } from 'prettier';
import { align, type Alignment, type Graph } from './align.ts';
import { toDxf } from './convert.ts';
import { apply } from './geometry.ts';
import {
  FACINGS,
  render,
  type Facing,
  type Layout,
  type Style
} from './render.ts';
import { loadScene } from './scene.ts';

type FloorMaps = { alignment?: Omit<Alignment, 'a' | 'b'> } & Partial<
  Record<Facing, Layout & { file: string }>
>;
type Maps = { building: string; floors: Record<string, FloorMaps> };

/** DWG/DXF files in the given files and folders; a DWG is skipped when its DXF is beside it. */
export function drawings(paths: string[]): string[] {
  const found: string[] = [];
  const walk = (p: string) => {
    if (statSync(p).isDirectory())
      readdirSync(p)
        .sort()
        .forEach((f) => walk(join(p, f)));
    else if (/\.(dwg|dxf)$/i.test(p)) found.push(p);
  };
  paths.forEach(walk);
  return found.filter(
    (p) => !/\.dwg$/i.test(p) || !found.includes(p.replace(/\.dwg$/i, '.dxf'))
  );
}

const floorOf = (file: string) =>
  /(\d+)$/.exec(basename(file).replace(/\.\w+$/, ''))?.[1];

export async function main(
  argv: string[],
  repo = process.cwd()
): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { building: { type: 'string' }, style: { type: 'string' } }
  });
  const building = values.building ?? '';
  if (!/^[a-z0-9-]+$/.test(building) || !positionals.length) {
    console.error(
      'usage: npm run cadviz -- <drawings or folders...> --building <id> [--style file]'
    );
    return 2;
  }
  // npm runs scripts from the repo root; paths are relative to where the command was typed.
  const here = (p: string) => resolve(process.env.INIT_CWD ?? process.cwd(), p);
  const style: Partial<Style> = values.style
    ? JSON.parse(readFileSync(here(values.style), 'utf8'))
    : {};
  const data = join(repo, 'src', 'data', building);
  const out = join(data, 'maps');
  mkdirSync(out, { recursive: true });
  const index = join(out, 'maps.json');
  const maps: Maps = existsSync(index)
    ? JSON.parse(readFileSync(index, 'utf8'))
    : { building, floors: {} };
  const preview: string[] = [];
  let failed = 0;

  for (const file of drawings(positionals.map(here))) {
    const floor = floorOf(file);
    try {
      if (!floor)
        throw new Error('no floor number at the end of the file name');
      const scene = loadScene(readFileSync(toDxf(file), 'utf8'));
      if (!scene.rooms.length)
        throw new Error('no rooms found on the A-AREA layer');
      const graphFile = join(data, `floor-${Number(floor)}.json`);
      const graph: Graph | undefined = existsSync(graphFile)
        ? JSON.parse(readFileSync(graphFile, 'utf8'))
        : undefined;
      const fit = graph ? align(graph, scene) : undefined;
      const entry: FloorMaps = {};
      if (fit)
        entry.alignment = {
          matched: fit.matched,
          used: fit.used,
          medianFt: fit.medianFt,
          maxFt: fit.maxFt
        };
      for (const facing of Object.keys(FACINGS) as Facing[]) {
        const { svg, layout } = render(scene, facing, style, fit);
        const name = `floor-${Number(floor)}-${facing}.svg`;
        writeFileSync(join(out, name), svg);
        entry[facing] = { file: name, ...layout };
        preview.push(
          previewCard(
            `Floor ${Number(floor)} · facing ${facing}`,
            svg,
            layout,
            graph
          )
        );
      }
      maps.floors[String(Number(floor))] = entry;
      const note = fit
        ? `, graph ${fit.used}/${fit.matched} rooms, median ${fit.medianFt} ft`
        : '';
      console.log(
        `${basename(file)}: floor ${Number(floor)}, ${scene.rooms.length} rooms${note}`
      );
    } catch (err) {
      failed++;
      console.log(
        `${basename(file)}: skipped (${err instanceof Error ? err.message : err})`
      );
    }
  }

  const json = JSON.stringify(maps);
  writeFileSync(
    index,
    await format(json, { ...(await resolveConfig(index)), parser: 'json' })
  );
  const page = join(tmpdir(), `cadviz-${building}.html`);
  writeFileSync(page, previewPage(building, preview));
  console.log(`wrote ${out}\npreview: ${pathToFileURL(page).href}`);
  return failed ? 1 : 0;
}

/** One image with the aligned graph drawn over it (preview only; never written to the repo). */
function previewCard(
  title: string,
  svg: string,
  layout: Layout,
  graph?: Graph & {
    edges?: Array<{ from: string; to: string }>;
  }
): string {
  let overlay = '';
  if (graph && layout.graphToPx) {
    const m = layout.graphToPx;
    const at = new Map(
      (graph.nodes ?? []).map((n) => [n.id, apply(m, n.position)])
    );
    const lines = (graph.edges ?? []).flatMap((e) => {
      const [p, q] = [at.get(e.from), at.get(e.to)];
      return p && q
        ? [`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`]
        : [];
    });
    const dots = [...at].map(
      ([id, p]) =>
        `<circle cx="${p.x}" cy="${p.y}" r="3"><title>${id}</title></circle>`
    );
    overlay = `<g class="graph" stroke="#1971c2" fill="#1971c2" stroke-width="2" opacity="0.8">${lines.join('')}${dots.join('')}</g>`;
  }
  return `<figure><figcaption>${title}</figcaption>${svg.replace('</svg>', `${overlay}</svg>`)}</figure>`;
}

function previewPage(building: string, cards: string[]): string {
  return `<!doctype html><meta charset="utf-8"><title>cadviz: ${building}</title>
<style>body{margin:0;padding:16px;font:14px Arial,sans-serif;background:#ececec}
label{display:block;margin-bottom:12px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:16px}
figure{margin:0;background:#fff;padding:8px;border-radius:4px}figcaption{font-weight:700;margin-bottom:6px}
svg{width:100%;height:auto}body:has(#g:not(:checked)) .graph{display:none}</style>
<label><input type="checkbox" id="g" checked> show the aligned navigation graph</label>
<main>${cards.join('\n')}</main>`;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
