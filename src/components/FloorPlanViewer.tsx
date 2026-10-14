import { useState } from 'react';
import type { Building } from '../buildings/types';
import type { Node } from '../lib/graph';

type Props = 
{
	building: Building;
	routeNodes: Node[];
};

export default function FloorPlanViewer({building, routeNodes}: Props)
{
	const [selectedFloor, setSelectedFloor] = useState(building.floors[0].floor);

	const plan = building.floors.find((floor) => floor.floor === selectedFloor)!;

	const routePoints = routeNodes.filter((node) => node.floorId === selectedFloor).map((node) => ({
		x: 
			(plan.pdfOrigin.x + node.position.x / plan.feetPerPdfPoint) * plan.pdfPointToImageScale,
		y:
			(plan.pdfOrigin.y - node.position.y / plan.feetPerPdfPoint) * plan.pdfPointToImageScale,
		}));

		return (
			<>
				<div className="floor-tabs" role="tablist" aria-label={`${building.name} floors`}>
					{building.floors.map((floor) =>
						(
							<button
								key={floor.floor}
								type="button"
								role="tab"
								aria-selected={selectedFloor === floor.floor}
								onClick={() => setSelectedFloor(floor.floor)}
							>
							Floor {floor.floor}
							</button>
						)
						)
					}
				</div>

				<svg 
					className="floor-plan" 
					viewBox={`0 0 ${plan.imageWidth} ${plan.imageHeight}`}
					role="img"
					aria-label={`${building.name}, floor ${selectedFloor}`}
				>
					<image href={plan.image} width={plan.imageWidth} height={plan.imageHeight}/>
					{routePoints.length >= 2 && (<polyline className="route-line" points={routePoints.map(({x,y}) => `${x},${y}`).join(' ')}/>
					)}
					</svg>
			</>
		);
}

