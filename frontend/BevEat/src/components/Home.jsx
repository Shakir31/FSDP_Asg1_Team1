import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Home.css';

function Home() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStalls() {
      try {
        const response = await fetch("http://localhost:3000/stalls");
        if (!response.ok) {
          throw new Error("Failed to fetch stalls");
        }
        const data = await response.json();
        // Optionally slice the data to only show top 4-8 stalls on home page
        setStalls(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStalls();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <img src="/images/hawker food.webp" alt="satay cooking" className="hero-image" />
      </section>

      {/* Popular Stalls Section */}
      <section className="stalls">
        <div className="section-header">
          <h2>Popular Stalls Near You</h2>
          <Link to="/stalls" className="see-all">See all &gt;</Link>
        </div>

        <div className="filters">
          <button>All</button>
          <button>Rice</button>
          <button>Noodles</button>
          <button>Soup</button>
          <button>Indian</button>
          <button>Halal</button>
        </div>

        {loading && <p>Loading stalls...</p>}
        {error && <p style={{color: 'red'}}>Error: {error}</p>}

        <div className="card-grid">
          {!loading && !error && stalls.map((stall) => (
            <Link to={`/stalls/${stall.StallID}`} className="card-link" key={stall.StallID}> 
              <div className="card">
                <img 
                  src={stall.Stall_Image || "/images/buta kin.jpg"} 
                  alt={stall.StallName} 
                  onError={(e) => {e.target.src = "/images/buta kin.jpg"}} // Fallback image
                />
                <h3>{stall.StallName}</h3>
                <p>{stall.Hawker_Centre}</p>
                {/* Location/Distance removed as requested */}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Hawker Centres Section (Static for now) */}
      <section className="hawker">
        <div className="section-header">
          <h2>Hawker Centres Near You</h2>
          <Link to="/hawkers" className="see-all">See all &gt;</Link>
        </div>

        <div className="card-grid">
          <div className="card">
            <img src="/images/maxwell.jpg" alt="Maxwell Food Centre" />
            <h3>Maxwell Food Centre</h3>
            <p>1 Kadayanallur St, Singapore 069184</p>
          </div>
          <div className="card">
            <img src="/images/sembawang.jpg" alt="Sembawang Hills Food Centre" />
            <h3>Sembawang Hills Food Centre</h3>
            <p>590 Upper Thomson Rd, Singapore 574419</p>
          </div>
          <div className="card">
            <img src="/images/taman jurong.jpg" alt="Taman Jurong Market & Food Centre" />
            <h3>Taman Jurong Market & Food Centre</h3>
            <p>3 Yung Sheng Rd, Singapore 618499</p>
          </div>
          <div className="card">
            <img src="/images/ABC.jpg" alt="ABC Brickworks Market & Food Centre" />
            <h3>ABC Brickworks Market & Food Centre</h3>
            <p>6 Jalan Bukit Merah, Singapore 150006</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;