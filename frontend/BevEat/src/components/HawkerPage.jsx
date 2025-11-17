import React from 'react';
import { Link } from 'react-router-dom';
import '../HawkerPage.css'; // You will need to create this CSS file

function HawkerPage() {
  return (
    <div className="hawker-page">
      {/* Banner Section */}
      <section className="hawker-banner">
        <img src="/images/maxwell 2nd.png" alt="Maxwell Food Centre" className="banner-img" />
        <div className="banner-overlay"></div>
        <div className="banner-content">
            <h1>Maxwell Food Centre</h1>
            <p>1 Kadayanallur St, Singapore 069184</p>
            <button className="filter-btn">Filter <span className="arrow">▼</span></button>
        </div>
      </section>

      {/* Hawker Stalls Grid */}
      <section className="hawkers">
        <div className="hawker-grid">
            {/* Note: In the future, you will map() these from your database */}
            
            <Link to="/stalls/1" className="hawker-card-link">
              <div className="hawker-card">
                  <img src="/images/buta kin.jpg" alt="Buta Kin" />
                  <h3>Buta Kin</h3>
                  <p>144 Upper Bukit Timah Rd, #04-28</p>
                  <p className="distance">📍 1km Away</p>
              </div>
            </Link>

            <div className="hawker-card">
                <img src="/images/nasi lemak.jpg" alt="Roasted Pork Belly Nasi Lemak" />
                <h3>Roasted Pork Belly Nasi Lemak</h3>
                <p>Blk 105 Hougang Ave 1, #02-28</p>
                <p className="distance">📍 2km Away</p>
            </div>

            <div className="hawker-card">
                <img src="/images/cheese prata.jpg" alt="Rahmath Cheese Prata" />
                <h3>Rahmath Cheese Prata</h3>
                <p>Toa Payoh Vista Market, #01-08</p>
                <p className="distance">📍 1.2km Away</p>
            </div>

            <div className="hawker-card">
                <img src="/images/bak kut teh.jpg" alt="Joo Siah Bak Koot Teh" />
                <h3>Joo Siah Bak Koot Teh</h3>
                <p>349 Jurong East Ave 1, #01-1215</p>
                <p className="distance">📍 0.8km Away</p>
            </div>

            <div className="hawker-card">
                <img src="/images/chicken rice.jpg" alt="Tian Tian Chicken Rice" />
                <h3>Tian Tian Chicken Rice</h3>
                <p>1 Kadayanallur St, #01-10 Maxwell Food Centre</p>
                <p className="distance">📍 0.5km Away</p>
            </div>

            <div className="hawker-card">
                <img src="/images/oyster cake.webp" alt="Maxwell Fuzhou Oyster Cake" />
                <h3>Heng Carrot Cake</h3>
                <p>1 Kadayanallur St, #01-28 Maxwell Food Centre</p>
                <p className="distance">📍 0.7km Away</p>
            </div>

            <div className="hawker-card">
                <img src="/images/zhen porridge.jpg" alt="Zhen Zhen Porridge" />
                <h3>Zhen Zhen Porridge</h3>
                <p>1 Kadayanallur St, #01-54 Maxwell Food Centre</p>
                <p className="distance">📍 0.6km Away</p>
            </div>

            <div className="hawker-card">
                <img src="/images/jiang nan.jpg" alt="Taste of Jiang Nan" />
                <h3>Hup Kee Fried Oyster</h3>
                <p>1 Kadayanallur St, #01-73 Maxwell Food Centre</p>
                <p className="distance">📍 0.9km Away</p>
            </div>
        </div>
    </section>
    </div>
  );
}

export default HawkerPage;