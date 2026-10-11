import { Link, useParams } from 'react-router';
import { useMemo, useState } from 'react';
import { buildings } from '../buildings/registry';
import FloorPlanViewer from '../components/FloorPlanViewer';
import { loadGraphFromData } from '../graph/graphLoader';
import { calculatePath } from '../lib/dijkstras';
import type { NodeId } from '../lib/graph';
import type { Building } from '../buildings/types'

const [graph, nodes] = loadGraphFromData();

function BuildingDirections({ building }: { building: Building }) {
	const [startNodeId, setStartNodeId] = useState(building.demoRoute.startNodeId);
	const [endNodeId, setEndNodeId] = useState(building.demoRoute.destinationNodeId);
	const availableNodes = useMemo( 
					() => [...nodes.values()]
						.filter((node) => node.buildingId === building.graphBuildingId)
						.sort((a, b) => a.id.localeCompare(b.id)),
					[building.graphBuildingId],
					);
	const start = nodes.get(startNodeId as NodeId);
	const end = nodes.get(endNodeId as NodeId);
	const path = start && end ? calculatePath(graph, start, end) : null;

	const routeNodes = start && path ? [start, ...path.map((edge) => nodes.get(edge.to)!)] : [];

	return (
		<main className="page-content">
                <section className="building-page" aria-labelledby="building-title">
                        <p className="eyebrow">Building directions</p>
                        <h1 id="building-title">{building.name}</h1>
                        <div className="route-inputs">
				<label>
					Starting node
					<select
						value={startNodeId}
						onChange={(event) => setStartNodeId(event.target.value)}
					>
						{availableNodes.map((node) => ( <option key={node.id} value={node.id}> {node.id} </option>))}
					</select>
				</label>

				<label>
					Destination node
					<select
						value={endNodeId}
						onChange={(event) => setEndNodeId(event.target.value)}
					>
						{availableNodes.map((node) => ( <option key={node.id} value={node.id}> {node.id} </option>))}
					</select>

				</label>
			</div>
			{!path && (<p role="status">No route exists between these nodes.</p>)}


                        <FloorPlanViewer building={building} routeNodes={routeNodes}/>
                        <Link to="/">Back to campus map</Link>
                </section>
                </main>
	)

}

export default function BuildingPage() {
	const { buildingId } = useParams();
	const building = buildingId && buildings[buildingId];

	if (!building)
	{
		return (
			<main className="page-content">
				<h1>Building unavailable</h1>
			<Link to="/">Back to campus map</Link>
			</main>
			);
	}
	
	return <BuildingDirections key={building.id} building={building}/>;
}
