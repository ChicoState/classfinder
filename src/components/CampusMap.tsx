import { useEffect } from 'react';
import { divIcon } from 'leaflet';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap
} from 'react-leaflet';
import { Link } from 'react-router';
import { buildings } from '../buildings/registry';
import { entrances } from '../routing/entrances';
import type { Journey } from '../routing/campusRouting';
import type { LatLng } from '../routing/outdoorRouting';
import 'leaflet/dist/leaflet.css';

const otherBuildings: Array<{ id: string; name: string; position: LatLng }> = [
  {
    id: 'science',
    name: 'Science Building',
    position: [39.728408, -121.847466]
  },
  {
    id: 'pac',
    name: 'Performing Arts Center',
    position: [39.72857, -121.843883]
  },
  {
    id: 'anh',
    name: 'Arts and Humanities Building',
    position: [39.729258, -121.84311]
  },
  {
    id: 'bss',
    name: 'Behavioral and Social Science Building',
    position: [39.731026, -121.8434]
  }
];

const campusCenter: LatLng = [39.7296, -121.8465];
const icon = divIcon({
  className: 'building-node',
  html: '<span aria-hidden="true"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});
const destinationIcon = divIcon({
  className: 'building-node destination-node',
  html: '<span aria-hidden="true">↓</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function RouteViewport({ positions }: { positions?: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      positions?.length
        ? positions
        : Object.values(entrances).map((entry) => entry.position),
      { padding: [40, 40], maxZoom: 18 }
    );
  }, [map, positions]);
  return null;
}

export default function CampusMap({
  journey = null,
  onEnter,
  onBuildingSelect
}: {
  journey?: Journey | null;
  onEnter?: () => void;
  onBuildingSelect?: () => void;
}) {
  const outdoor = journey?.outdoor;
  // Render unmapped entrance approaches separately as dashed lines.
  const segments: LatLng[][] = [];
  if (outdoor) {
    for (let i = 1; i < outdoor.positions.length; i++) {
      const a = outdoor.positions[i - 1];
      const b = outdoor.positions[i];
      if (
        !outdoor.approaches.some(
          ([c, d]) => (a === c && b === d) || (a === d && b === c)
        )
      )
        segments.push([a, b]);
    }
  }
  return (
    <div className="campus-map">
      <MapContainer
        center={campusCenter}
        zoom={16}
        scrollWheelZoom
        className="campus-map-canvas"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <RouteViewport positions={outdoor?.positions} />
        {outdoor && (
          <>
            <Polyline
              positions={segments}
              pathOptions={{ color: '#b82d24', weight: 5 }}
            />
            {outdoor.approaches.map((positions, index) => (
              <Polyline
                key={index}
                positions={positions}
                pathOptions={{ color: '#b82d24', weight: 5, dashArray: '5 8' }}
              />
            ))}
          </>
        )}
        {otherBuildings.map((building) => (
          <Marker
            key={building.id}
            position={building.position}
            icon={icon}
            title={building.name}
          >
            <Popup>
              <strong>{building.name}</strong>
              <br />
              Indoor map coming soon
            </Popup>
          </Marker>
        ))}
        {Object.entries(entrances).map(([id, entrance]) => {
          const destination = !!outdoor && journey?.to.buildingId === id;
          const title = destination
            ? `Continue indoors at ${buildings[id].name}`
            : buildings[id].name;
          return (
            <Marker
              key={`${id}-${destination}`}
              position={entrance.position}
              icon={destination ? destinationIcon : icon}
              title={title}
              alt={title}
              ref={(marker) => {
                marker?.getElement()?.setAttribute('aria-label', title);
              }}
              eventHandlers={destination ? { click: onEnter } : undefined}
            >
              {destination ? (
                <Tooltip permanent direction="top">
                  Click to continue indoors
                </Tooltip>
              ) : (
                <Popup>
                  <strong>{buildings[id].name}</strong>
                  <br />
                  <Link to={`/buildings/${id}`} onClick={onBuildingSelect}>
                    View indoor map
                  </Link>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
      <figcaption>
        {outdoor
          ? 'Follow the red path. Click the destination building node for your room directions.'
          : 'Select a marker to explore a building’s indoor map.'}
      </figcaption>
    </div>
  );
}
