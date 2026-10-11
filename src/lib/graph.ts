import type { Vector2 } from "./vector2";

export type NodeId = string & { readonly __brand: 'NodeId' };

export type EdgeKind =
  | 'corridor'
  | 'door'
  | 'stairs'
  | 'elevator'
  | 'ramp'
  | 'outdoor';

export type Node = {
  id: NodeId;
  buildingId: string | null;
  floorId: number;
  position: Vector2;
};

export type Edge = {
  to: NodeId;
  distance: number;
  weight: number;
  type: EdgeKind;
  isAccessible?: boolean;
};

export type Graph = Map<NodeId, Edge[]>;
export type Nodes = Map<NodeId, Node>;
