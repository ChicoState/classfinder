import alignment from './campusAlignment.json';
import type { Vector2 } from '../lib/vector2';

type SimilarityTransform = { a: number; b: number; tx: number; ty: number };
const transforms = new Map<string, SimilarityTransform>(
  Object.entries(alignment.buildings)
);

/** Converts saved building drawing coordinates to the single runtime campus frame. */
export function toGlobalPosition(
  position: Vector2,
  buildingId: string | null
): Vector2 {
  if (buildingId === null) return { ...position };
  const transform = transforms.get(buildingId);
  if (!transform)
    throw new Error(`No campus alignment for building ${buildingId}.`);
  const { a, b, tx, ty } = transform;
  return {
    x: a * position.x - b * position.y + tx,
    y: b * position.x + a * position.y + ty
  };
}
