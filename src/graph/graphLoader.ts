import type { Edge, Graph, Nodes, Node, NodeId } from '../lib/graph';

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

export function loadGraphFromData(): [Graph, Nodes] {
  const graph: Graph = new Map<NodeId, Edge[]>;
  const nodes: Nodes = new Map<NodeId, Node>;

  // load graph from data

  return [graph, nodes];
}
