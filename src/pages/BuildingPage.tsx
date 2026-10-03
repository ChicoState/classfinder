import { Link, useParams } from 'react-router';

export default function BuildingPage() {
  const { buildingId } = useParams();

  return (
    <main className="page-content">
      <section className="welcome-panel">
        <p className="eyebrow">Building directions</p>
        <h1>{buildingId}</h1>
        <p className="intro">
          Directions and class information will appear here.
        </p>
        <Link to="/">Back to campus map</Link>
      </section>
    </main>
  );
}
