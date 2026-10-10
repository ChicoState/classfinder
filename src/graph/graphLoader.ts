import type { Edge, Graph, Nodes, Node, NodeId } from '../lib/graph';
import { distance } from '../lib/vector2';

type GraphData = {
  nodes?: Array<Omit<Node, 'id'> & { id: string }>;
  edges: Array<Omit<Edge, 'to' | 'distance'> & { from: string; to: string }>;
};

const datasets = Object.values(
  import.meta.glob<GraphData>('../data/*/*.json', {
    eager: true,
    import: 'default'
  })
);

/**
 * Adds a pair of matching edges while a graph is being assembled.
 */
export function connectBothWays(
  graph: Graph,
  a: NodeId,
  b: NodeId,
  edge: Omit<Edge, 'to'>
): void {
  const edgesFromA = graph.get(a);
  const edgesFromB = graph.get(b);

  if (!edgesFromA || !edgesFromB) {
    throw new Error('Both nodes must be added to the graph first.');
  }

  edgesFromA.push({ ...edge, to: b });
  edgesFromB.push({ ...edge, to: a });
}

function calculateEdgeDistance(nodes: Nodes, from: NodeId, to: NodeId): number {
  const fromNode = nodes.get(from);
  const toNode = nodes.get(to);

  if (!fromNode || !toNode) {
    throw new Error('Both edge endpoints must be added to the graph first.');
  }

  return distance(fromNode.position, toNode.position);
}

/** Loads all bundled buildings and their connections into mutable maps. */
export function loadGraphFromData(): [Graph, Nodes] {
  const graph: Graph = new Map<NodeId, Edge[]>();
  const nodes: Nodes = new Map<NodeId, Node>();

  for (const node of datasets.flatMap((data) => data.nodes ?? [])) {
    const id = node.id as NodeId;
    nodes.set(id, { ...node, id, position: { ...node.position } });
    graph.set(id, []);
  }

  // Every node must exist before adding cross-floor or cross-building edges.
  for (const { from, to, ...edge } of datasets.flatMap((data) => data.edges)) {
    const fromId = from as NodeId;
    const toId = to as NodeId;
    connectBothWays(graph, fromId, toId, {
      ...edge,
      distance: calculateEdgeDistance(nodes, fromId, toId)
    });
  }

  return [graph, nodes];
}
