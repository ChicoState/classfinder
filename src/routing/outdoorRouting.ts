import data from './campus-paths.json';
import { entrances } from './entrances';
import { connectBothWays } from '../graph/graphLoader';
import { calculatePath } from '../lib/dijkstras';
import type { Graph, Nodes, NodeId } from '../lib/graph';

export type LatLng = [number, number];
export type OutdoorLeg = {
  positions: LatLng[];
  feet: number;
  instructions: string[];
  approaches: LatLng[][];
};
const positions: Record<string, LatLng> = Object.fromEntries(
  Object.entries(data.positions).map(([id, position]) => [
    id,
    [position[0], position[1]] as LatLng
  ])
);
const graph: Graph = new Map();
const nodes: Nodes = new Map();
const descriptions = new Map<string, string>();

function addNode(id: string, position: LatLng) {
  const nodeId = id as NodeId;
  nodes.set(nodeId, {
    id: nodeId,
    buildingId: null,
    floorId: 0,
    position: {
      x: (position[1] + 121.85) * 280560,
      y: (position[0] - 39.73) * 364812
    }
  });
  graph.set(nodeId, []);
}
function connect(a: string, b: string, description: string) {
  const from = nodes.get(a as NodeId)!;
  const to = nodes.get(b as NodeId)!;
  connectBothWays(graph, from.id, to.id, {
    type: 'outdoor',
    weight: 1,
    distance: Math.hypot(
      from.position.x - to.position.x,
      from.position.y - to.position.y
    )
  });
  descriptions.set(`${a}/${b}`, description);
  descriptions.set(`${b}/${a}`, description);
}
for (const [id, position] of Object.entries(positions)) addNode(id, position);
for (const way of data.ways) {
  for (let i = 1; i < way.nodes.length; i++) {
    connect(
      way.nodes[i - 1],
      way.nodes[i],
      way.name ||
        (way.kind === 'steps' ? 'the outdoor steps' : 'the campus path')
    );
  }
}
for (const entrance of Object.values(entrances)) {
  if (!entrance.approachId) continue;
  addNode(entrance.osmId, entrance.position);
  positions[entrance.osmId] = entrance.position;
  connect(
    entrance.osmId,
    entrance.approachId,
    'the approximate entrance approach'
  );
}

export function outdoorLeg(
  fromBuilding: string,
  toBuilding: string
): OutdoorLeg | null {
  const from = entrances[fromBuilding];
  const to = entrances[toBuilding];
  if (!from || !to) return null;
  const path = calculatePath(
    graph,
    nodes.get(from.osmId as NodeId)!,
    nodes.get(to.osmId as NodeId)!
  );
  if (!path) return null;
  const instructions: string[] = [];
  // Group consecutive segments by named path and compass heading.
  let previousKey = '';
  let distance = 0;
  let heading = '';
  let name = '';
  const flush = () => {
    if (distance)
      instructions.push(
        `Walk ${heading} on ${name} for about ${Math.max(1, Math.round(distance))} ft.`
      );
  };
  for (const edge of path) {
    const a = nodes.get(edge.from)!.position;
    const b = nodes.get(edge.to)!.position;
    const direction = [
      'north',
      'northeast',
      'east',
      'southeast',
      'south',
      'southwest',
      'west',
      'northwest'
    ][(Math.round(Math.atan2(b.x - a.x, b.y - a.y) / (Math.PI / 4)) + 8) % 8];
    const description = descriptions.get(`${edge.from}/${edge.to}`)!;
    const key = `${direction}/${description}`;
    if (key !== previousKey) {
      flush();
      distance = 0;
    }
    heading = direction;
    name = description;
    previousKey = key;
    distance += edge.distance;
  }
  flush();
  return {
    positions: [
      positions[from.osmId],
      ...path.map((edge) => positions[edge.to])
    ],
    feet: path.reduce((sum, edge) => sum + edge.distance, 0),
    instructions,
    approaches: [from, to]
      .filter((entry) => entry.approachId)
      .map((entry) => [positions[entry.osmId], positions[entry.approachId!]])
  };
}
