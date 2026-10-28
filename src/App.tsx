import BuildingPage from './pages/BuildingPage';
import CampusMap from './components/CampusMap';
import { Link, Route, Routes } from 'react-router';

function HomePage()
{
	return (
		<div className="app-shell">
  			<main className="page-content">
    				<section className="welcome" aria-labelledby="page-title">
      					<div className="welcome-copy">
        					<p className="eyebrow">Campus directions</p>
        {/* <h1 id="page-title">Find your way to class.</h1> */}
        					<p className="intro">
          					Enter your class schedule to get clear directions between campus buildings.
        					</p>
        					<div className="setup-note" role="status">
          						Your ClassFinder workspace is ready for the class-entry experience.
        					</div>
      					</div>
      					<figure className="campus-map">
						<CampusMap />
      					</figure>
    				</section>
  			</main>
		</div>
	);
}

export default function App()
{
	return (

		<div className="app-shell">
			<header className="site-header">
				<a className="brand" href="/" aria-label="ClassFinder home">
				ClassFinder
				</a>
			</header>
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/map" element={<HomePage />} />
				<Route path="/buildings/:buildingId" element={<BuildingPage />} />
			</Routes>
		</div>
		);
		
}
