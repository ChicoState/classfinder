import { calculatePath, findNodeNearPosition } from './lib/dijkstras';
import type { Path, PathEdge } from './lib/dijkstras';
import type { EdgeKind, Node, NodeId, Nodes } from './lib/graph';
import { dot, cross, magnitude, subtract } from './lib/vector2';
import type { Vector2 } from './lib/vector2';
import { loadGraphFromData } from './graph/graphLoader';
import { globalFrame } from './graph/campusAlignment.json';

const [graph, nodes] = loadGraphFromData();

export type Instruction = string;

export type ReadableNode = {
  position: Vector2;
  floorId: number;
  instruction: Instruction;
};

export type ReadablePath = ReadableNode[];

type Turn = 'straight' | 'left' | 'right' | 'around';

type InstructionContext = {
  fromNode: Node;
  turn: Turn;
  toNode: Node;
};

type InstructionFormatter = (context: InstructionContext) => Instruction;

const directionalEdgeTypes = new Set<EdgeKind>(['corridor', 'outdoor']);

function movementInstruction(turn: Turn, destination: string): Instruction {
  switch (turn) {
    case 'left':
      return `Turn left and continue ${destination}.`;
    case 'right':
      return `Turn right and continue ${destination}.`;
    case 'around':
      return `Turn around and continue ${destination}.`;
    case 'straight':
      return `Continue ${destination}.`;
  }
}

const instructionFormatters: Record<EdgeKind, InstructionFormatter> = {
  corridor: ({ turn }) => movementInstruction(turn, 'along the corridor'),
  door: () => 'Go through the doorway.',
  stairs: ({ fromNode, toNode }) =>
    fromNode.floorId === toNode.floorId
      ? 'Take the stairs.'
      : `Take the stairs to floor ${toNode.floorId}.`,
  elevator: ({ fromNode, toNode }) =>
    fromNode.floorId === toNode.floorId
      ? 'Take the elevator.'
      : `Take the elevator to floor ${toNode.floorId}.`,
  ramp: () => 'Use the ramp.',
  outdoor: ({ turn }) => movementInstruction(turn, 'outdoors')
};

function requireNode(nodes: Nodes, nodeId: NodeId): Node {
  const node = nodes.get(nodeId);

  if (!node) {
    throw new Error('Path references a node that is not in the loaded graph.');
  }

  return node;
}

// Classifies the turn between two edges in a path, based on the angle between them.
function classifyTurn(
  previousEdge: PathEdge | null,
  edge: PathEdge,
  nodes: Nodes
): Turn {
  if (
    !previousEdge ||
    !directionalEdgeTypes.has(previousEdge.type) ||
    !directionalEdgeTypes.has(edge.type)
  ) {
    return 'straight';
  }

  const previousFromNode = requireNode(nodes, previousEdge.from);
  const previousToNode = requireNode(nodes, previousEdge.to);
  const fromNode = requireNode(nodes, edge.from);
  const toNode = requireNode(nodes, edge.to);
  const incoming = subtract(previousToNode.position, previousFromNode.position);
  const outgoing = subtract(toNode.position, fromNode.position);
  const incomingMagnitude = magnitude(incoming);
  const outgoingMagnitude = magnitude(outgoing);

  if (incomingMagnitude === 0 || outgoingMagnitude === 0) {
    return 'straight';
  }

  const cosine = Math.max(
    -1,
    Math.min(
      1,
      dot(incoming, outgoing) / (incomingMagnitude * outgoingMagnitude)
    )
  );
  const angle = (Math.acos(cosine) * 180) / Math.PI;

  if (angle <= 30) return 'straight';
  if (angle > 150) return 'around';

  return cross(incoming, outgoing) > 0 ? 'left' : 'right';
}

// Returns the next instruction for a given edge in a path, based on the previous edge and the nodes in the graph.
export function getNextInstruction(
  previousEdge: PathEdge | null,
  edge: PathEdge,
  nodes: Nodes
): [Instruction, number] {
  const fromNode = requireNode(nodes, edge.from);
  let toNode = requireNode(nodes, edge.to);

  const formatter = instructionFormatters[edge.type];

  return [formatter({
    fromNode,
    turn: classifyTurn(previousEdge, edge, nodes),
    toNode
  }), 1];
}

function toReadableNode(node: Node, instruction: Instruction): ReadableNode {
  return {
    position: { ...node.position },
    floorId: node.floorId,
    instruction
  };
}

// Converts a path of edges into a readable path of nodes with instructions, based on the nodes in the graph and the destination node.
function createReadablePath(
  path: Path,
  nodes: Nodes,
  destination: Node
): ReadablePath {
  if (path.length === 0) {
    return [toReadableNode(destination, 'You have arrived.')];
  }

  const readablePath: ReadablePath = [];
  let i = 0;
  while (i < path.length) {
    const edge = path[i];
    const previousEdge = i > 0 ? path[i - 1] : null;

    let nextEdgeIndex = i + 1;
    while 

    const instruction = getNextInstruction(previousEdge, edge, nodes);

    const node = requireNode(nodes, edge.from);
    readablePath.push(toReadableNode(node, instruction));
    i++;
  }

  // const readablePath = path.map((edge, index) => {
  //   const fromNode = requireNode(nodes, edge.from);
  //   return toReadableNode(
  //     fromNode,
  //     getNextInstruction(index === 0 ? null : path[index - 1], edge, nodes)
  //   );
  // });

  const lastEdge = path.at(-1);
  if (!lastEdge) {
    throw new Error('Expected a final edge for a non-empty path.');
  }

  readablePath.push(
    toReadableNode(requireNode(nodes, lastEdge.to), 'You have arrived.')
  );
  return readablePath;
}

// Calculates a readable path of nodes with instructions from a starting position to an ending position, based on the nodes in the graph and the building ID.
// start and end building ids are optional, used to help ensure the node found is in the correct building. By default it assumes you could be anywhere.
// You can also pass 'outside' to filter out all building nodes.
export function getReadableInstructions(
  startX: number,
  startY: number,
  startFloor: number,
  endX: number,
  endY: number,
  endFloor: number,
  startBuildingId = null,
  endBuildingId = null
): ReadablePath | null {
  const startNodes: Nodes = startBuildingId ? new Map(
    [...nodes].filter(([, node]) => node.buildingId === startBuildingId)
  ) : nodes;
  const endNodes: Nodes = endBuildingId ? new Map(
    [...nodes].filter(([, node]) => node.buildingId === endBuildingId)
  ) : nodes;

  const startNode = findNodeNearPosition(startNodes, startX, startY, startFloor);
  if (!startNode) {
    return null;
  }

  const endNode = findNodeNearPosition(endNodes, endX, endY, endFloor);
  if (!endNode) {
    return null;
  }

  const path = calculatePath(graph, startNode, endNode);

  return path ? createReadablePath(path, nodes, endNode) : null;
}

export function gpsToCampusPosition(latitude: number, longitude: number): Vector2 {
  const projection = globalFrame.outdoorProjection;
  const degreesToFeet = projection.radiansPerDegree * projection.feetPerMeter;
  return {
    x:
      (longitude - globalFrame.longitude) *
      projection.eastRadiusMeters *
      degreesToFeet,
    y:
      (latitude - globalFrame.latitude) *
      projection.northRadiusMeters *
      degreesToFeet
  };
}
