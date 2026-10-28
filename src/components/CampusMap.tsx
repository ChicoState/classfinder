import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { Link } from 'react-router';
import 'leaflet/dist/leaflet.css';

const campusCenter: [number, number] = [39.728493, -121.845106];

const buildings = [
	{
		id: 'oconnell',
		name: 'OConnell Technology Center',
		position: [39.727699, -121.847627] as [number, number],
	},
	{
		id: 'langdon',
		name: 'Langdon Engineering Center',
		position: [39.727249, -121.847751] as [number, number],
	},
	{
		id: 'science',
		name: 'Science Building',
		position: [39.728408, -121.847466] as [number, number],
	},
	{
		id: 'pac',
                name: 'Performing Arts Center',
                position: [39.728570, -121.843883] as [number, number],
	},
	{
		id: 'anh',
                name: 'Arts and Humanities Building',
                position: [39.729258, -121.843110] as [number, number],
	},
	{
		id: 'ayers',
                name: 'Ayers Hall',
                position: [39.730364, -121.843781] as [number, number],
	},
	{
		id: 'bss',
                name: 'Behavioral and Social Science Building',
                position: [39.731026, -121.843400] as [number, number],
	},
	{
		id: 'holt',
                name: 'Holt Hall',
                position: [39.731016, -121.845444] as [number, number],
	},
	{
		id: 'plumas',
                name: 'Plumas Hall',
                position: [39.729568, -121.848115] as [number, number],
	},
	{
		id: 'glenn',
                name: 'Glenn Hall',
                position: [39.729118, -121.846345] as [number, number],
	},
	{
		id: 'trinity',
                name: 'Trinity Hall',
                position: [39.728953, -121.845342] as [number, number],
	}
]

export default function CampusMap() {
	return (
		<div className="campus-map">
			<MapContainer
				center={campusCenter}
				zoom={17}
				scrollWheelZoom
				style={{ height: '520px', width: '125%', borderRadius: '0.75rem' }}
			>
			<TileLayer
				url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
				maxZoom={19}
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			/>

			{buildings.map((building) => (
				<CircleMarker
					key={building.id}
					center={building.position}
					radius={10}
					pathOptions={{
						color: '#ffffff',
						weight: 2,
						fillColor: '#17624f',
						fillOpacity: 1,
						}}
				>
					<Popup>
						<strong>{building.name}</strong>
						<br />
						<Link to={`/buildings/${building.id}`}>
							View indoor map
						</Link>
					</Popup>
				</CircleMarker>
			))}
			</MapContainer>


			<figcaption>
				Placeholder
			</figcaption>
		</div>
	);
}


