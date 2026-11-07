import { buildings } from '../buildings/registry';
import { loadGraphFromData } from '../graph/graphLoader';
import { calculatePath } from '../lib/dijkstras';
import type { Node, NodeId } from '../lib/graph';
import { getNextInstruction } from '../pathingAdapter';

const [graph, nodes] = loadGraphFromData();

export type Room = { id: string; buildingId: string; label: string };
export type IndoorLeg = {
  nodes: Node[];
  feet: number;
  instructions: string[];
};

// Plans identify numbered rooms, including offices; they do not classify usage.
// Prefer the canonical doorway; fall back to a named door for rooms without one.
export function getRooms(buildingId: string): Room[] {
  const building = buildings[buildingId];
  if (!building) return [];
  const rooms = new Map<string, Room>();
  const candidates = [...nodes.values()]
    .filter((node) => node.buildingId === building.graphBuildingId)
    .sort((a, b) => a.id.length - b.id.length);
  for (const node of candidates) {
    const match = /-room-(\d+[A-Za-z]*)(?:-|$)/.exec(node.id);
    if (!match) continue;
    const label = `Room ${match[1]} · Floor ${node.floorId}`;
    if (!rooms.has(label)) rooms.set(label, { id: node.id, buildingId, label });
  }
  return [...rooms.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true })
  );
}

export function indoorLeg(startId: string, endId: string): IndoorLeg | null {
  const start = nodes.get(startId as NodeId);
  const end = nodes.get(endId as NodeId);
  if (!start || !end || start.buildingId !== end.buildingId) return null;
  const path = calculatePath(graph, start, end);
  if (!path) return null;
  const instructions = path.map((edge, index) =>
    getNextInstruction(index ? path[index - 1] : null, edge, nodes)
  );
  // Collapse repeated corridor instructions to keep the walking list short.
  return {
    nodes: [start, ...path.map((edge) => nodes.get(edge.to)!)],
    feet: path.reduce((total, edge) => total + edge.distance, 0),
    instructions: instructions.filter(
      (text, index) => text !== instructions[index - 1]
    )
  };
}
