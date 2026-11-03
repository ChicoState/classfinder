import { globalFrame, buildings } from './campusAlignment.json';
import type { Vector2 } from '../lib/vector2';

type SimilarityTransform = { a: number; b: number; tx: number; ty: number };
const transforms = new Map<string, SimilarityTransform>(
  Object.entries(buildings)
);

// converts global campus coordinates to local building coordinates
export function toLocalPosition(
  globalPosition: Vector2,
  buildingId: string | null
): Vector2 {
  if (buildingId === null || buildingId === 'outside')
    return { ...globalPosition };

  const transform = transforms.get(buildingId);
  if (!transform)
    throw new Error(`No campus alignment for building ${buildingId}.`);

  const { a, b, tx, ty } = transform;
  const determinant = a * a + b * b;
  const dx = globalPosition.x - tx;
  const dy = globalPosition.y - ty;
  return {
    x: (a * dx + b * dy) / determinant,
    y: (-b * dx + a * dy) / determinant
  };
}

// Converts saved building drawing coordinates to the single runtime campus frame.
export function toGlobalPosition(
  position: Vector2,
  buildingId: string | null
): Vector2 {
  if (buildingId === null || buildingId === 'outside') return { ...position };

  const transform = transforms.get(buildingId);
  if (!transform)
    throw new Error(`No campus alignment for building ${buildingId}.`);

  const { a, b, tx, ty } = transform;
  return {
    x: a * position.x - b * position.y + tx,
    y: b * position.x + a * position.y + ty
  };
}

// Converts GPS coordinates to the campus coordinate system.
export function gpsToCampusPosition(
  latitude: number,
  longitude: number
): Vector2 {
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
