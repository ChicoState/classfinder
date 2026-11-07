import { describe, expect, it } from 'vitest';
import { buildings } from '../../src/buildings/registry';
import { loadGraphFromData } from '../../src/graph/graphLoader';
import { calculatePath } from '../../src/lib/dijkstras';
import type { NodeId } from '../../src/lib/graph';

const [graph, nodes] = loadGraphFromData();
describe('indoor map registry', () => {
  it('exposes every bundled building and floor', () => {
    const graphBuildings = new Set(
      [...nodes.values()].map((node) => node.buildingId)
    );
    expect(
      new Set(
        Object.values(buildings).map((building) => building.graphBuildingId)
      )
    ).toEqual(graphBuildings);
    for (const building of Object.values(buildings)) {
      expect(new Set(building.floors.map((plan) => plan.floor))).toEqual(
        new Set(
          [...nodes.values()]
            .filter((node) => node.buildingId === building.graphBuildingId)
            .map((node) => node.floorId)
        )
      );
      for (const plan of building.floors) {
        expect(plan.image).toBeTruthy();
        expect(plan.feetPerPdfPoint).toBeGreaterThan(0);
      }
    }
  });
  it('starts each building with a valid route within that building', () => {
    for (const building of Object.values(buildings)) {
      const start = nodes.get(building.demoRoute.startNodeId as NodeId)!;
      const end = nodes.get(building.demoRoute.destinationNodeId as NodeId)!;
      expect(start?.buildingId).toBe(building.graphBuildingId);
      expect(end?.buildingId).toBe(building.graphBuildingId);
      expect(calculatePath(graph, start, end)?.length).toBeGreaterThan(0);
    }
  });
});
