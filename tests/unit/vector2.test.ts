import { expect, it } from 'vitest';
import {
  add,
  subtract,
  multiply,
  divide,
  dot,
  unit,
  magnitude,
  distance,
  angle
} from '../../src/lib/vector2';

it('calculates vector operations without mutating inputs', () => {
  const a = Object.freeze({ x: 3, y: 4 });
  const b = Object.freeze({ x: -1, y: 2 });
  expect(add(a, b)).toEqual({ x: 2, y: 6 });
  expect(subtract(a, b)).toEqual({ x: 4, y: 2 });
  expect(multiply(a, -2)).toEqual({ x: -6, y: -8 });
  expect(divide(a, 2)).toEqual({ x: 1.5, y: 2 });
  expect(dot(a, b)).toBe(5);
  expect(magnitude(a)).toBe(5);
  expect(distance(a, b)).toBeCloseTo(Math.sqrt(20));
  expect(unit(a)).toEqual({ x: 0.6, y: 0.8 });
  expect(angle({ x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
  expect(angle(a, multiply(a, -1))).toBeCloseTo(Math.PI);
});

it('preserves documented JavaScript semantics for zero vectors and division', () => {
  expect(divide({ x: 1, y: 0 }, 0)).toEqual({ x: Infinity, y: NaN });
  expect(unit({ x: 0, y: 0 })).toEqual({ x: NaN, y: NaN });
  expect(angle({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeNaN();
  expect(distance({ x: -3, y: -4 }, { x: -3, y: -4 })).toBe(0);
});
