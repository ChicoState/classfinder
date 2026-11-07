import { useState } from 'react';
import { buildings } from '../buildings/registry';
import { getRooms, planJourney } from '../routing/campusRouting';
import type { Journey } from '../routing/campusRouting';
import type { IndoorLeg } from '../routing/indoorRouting';
import CampusMap from './CampusMap';
import AsciiWalker from './AsciiWalker';
import FloorPlanViewer from './FloorPlanViewer';

const choices = Object.values(buildings).sort((a, b) =>
  a.name.localeCompare(b.name)
);

function RoomPicker({
  legend,
  value,
  onChange
}: {
  legend: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const [buildingId, setBuildingId] = useState('oconnell');
  const rooms = getRooms(buildingId);
  return (
    <fieldset className="room-picker">
      <legend>{legend}</legend>
      <label>
        {legend} building
        <select
          value={buildingId}
          onChange={(event) => {
            setBuildingId(event.target.value);
            onChange('');
          }}
        >
          {choices.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        {legend} room
        <select
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Choose a room</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.label}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

function IndoorDirections({
  buildingId,
  leg,
  arrival
}: {
  buildingId: string;
  leg: IndoorLeg;
  arrival: string;
}) {
  const building = buildings[buildingId];
  return (
    <div className="indoor-leg">
      <p>
        About {Math.round(leg.feet)} ft indoors. Start on floor{' '}
        {leg.nodes[0].floorId}.
      </p>
      <ol>
        {leg.instructions.map((instruction, index) => (
          <li key={index}>{instruction}</li>
        ))}
        <li>{arrival}</li>
      </ol>
      <FloorPlanViewer
        key={`${leg.nodes[0].id}/${leg.nodes.at(-1)!.id}`}
        building={building}
        routeNodes={leg.nodes}
      />
    </div>
  );
}

export default function JourneyPlanner({
  onBuildingSelect
}: {
  onBuildingSelect?: () => void;
}) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [journey, setJourney] = useState<Journey | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const change = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setJourney(null);
    setSubmitted(false);
  };
  return (
    <>
      <section className="welcome-panel" aria-labelledby="page-title">
        <div className="welcome-copy">
          <p className="eyebrow">Campus directions</p>
          <h1 id="page-title">Find your way to class.</h1>
          <p className="intro">
            Choose two rooms to see both building maps and the campus walk
            between them.
          </p>
          <form
            className="journey-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
              setJourney(planJourney(fromId, toId));
            }}
          >
            <RoomPicker
              legend="From"
              value={fromId}
              onChange={change(setFromId)}
            />
            <RoomPicker legend="To" value={toId} onChange={change(setToId)} />
            <button type="submit">Get directions</button>
          </form>
          <div className="setup-note" role="status">
            {journey
              ? journey.outdoor
                ? `Outdoor walk: about ${Math.round(journey.outdoor.feet)} ft. Click ${buildings[journey.to.buildingId].name} on the map to jump to its indoor directions.`
                : fromId === toId
                  ? 'You are already at this room.'
                  : 'Both rooms are in the same building. Indoor directions are below.'
              : submitted
                ? 'No complete route is available for these rooms. Try another room.'
                : 'Select a building and room for each end of your walk.'}
          </div>
        </div>
        <div className="campus-map-column">
          <figure className="campus-map-frame">
            <CampusMap
              journey={journey}
              onBuildingSelect={onBuildingSelect}
              onEnter={() => {
                onBuildingSelect?.();
                requestAnimationFrame(() =>
                  document.getElementById('arrival-title')?.focus()
                );
              }}
            />
          </figure>
          <AsciiWalker />
        </div>
      </section>
      {journey && (
        <section className="journey-directions" aria-labelledby="journey-title">
          <h2 id="journey-title">Your directions</h2>
          {journey.outdoor && journey.departure && (
            <>
              <section aria-labelledby="departure-title">
                <h3 id="departure-title">
                  1. Leave {buildings[journey.from.buildingId].name} ·{' '}
                  {journey.from.label}
                </h3>
                <IndoorDirections
                  buildingId={journey.from.buildingId}
                  leg={journey.departure}
                  arrival="Exit the building at the marked entrance on the campus map."
                />
              </section>
              <h3>2. Walk to {buildings[journey.to.buildingId].name}</h3>
              <ol>
                {journey.outdoor.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
              <p>
                Click the destination marker on the campus map to jump to its
                indoor directions.
              </p>
            </>
          )}
          <section aria-labelledby="arrival-title">
            <h3 id="arrival-title" tabIndex={-1}>
              {journey.outdoor ? '3. ' : ''}
              {buildings[journey.to.buildingId].name} · {journey.to.label}
            </h3>
            <IndoorDirections
              buildingId={journey.to.buildingId}
              leg={journey.arrival}
              arrival={`Arrive at ${journey.to.label}.`}
            />
          </section>
          <p className="route-caveat">
            Routes use reference floor plans and OpenStreetMap paths. Entrance
            matches are approximate; dashed approaches are not mapped footpaths.
            Check signs on arrival. Step-free access and live closures are not
            verified.
          </p>
        </section>
      )}
    </>
  );
}
