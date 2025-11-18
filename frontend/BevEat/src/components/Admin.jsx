import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import '../admin.css';

function AdminHome() {
  return (
    <main className="content">
      <div className='admin-content'>
        <section className="accounts">
          <div><h3>User/Stall owner account List</h3></div>
          <div className="accounts-row">
            <Link to="/admin/users" aria-label="View user accounts">
              <div className="avatar emoji">👥</div>
            </Link>
            <Link to="/admin/stalls-owner" aria-label="View stall owner accounts">
              <div className="avatar emoji">👩‍🍳</div>
            </Link>
          </div>
        </section>

        <hr />

        <section className="reviews">
          <div className="section-top">
            <h3>Review</h3>
            <a className="view-more">View more</a>
          </div>
        </section>

        <hr />

        <section className="stalls">
          <div className="section-top">
            <h3>Stall List</h3>
            <a className="view-more" href="/admin/stalls">View more</a>
          </div>
          <div className="stalls-columns">
            <div className="stalls-col">
            </div>
            <div className="stalls-col">
            </div>
            <div className="stalls-col">
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminHome;