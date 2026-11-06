import { mkdir, writeFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';
import { getReadableInstructions } from '../../src/pathingAdapter';

it('generates directions from Butte room 101 across campus to Yolo room 108', async () => {
  const [graph, nodes] = loadGraphFromData();
  const start = nodes.get('butte-1-room-101' as NodeId)!;
  const end = nodes.get('yolo-1-room-108' as NodeId)!;
  expect(start.buildingId).toBe('butte');
  expect(end.buildingId).toBe('yolo');

  const path = calculatePath(graph, start, end);
  expect(path).not.toBeNull();
  let current = start.id;
  for (const edge of path!) {
    expect(edge.from).toBe(current);
    expect(graph.get(current)).toContainEqual({
      to: edge.to,
      distance: edge.distance,
      weight: edge.weight,
      type: edge.type,
      ...(edge.isAccessible === undefined
        ? {}
        : { isAccessible: edge.isAccessible })
    });
    current = edge.to;
  }
  expect(current).toBe(end.id);
  expect(path!.some((edge) => edge.type === 'outdoor')).toBe(true);

  const instructions = getReadableInstructions(
    start.position.x,
    start.position.y,
    start.floorId,
    end.position.x,
    end.position.y,
    end.floorId,
    start.buildingId,
    end.buildingId
  );
  expect(instructions).not.toBeNull();
  expect(instructions![0].position).toEqual(start.position);
  expect(instructions!.some((step) => step.floorId === 0)).toBe(true);
  expect(
    instructions!.every((step) => step.instruction.trim().length > 0)
  ).toBe(true);
  expect(instructions!.at(-1)).toEqual({
    position: end.position,
    floorId: end.floorId,
    instruction: 'You have arrived.'
  });

  const report = [
    '# Butte room 101 → Yolo room 108',
    '',
    `Distance: ${path!.reduce((sum, edge) => sum + edge.distance, 0).toFixed(2)} feet · ${path!.length} edges · ${instructions!.length} instructions`,
    '',
    'Regenerate: `npm test -- tests/unit/campusInstructions.test.ts`',
    '',
    'Directions below are verbatim output from the current instruction adapter. Floor 0 is outdoors.',
    '',
    ...instructions!.map(
      (step, index) =>
        `${index + 1}. **Floor ${step.floorId}:** ${step.instruction}`
    ),
    '',
    '## Graph node sequence',
    '',
    '```text',
    start.id,
    ...path!.map((edge) => `${edge.type} → ${edge.to}`),
    '```',
    ''
  ].join('\n');
  await mkdir('artifacts/campus-routes', { recursive: true });
  await writeFile('artifacts/campus-routes/instructions.md', report);
});
