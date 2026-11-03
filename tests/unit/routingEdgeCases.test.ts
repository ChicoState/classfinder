import { expect, it } from 'vitest';
import { calculatePath, findNodeNearPosition } from '../../src/lib/dijkstras';
import type { Edge, Graph, Node, NodeId } from '../../src/lib/graph';

const node = (id: string): Node => ({
  id: id as NodeId,
  buildingId: 'test',
  floorId: 1,
  position: { x: 0, y: 0 }
});
const edge = (to: string, distance: number): Edge => ({
  to: to as NodeId,
  distance,
  weight: 1,
  type: 'corridor'
});

it('improves a previously discovered route and terminates on zero-cost cycles', () => {
  const graph: Graph = new Map([
    [node('a').id, [edge('b', 10), edge('c', 1)]],
    [node('c').id, [edge('b', 1), edge('c', 0)]],
    [node('b').id, [edge('c', 0), edge('d', 20)]],
    [node('d').id, []]
  ]);
  const before = structuredClone(graph);
  expect(calculatePath(graph, node('a'), node('d'))).toEqual([
    { ...edge('c', 1), from: 'a' },
    { ...edge('b', 1), from: 'c' },
    { ...edge('d', 20), from: 'b' }
  ]);
  expect(graph).toEqual(before);
});

it('treats edges as directed and tolerates missing adjacency lists', () => {
  const graph: Graph = new Map([[node('a').id, [edge('b', 1)]]]);
  expect(calculatePath(graph, node('b'), node('a'))).toBeNull();
  expect(calculatePath(graph, node('missing'), node('a'))).toBeNull();
});

it('returns null for empty data, absent floors, and nonfinite positions', () => {
  expect(findNodeNearPosition(new Map(), 0, 0, 1)).toBeNull();
  const nodes = new Map([[node('a').id, node('a')]]);
  expect(findNodeNearPosition(nodes, 0, 0, 2)).toBeNull();
  expect(findNodeNearPosition(nodes, NaN, 0, 1)).toBeNull();
  expect(findNodeNearPosition(nodes, Infinity, 0, 1)).toBeNull();
});
