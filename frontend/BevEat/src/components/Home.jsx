import React from 'react';
import { Link } from 'react-router-dom';
import '../Home.css'; // You will need to create this CSS file

function Home() {
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

        <div className="card-grid">
          {/* Card 1 */}
          <Link to="/stalls/1" className="card-link"> 
            <div className="card">
              <img src="/images/buta kin.jpg" alt="Buta Kin" />
              <h3>Buta Kin</h3>
              <p>144 Upper Bukit Timah Rd, #04-28, Singapore 588177</p>
              <p className="distance">📍 1km Away</p>
            </div>
          </Link>

          {/* Card 2 */}
          <div className="card">
            <img src="/images/nasi lemak.jpg" alt="Roasted Pork Belly Nasi Lemak" />
            <h3>Roasted Pork Belly Nasi Lemak</h3>
            <p>Blk 105 Hougang Ave 1, #02-28 Hainanese Village Centre</p>
            <p className="distance">📍 2km Away</p>
          </div>

          {/* Card 3 */}
          <div className="card">
            <img src="/images/cheese prata.jpg" alt="Rahmath Cheese Prata" />
            <h3>Rahmath Cheese Prata</h3>
            <p>Toa Payoh Vista Market, #01-08, 74 Lor 4</p>
            <p className="distance">📍 1.2km Away</p>
          </div>

          {/* Card 4 */}
          <div className="card">
            <img src="/images/bak kut teh.jpg" alt="Joo Siah Bak Koot Teh" />
            <h3>Joo Siah Bak Koot Teh</h3>
            <p>349 Jurong East Ave 1, #01-1215</p>
            <p className="distance">📍 0.8km Away</p>
          </div>
        </div>
      </section>

      {/* Hawker Centres Section */}
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
            <p className="distance">📍 1km Away</p>
          </div>
          <div className="card">
            <img src="/images/sembawang.jpg" alt="Sembawang Hills Food Centre" />
            <h3>Sembawang Hills Food Centre</h3>
            <p>590 Upper Thomson Rd, Singapore 574419</p>
            <p className="distance">📍 2km Away</p>
          </div>
          <div className="card">
            <img src="/images/taman jurong.jpg" alt="Taman Jurong Market & Food Centre" />
            <h3>Taman Jurong Market & Food Centre</h3>
            <p>3 Yung Sheng Rd, Singapore 618499</p>
            <p className="distance">📍 1.2km Away</p>
          </div>
          <div className="card">
            <img src="/images/ABC.jpg" alt="ABC Brickworks Market & Food Centre" />
            <h3>ABC Brickworks Market & Food Centre</h3>
            <p>6 Jalan Bukit Merah, Singapore 150006</p>
            <p className="distance">📍 0.8km Away</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;