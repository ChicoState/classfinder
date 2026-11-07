import { describe, expect, it } from 'vitest';
import { getRooms, planJourney } from '../../src/routing/campusRouting';

describe('classroom journeys', () => {
  it('lists numbered rooms once with readable labels', () => {
    const rooms = getRooms('oconnell');
    expect(rooms.some((room) => room.label === 'Room 114 · Floor 1')).toBe(
      true
    );
    expect(rooms.every((room) => !room.label.includes('hall'))).toBe(true);
    expect(new Set(rooms.map((room) => room.label)).size).toBe(rooms.length);
  });
  it('connects rooms through exits and mapped outdoor paths', () => {
    const journey = planJourney('ocon-2-room-208', 'langdon-2-room-206');
    expect(journey).not.toBeNull();
    expect(journey!.departure!.nodes[0].id).toBe('ocon-2-room-208');
    expect(journey!.outdoor!.positions.length).toBeGreaterThan(2);
    expect(journey!.arrival.nodes.at(-1)!.id).toBe('langdon-2-room-206');
    expect(journey!.outdoor!.feet).toBeGreaterThan(0);
  });
  it('keeps same-building directions indoors', () => {
    const journey = planJourney('ocon-1-room-114', 'ocon-2-room-208');
    expect(journey).not.toBeNull();
    expect(journey!.outdoor).toBeNull();
    expect(journey!.arrival.nodes[0].id).toBe('ocon-1-room-114');
  });
  it('handles identical rooms and rejects unknown or non-room endpoints', () => {
    expect(
      planJourney('ocon-1-room-114', 'ocon-1-room-114')!.arrival.nodes
    ).toHaveLength(1);
    expect(planJourney('missing', 'ocon-1-room-114')).toBeNull();
    expect(planJourney('ocon-1-lobby-lower', 'ocon-1-room-114')).toBeNull();
  });
});

it('provides a complete journey to each bundled building', () => {
  for (const id of [
    'acker',
    'ayres',
    'butte',
    'glenn',
    'holt',
    'langdon',
    'modoc',
    'plumas',
    'tehama',
    'trinity',
    'yolo'
  ]) {
    const room = getRooms(id)[0];
    expect(planJourney('ocon-1-room-114', room.id), id).not.toBeNull();
  }
});
