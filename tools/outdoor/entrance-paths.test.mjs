import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clear, route } from './entrance-paths.mjs';

test('an outdoor approach detours around a building rather than crossing its walls', () => {
  const wall = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: 20 },
    { x: 0, y: 20 }
  ];
  const start = { x: -10, y: 10 },
    target = { x: 30, y: 10, id: 'target' };
  assert.equal(clear(start, target, [wall]), false);
  const path = route(start, [target], [wall], []);
  assert.ok(path.length > 1);
  assert.equal(path.at(-1).id, 'target');
  const steps = [start, ...path];
  for (let i = 1; i < steps.length; i++)
    assert.equal(clear(steps[i - 1], steps[i], [wall]), true);
});

test('a mapped fence blocks a direct approach to a nearby target', () => {
  const start = { x: -10, y: 0 },
    target = { x: 10, y: 0, id: 'target' };
  const fence = [
    { x: 0, y: -100 },
    { x: 0, y: 100 }
  ];
  assert.equal(clear(start, target, [], [fence]), false);
  const path = route(start, [target], [], [fence]);
  assert.ok(path.length > 1);
  const steps = [start, ...path];
  for (let i = 1; i < steps.length; i++)
    assert.equal(clear(steps[i - 1], steps[i], [], [fence]), true);
  const enclosure = [
    { x: 0, y: -20 },
    { x: 20, y: -20 },
    { x: 20, y: 20 },
    { x: 0, y: 20 },
    { x: 0, y: -20 }
  ];
  assert.throws(
    () => route(start, [target], [], [enclosure]),
    /No visible outdoor approach/
  );
});
