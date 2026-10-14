import { Heap } from 'heap-js';
import type { Edge, Graph, Node, NodeId, Nodes } from './graph';

type OpenNode = {
  nodeId: NodeId;
  cost: number;
};

type PreviousEdge = {
  fromNodeId: NodeId;
  edge: Edge;
};

export type PathEdge = Edge & {
  from: NodeId;
};

export type Path = PathEdge[];

const openNodeComparer = (node1: OpenNode, node2: OpenNode): number => {
  return node1.cost - node2.cost;
};

function distanceSqr(x1: number, y1: number, x2: number, y2: number): number {
  const xDistance = x1 - x2;
  const yDistance = y1 - y2;

  return xDistance ** 2 + yDistance ** 2;
}

// inefficient but probably fine for this project
// if it proves not to be, partition nodes by chunks to optimize
// doesn't use vector2 path because this is more efficient, might be pointless
export function findNodeNearPosition(
  nodes: Nodes,
  x: number,
  y: number,
  floor: number
): Node | null {
  let closestNode: Node | null = null;
  let closestDistanceSqr = Number.POSITIVE_INFINITY;

  for (const node of nodes.values()) {
    const currentDistanceSqr = distanceSqr(
      x,
      y,
      node.position.x,
      node.position.y
    );
    if (node.floorId == floor && currentDistanceSqr < closestDistanceSqr) {
      closestDistanceSqr = currentDistanceSqr;
      closestNode = node;
    }
  }

  return closestNode;
}

function buildPath(
  previousEdges: Map<NodeId, PreviousEdge>,
  startNodeId: NodeId,
  goalNodeId: NodeId
): Path | null {
  const path: Path = [];
  let currentNodeId = goalNodeId;

  while (currentNodeId !== startNodeId) {
    const previousEdge = previousEdges.get(currentNodeId);
    if (!previousEdge) {
      return null;
    }

    path.push({ ...previousEdge.edge, from: previousEdge.fromNodeId });
    currentNodeId = previousEdge.fromNodeId;
  }

  return path.reverse();
}

export function calculatePath(
  graph: Graph,
  start: Node,
  goal: Node
): Path | null {
  const openNodes = new Heap<OpenNode>(openNodeComparer);
  const bestCosts = new Map<NodeId, number>([[start.id, 0]]);
  const previousEdges = new Map<NodeId, PreviousEdge>();

  openNodes.push({ nodeId: start.id, cost: 0 });

  while (true) {
    const currentNode = openNodes.pop();
    if (!currentNode) {
      break;
    }

    const bestCost = bestCosts.get(currentNode.nodeId);
    if (bestCost === undefined || currentNode.cost !== bestCost) {
      continue;
    }

    if (currentNode.nodeId === goal.id) {
      return buildPath(previousEdges, start.id, goal.id);
    }

    const neighbors = graph.get(currentNode.nodeId);
    if (!neighbors) {
      continue;
    }

    for (const edge of neighbors) {
      const neighborCost = currentNode.cost + edge.distance * edge.weight;
      const bestNeighborCost = bestCosts.get(edge.to);

      if (bestNeighborCost !== undefined && bestNeighborCost <= neighborCost) {
        continue;
      }

      bestCosts.set(edge.to, neighborCost);
      previousEdges.set(edge.to, {
        fromNodeId: currentNode.nodeId,
        edge
      });
      openNodes.push({ nodeId: edge.to, cost: neighborCost });
    }
  }

  return null;
}
