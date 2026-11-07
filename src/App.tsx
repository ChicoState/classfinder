import BuildingPage from './pages/BuildingPage';
import JourneyPlanner from './components/JourneyPlanner';
import { buildings } from './buildings/registry';
import { Link, Route, Routes, useLocation } from 'react-router';
import { useEffect, useRef, useState } from 'react';

const BUILDING_LOAD_MS = 2000;

function BuildingLoader() {
  return (
    <div className="building-loader" role="status" aria-live="polite">
      <div className="building-loader-window">
        <p className="building-loader-title">ClassFinder</p>
        <p className="building-loader-copy">Loading building data...</p>
        <div
          className="building-loader-track"
          role="progressbar"
          aria-label="Loading building data"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext="Loading building data"
        >
          <span className="building-loader-fill" />
        </div>
        <p className="building-loader-note">Please wait</p>
      </div>
    </div>
  );
}

function HomePage({ onBuildingSelect }: { onBuildingSelect: () => void }) {
  return (
    <div className="home-page">
      <main className="page-content">
        <JourneyPlanner onBuildingSelect={onBuildingSelect} />
        <section className="indoor-maps" aria-labelledby="indoor-maps-title">
          <h2 id="indoor-maps-title">Indoor maps</h2>
          <nav aria-label="Building indoor maps">
            {Object.values(buildings).map((building) => (
              <Link
                key={building.id}
                to={`/buildings/${building.id}`}
                onClick={onBuildingSelect}
              >
                {building.name}
              </Link>
            ))}
          </nav>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/map';
  const [isBuildingLoading, setIsBuildingLoading] = useState(false);
  const loadingTimer = useRef<number | undefined>(undefined);

  const handleBuildingSelect = () => {
    if (loadingTimer.current) window.clearTimeout(loadingTimer.current);
    setIsBuildingLoading(true);
    loadingTimer.current = window.setTimeout(
      () => setIsBuildingLoading(false),
      BUILDING_LOAD_MS
    );
  };

  useEffect(
    () => () => {
      if (loadingTimer.current) window.clearTimeout(loadingTimer.current);
    },
    []
  );

  return (
    <div className={`app-shell ${isHome ? 'home-shell' : ''}`}>
      <header className="site-header">
        <a className="brand" href="/" aria-label="ClassFinder home">
          ClassFinder
        </a>
      </header>
      <Routes>
        <Route
          path="/"
          element={<HomePage onBuildingSelect={handleBuildingSelect} />}
        />
        <Route
          path="/map"
          element={<HomePage onBuildingSelect={handleBuildingSelect} />}
        />
        <Route path="/buildings/:buildingId" element={<BuildingPage />} />
      </Routes>
      {isBuildingLoading && <BuildingLoader />}
    </div>
  );
}
