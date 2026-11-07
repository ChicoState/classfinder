import { useState } from 'react';
import type { Building } from '../buildings/types';
import type { Node } from '../lib/graph';

type Props = { building: Building; routeNodes: Node[] };

export default function FloorPlanViewer({ building, routeNodes }: Props) {
  const [selectedFloor, setSelectedFloor] = useState(
    routeNodes[0]?.floorId ?? building.floors[0].floor
  );
  const plan = building.floors.find((floor) => floor.floor === selectedFloor)!;
  // Keep floor changes and the two Acker source sheets as separate lines.
  const segments: string[][] = [];
  const markers: Array<{ x: number; y: number; destination: boolean }> = [];
  let previousSheet = -1;
  let previousOnFloor = false;
  for (const node of routeNodes) {
    if (node.floorId !== selectedFloor) {
      previousOnFloor = false;
      continue;
    }
    let x = plan.pdfOrigin.x + node.position.x / plan.feetPerPdfPoint;
    let y = plan.pdfOrigin.y - node.position.y / plan.feetPerPdfPoint;
    const sheet = plan.continuation && y > plan.continuation.belowPdfY ? 1 : 0;
    if (sheet && plan.continuation) {
      x += plan.continuation.translation.x;
      y += plan.continuation.translation.y;
    }
    if (!previousOnFloor || sheet !== previousSheet) segments.push([]);
    const imageX = x * plan.pdfPointToImageScale + (plan.imageOffset?.x ?? 0);
    const imageY = y * plan.pdfPointToImageScale + (plan.imageOffset?.y ?? 0);
    segments[segments.length - 1].push(`${imageX},${imageY}`);
    if (node === routeNodes[0] || node === routeNodes.at(-1)) {
      markers.push({
        x: imageX,
        y: imageY,
        destination: node === routeNodes.at(-1)
      });
    }
    previousOnFloor = true;
    previousSheet = sheet;
  }

  return (
    <>
      <div className="floor-tabs" aria-label={`${building.name} floors`}>
        {building.floors.map((floor) => (
          <button
            key={floor.floor}
            type="button"
            aria-pressed={selectedFloor === floor.floor}
            onClick={() => setSelectedFloor(floor.floor)}
          >
            Floor {floor.floor}
          </button>
        ))}
      </div>
      <svg
        className="floor-plan"
        viewBox={`0 0 ${plan.imageWidth} ${plan.imageHeight}`}
        role="img"
        aria-label={`${building.name}, floor ${selectedFloor}`}
      >
        <image
          href={plan.image}
          width={plan.imageWidth}
          height={plan.imageHeight}
        />
        {segments
          .filter((segment) => segment.length >= 2)
          .map((segment, index) => (
            <polyline
              key={index}
              className="route-line"
              points={segment.join(' ')}
            />
          ))}
        {markers.map((marker, index) => (
          <circle
            key={index}
            cx={marker.x}
            cy={marker.y}
            r={10}
            className={marker.destination ? 'route-destination' : 'route-start'}
          >
            <title>{marker.destination ? 'Destination' : 'Start'}</title>
          </circle>
        ))}
      </svg>
    </>
  );
}
