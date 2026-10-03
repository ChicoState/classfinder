import BuildingPage from './pages/BuildingPage';
import campusMap from "../campusmap.png";
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
        					<img
          						src={campusMap}
          						alt="Map of the campus used for ClassFinder directions"
     	 						usemap="#workmap"
        					/>
    						<map name="workmap">
      							<area shape="rect" coords="644, 606, 805, 644" href="#/buildings/oconnell"/>
							<area shape="rect" coords="681, 654, 774, 714" href="#/buildings/langdon"/>
							<area shape="rect" coords="953, 521, 1051, 566" href="#/buildings/PAC"/>
							<area shape="rect" coords="985, 472, 1166, 489" href="#/buildings/ANH"/>
							<area shape="rect" coords="996, 340, 1086, 359" href="#/buildings/Ayers"/>
							<area shape="rect" coords="949, 281, 1134, 321" href="#/buildings/BSS"/>
							<area shape="rect" coords="859, 265, 937, 283" href="#/buildings/Holt"/>
							<area shape="rect" coords="618, 444, 724, 463" href="#/buildings/Plumas"/>
							<area shape="rect" coords="768, 470, 862, 487" href="#/buildings/Glenn"/>
							<area shape="rect" coords="848, 492, 945, 509" href="#/buildings/Trinity"/>
							<area shape="rect" coords="667, 541, 808, 561" href="#/buildings/Science"/>
    						</map>
        					<figcaption>Explore campus before your next class.</figcaption>
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
