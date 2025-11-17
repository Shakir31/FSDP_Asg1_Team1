import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import '../admin.css';

function AdminHome() {
  return (
    <main className="admin-content">
      <section className="reviews">
        <div className="section-top">
          <h3>Review</h3>
          <a className="view-more">View more</a>
        </div>
      </section>

      <hr />

      <section className="stores">
        <div className="section-top">
          <h3>Stores List</h3>
          <a className="view-more">View more</a>
        </div>
        <div className="stores-columns">
          <div className="stores-col">
          </div>
          <div className="stores-col">
          </div>
          <div className="stores-col">
          </div>
        </div>
      </section>

      <hr />

      <section className="accounts">
        <h3>User/Store owner account List</h3>
        <div className="accounts-row">
          <Link to="/admin/users" aria-label="View user accounts">
            <div className="avatar large" />
          </Link>
          <Link to="/admin/store" aria-label="View store owner accounts">
            <div className="avatar chef"></div>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default AdminHome;