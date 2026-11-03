import { describe, expect, it } from 'vitest';

import { gpsToCampusPosition } from '../../src/graph/coordinates';

describe('gpsToCampusPosition', () => {
  it('maps the campus GPS origin to zero feet', () => {
    expect(gpsToCampusPosition(39.7276776, -121.8456054)).toEqual({
      x: 0,
      y: 0
    });
  });

  it.each([
    [39.7275422, -121.8473296, -484.96, -49.32],
    [39.727985, -121.847773, -609.67, 111.98]
  ])(
    'matches stored outdoor geometry for latitude %s, longitude %s',
    (latitude, longitude, x, y) => {
      const position = gpsToCampusPosition(latitude, longitude);
      expect(position.x).toBeCloseTo(x, 2);
      expect(position.y).toBeCloseTo(y, 2);
    }
  );
});
