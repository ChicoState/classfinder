export type NodeId = string & { readonly __brand: 'NodeId' };
export type FloorId = number;

export type Area = 'Outdoors' | 'Holt';
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
  floorId: FloorId | null;
  area: Area;
  position: {
    x: number;
    y: number;
  };
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
