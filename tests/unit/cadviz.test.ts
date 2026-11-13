// @vitest-environment node
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  existsSync,
  utimesSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { check, resolveConfig } from 'prettier';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  align,
  applyFit,
  fitPairs,
  type Graph
} from '../../tools/cadviz/align.ts';
import { drawings, main } from '../../tools/cadviz/cli.ts';
import { findOda, toDxf } from '../../tools/cadviz/convert.ts';
import { plainText, readDxf } from '../../tools/cadviz/dxf.ts';
import { apply, distToRing, squareAngle } from '../../tools/cadviz/geometry.ts';
import { FACINGS, render, type Facing } from '../../tools/cadviz/render.ts';
import {
  kindOf,
  loadScene,
  roleOf,
  type Scene
} from '../../tools/cadviz/scene.ts';
import { testFloor } from './cadvizFixture.ts';

const scene = loadScene(testFloor(1));
const facings = Object.keys(FACINGS) as Facing[];

/** A ClassFinder-style graph whose room nodes sit on each room's door, in a made-up frame. */
const HIDDEN = {
  a: [0.5 * 0.995, -0.86 * 0.995] as [number, number],
  b: [-40, 25] as [number, number]
};
function graphFor(
  s: Scene,
  floor = 1
): Graph & { edges: Array<{ from: string; to: string }> } {
  const inv = (p: { x: number; y: number }) => {
    const [ar, ai] = HIDDEN.a;
    const d = ar * ar + ai * ai;
    const x = p.x - HIDDEN.b[0];
    const y = p.y - HIDDEN.b[1];
    return { x: (x * ar + y * ai) / d, y: (y * ar - x * ai) / d };
  };
  const mids = s.doors.map((d) => ({
    x: (d.from.x + d.to.x) / 2,
    y: (d.from.y + d.to.y) / 2
  }));
  const nodes = s.rooms.flatMap((r) => {
    const door = mids.find((m) => distToRing(m, r.ring) < 1);
    return door && r.number
      ? [
          {
            id: `test-${floor}-room-${r.number.toLowerCase()}`,
            position: inv(door)
          }
        ]
      : [];
  });
  nodes.push({ id: `test-${floor}-hall`, position: { x: 0, y: 0 } });
  return {
    nodes,
    edges: [{ from: nodes[0].id, to: nodes[nodes.length - 1].id }]
  };
}

describe('reading drawings', () => {
  it('keeps only mapped layers, so restricted and title-block text is never read', () => {
    const kept = readDxf(
      testFloor(1),
      (layer) => !!roleOf(layer) && roleOf(layer) !== 'restricted'
    );
    const text = JSON.stringify(kept.entities);
    expect(kept.unitsPerFoot).toBe(12);
    expect(text).not.toContain('SECRET');
    expect(text).not.toContain('DOE');
    expect(kept.entities.some((e) => e.layer.startsWith('E-'))).toBe(false);
  });

  it('turns MTEXT markup into plain text and mirrors flipped arcs', () => {
    expect(plainText('{\\fArial|b1;100D\\PCORRIDOR}')).toBe('100D\nCORRIDOR');
    const dxf =
      '0\nSECTION\n2\nENTITIES\n0\nARC\n8\nA-DOOR\n10\n5\n20\n0\n40\n3\n50\n0\n51\n90\n230\n-1\n0\nENDSEC';
    const [a] = readDxf(dxf, () => true).entities;
    expect(a).toMatchObject({
      type: 'ARC',
      center: { x: -5, y: 0 },
      start: 90,
      end: 180
    });
    expect(readDxf('0\nEOF\n', () => true).entities).toEqual([]);
  });

  it('builds rooms, kinds, doors and entrances in north-up feet', () => {
    const kinds = Object.fromEntries(
      scene.rooms.map((r) => [r.number, r.kind])
    );
    expect(scene.rooms).toHaveLength(10);
    expect(kinds).toMatchObject({
      '100': 'hall',
      '101': 'room',
      '103': 'restroom',
      '105': 'private'
    });
    expect(kinds).toMatchObject({ '10B': 'stair', '192': 'elevator' });
    expect(scene.rooms.find((r) => r.number === '103')?.gender).toBe('women');
    expect(scene.northUp).toBe(true);
    expect(squareAngle(scene.outline.flat())).toBeCloseTo(-29.13, 1);
    expect(scene.doors.filter((d) => d.entrance)).toHaveLength(2);
    expect(scene.doors.filter((d) => d.accessible)).toHaveLength(1);
    expect(kindOf('LECTURE')).toBe('room');
  });

  it('falls back to the rooms when there is no building outline or survey', () => {
    const plain = loadScene(testFloor(2, false).replace(/A-CTRL/g, 'A-NOTE'));
    expect(plain.northUp).toBe(false);
    expect(plain.outline).toHaveLength(1);
    expect(plain.rooms).toHaveLength(10);
  });
});

describe('rendering', () => {
  it('draws four facings a quarter turn apart, wide when facing N and tall when facing E', () => {
    const images = Object.fromEntries(
      facings.map((f) => [f, render(scene, f)])
    );
    expect(images.N.layout.width).toBeGreaterThan(images.N.layout.height);
    expect(images.E.layout.height).toBeGreaterThan(images.E.layout.width);
    expect(images.S.layout).toMatchObject({
      width: images.N.layout.width,
      height: images.N.layout.height
    });
  });

  it.each(facings)(
    'facing %s: upright labels inside the image, private rooms unlabelled',
    (f) => {
      const { svg, layout } = render(scene, f);
      const labels = [
        ...svg.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"[^>]*>([^<]+)</g)
      ];
      expect(labels.map((m) => m[3])).toContain('101');
      for (const [, x, y] of labels) {
        expect(Number(x)).toBeGreaterThanOrEqual(0);
        expect(Number(x)).toBeLessThanOrEqual(layout.width);
        expect(Number(y)).toBeLessThanOrEqual(layout.height);
      }
      expect(svg).toContain('data-room="101"');
      expect(svg).not.toContain('data-room="105"');
      expect(svg).not.toMatch(/>105</);
      expect(svg).toContain('#9d2235'); // Chico Red entrances and compass
      expect(svg).not.toContain('polyline');
    }
  );

  it('applies style overrides and can leave out labels and overlays', () => {
    const { svg } = render(scene, 'N', {
      background: '#123456',
      labels: false,
      badges: false,
      compass: false
    });
    expect(svg).toContain('#123456');
    expect(svg).not.toContain('<text');
  });
});

describe('aligning the navigation graph', () => {
  it('recovers the graph frame from room numbers and doors', () => {
    const fit = align(graphFor(scene), scene);
    expect(fit.used).toBeGreaterThanOrEqual(4);
    expect(fit.medianFt).toBeLessThan(0.05);
    expect(fit.a[0]).toBeCloseTo(HIDDEN.a[0], 3);
    expect(fit.a[1]).toBeCloseTo(HIDDEN.a[1], 3);
    expect(fit.b[0]).toBeCloseTo(HIDDEN.b[0], 1);
    expect(() =>
      align(
        { nodes: [{ id: 'x-1-room-999', position: { x: 0, y: 0 } }] },
        scene
      )
    ).toThrow(/wrong floor/);
  });

  it.each(facings)(
    'facing %s: graphToPx places graph points like plan points, graphUp points up',
    (f) => {
      const fit = align(graphFor(scene), scene);
      const { layout, svg } = render(scene, f, {}, fit);
      const planToPx = svg
        .match(/matrix\(([^)]+)\)/)![1]
        .split(' ')
        .map(Number) as Parameters<typeof apply>[0];
      const g = { x: 30, y: -12 };
      const direct = apply(layout.graphToPx!, g);
      const viaPlan = apply(planToPx, applyFit(fit, g));
      expect(direct.x).toBeCloseTo(viaPlan.x, 0);
      expect(direct.y).toBeCloseTo(viaPlan.y, 0);
      const [ux, uy] = layout.graphUp!;
      const m = layout.graphToPx!;
      expect(Math.abs(m[0] * ux + m[2] * uy)).toBeLessThan(1e-3);
      expect(m[1] * ux + m[3] * uy).toBeLessThan(0);
    }
  );

  it('fits a pure similarity exactly', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 5 }
    ];
    const fit = fitPairs(pts.map((p) => [p, applyFit(HIDDEN, p)]));
    expect(fit.a[0]).toBeCloseTo(HIDDEN.a[0], 9);
    expect(fit.b[1]).toBeCloseTo(HIDDEN.b[1], 9);
  });
});

describe('command line', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
    vi.restoreAllMocks();
  });

  function workspace() {
    const root = mkdtempSync(join(tmpdir(), 'cadviz-test-'));
    const cad = join(root, 'cad');
    mkdirSync(cad);
    writeFileSync(join(cad, 'TestHall-1.dxf'), testFloor(1));
    writeFileSync(join(cad, 'TestHall-2.dxf'), testFloor(2));
    writeFileSync(join(cad, 'Basemap.dxf'), testFloor(1)); // no floor number: skipped
    writeFileSync(join(cad, 'Broken-3.dxf'), 'not a drawing'); // no rooms: skipped
    const repo = join(root, 'repo');
    mkdirSync(join(repo, 'src', 'data', 'test'), { recursive: true });
    writeFileSync(
      join(repo, 'src', 'data', 'test', 'floor-1.json'),
      JSON.stringify(graphFor(scene))
    );
    return { cad, repo };
  }

  it('writes four SVGs per floor and a prettier-formatted maps.json, skipping unusable files', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { cad, repo } = workspace();
    expect(await main([cad, '--building', 'test'], repo)).toBe(1);
    const out = join(repo, 'src', 'data', 'test', 'maps');
    for (const floor of [1, 2]) {
      for (const f of facings)
        expect(existsSync(join(out, `floor-${floor}-${f}.svg`))).toBe(true);
    }
    const index = join(out, 'maps.json');
    const maps = JSON.parse(readFileSync(index, 'utf8'));
    expect(maps.floors['1'].alignment.used).toBeGreaterThanOrEqual(4);
    expect(maps.floors['1'].E.graphToPx).toHaveLength(6);
    expect(maps.floors['2'].E.graphToPx).toBeUndefined(); // no graph for floor 2
    expect(
      await check(readFileSync(index, 'utf8'), {
        ...(await resolveConfig(index)),
        parser: 'json'
      })
    ).toBe(true);
    const printed = log.mock.calls.flat().join('\n');
    expect(printed).toMatch(/Basemap\.dxf: skipped/);
    expect(printed).toMatch(/Broken-3\.dxf: skipped \(no rooms/);
    const preview = /preview: file:\/\/(.+)/.exec(printed)![1];
    expect(readFileSync(decodeURI(preview), 'utf8')).toContain('class="graph"');

    // A second run for one floor keeps the other floors in maps.json.
    expect(
      await main([join(cad, 'TestHall-2.dxf'), '--building', 'test'], repo)
    ).toBe(0);
    expect(Object.keys(JSON.parse(readFileSync(index, 'utf8')).floors)).toEqual(
      ['1', '2']
    );
  });

  it('applies a style file and rejects a bad building id', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { cad, repo } = workspace();
    const style = join(cad, 'style.json');
    writeFileSync(style, JSON.stringify({ accent: '#00ff00' }));
    await main(
      [join(cad, 'TestHall-1.dxf'), '--building', 'test', '--style', style],
      repo
    );
    expect(
      readFileSync(join(repo, 'src/data/test/maps/floor-1-N.svg'), 'utf8')
    ).toContain('#00ff00');
    expect(await main([cad, '--building', '../x'], repo)).toBe(2);
    expect(error).toHaveBeenCalled();
  });

  it('finds drawings in folders and prefers a DXF over its DWG', () => {
    const { cad } = workspace();
    writeFileSync(join(cad, 'TestHall-1.dwg'), 'dwg');
    writeFileSync(join(cad, 'Other-4.dwg'), 'dwg');
    const found = drawings([cad]).map((p) => p.split(/[\\/]/).pop());
    expect(found).toContain('TestHall-1.dxf');
    expect(found).not.toContain('TestHall-1.dwg');
    expect(found).toContain('Other-4.dwg');
  });

  it('converts DWG only with a converter, and reuses an up-to-date DXF', () => {
    const { cad } = workspace();
    const dwg = join(cad, 'TestHall-1.dwg');
    writeFileSync(dwg, 'dwg');
    utimesSync(dwg, new Date(0), new Date(0));
    expect(toDxf(join(cad, 'TestHall-1.dxf'))).toMatch(/TestHall-1\.dxf$/);
    expect(toDxf(dwg)).toMatch(/TestHall-1\.dxf$/); // cached conversion is newer
    process.env.CADVIZ_ODA = join(cad, 'missing-converter');
    expect(findOda()).toBe(process.env.CADVIZ_ODA);
    expect(() => toDxf(join(cad, 'New-5.dwg'))).toThrow();
    writeFileSync(join(cad, 'New-5.dwg'), 'dwg');
    expect(() => toDxf(join(cad, 'New-5.dwg'))).toThrow(/conversion failed/);
    process.env.CADVIZ_ODA = '';
    process.env.PATH = '';
    process.env.HOME = cad;
    if (!findOda())
      expect(() => toDxf(join(cad, 'New-5.dwg'))).toThrow(/no DWG converter/);
  });
});
