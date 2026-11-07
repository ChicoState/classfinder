import { buildings } from '../buildings/registry';
import { entrances } from './entrances';
import { getRooms, indoorLeg } from './indoorRouting';
import { outdoorLeg } from './outdoorRouting';
import type { IndoorLeg, Room } from './indoorRouting';
import type { OutdoorLeg } from './outdoorRouting';
export { getRooms } from './indoorRouting';

export type Journey = {
  from: Room;
  to: Room;
  departure: IndoorLeg | null;
  outdoor: OutdoorLeg | null;
  arrival: IndoorLeg;
};
const rooms = new Map(
  Object.keys(buildings)
    .flatMap(getRooms)
    .map((room) => [room.id, room])
);

export function planJourney(fromId: string, toId: string): Journey | null {
  const from = rooms.get(fromId);
  const to = rooms.get(toId);
  if (!from || !to) return null;
  if (from.buildingId === to.buildingId) {
    const arrival = indoorLeg(from.id, to.id);
    return arrival
      ? { from, to, departure: null, outdoor: null, arrival }
      : null;
  }
  const startEntrance = entrances[from.buildingId];
  const endEntrance = entrances[to.buildingId];
  if (!startEntrance || !endEntrance) return null;
  const departure = indoorLeg(from.id, startEntrance.indoorId);
  const outdoor = outdoorLeg(from.buildingId, to.buildingId);
  const arrival = indoorLeg(endEntrance.indoorId, to.id);
  return departure && outdoor && arrival
    ? { from, to, departure, outdoor, arrival }
    : null;
}
