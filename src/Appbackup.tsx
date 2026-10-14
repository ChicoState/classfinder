import campusMap from '../campusmap.png';

function App() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="ClassFinder home">
          ClassFinder
        </a>
      </header>

      <main className="page-content">
        <section className="welcome" aria-labelledby="page-title">
          <div className="welcome-copy">
            <p className="eyebrow">Campus directions</p>
            {/* <h1 id="page-title">Find your way to class.</h1> */}
            <p className="intro">
              Enter your class schedule to get clear directions between campus
              buildings.
            </p>
            <div className="setup-note" role="status">
              Your ClassFinder workspace is ready for the class-entry
              experience.
            </div>
          </div>
          <figure className="campus-map">
            <img
              src={campusMap}
              alt="Map of the campus used for ClassFinder directions"
	      usemap="#workmap"
            />
	    <map name="workmap">
	      <area shape="rect" coords="688, 620, 746, 657" href="/"/>
	    </map>
            <figcaption>Explore campus before your next class.</figcaption>
          </figure>
        </section>
      </main>
    </div>
  );
}

export default App;
