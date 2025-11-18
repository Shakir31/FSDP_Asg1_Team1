import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import '../admin.css';

function AdminHome() {
  const [stallsByCentre, setStallsByCentre] = useState({});
  const [loadingStalls, setLoadingStalls] = useState(true);
  const [stallsError, setStallsError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingStalls(true);
        setStallsError(null);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch('http://localhost:3000/admin/stalls', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to load stalls: ${res.status} ${txt}`);
        }
        if (!contentType.includes('application/json')) {
          const txt = await res.text();
          throw new Error(
            `Expected JSON response but received '${contentType}'. Response preview: ${txt.slice(0,200)}`
          );
        }
        const data = await res.json();
        if (!mounted) return;

        const centres = {};
        (data || []).forEach((s) => {
          const centre = s.Hawker_Centre || s.HawkerCentre || s.hawker_centre || 'Unknown Centre';
          const cat = s.Category || s.category || 'Uncategorized';
          if (!centres[centre]) centres[centre] = {};
          if (!centres[centre][cat]) centres[centre][cat] = [];
          centres[centre][cat].push(s);
        });
        setStallsByCentre(centres);
      } catch (err) {
        console.error('Error loading stalls for admin:', err);
        if (mounted) setStallsError(err.message || String(err));
      } finally {
        if (mounted) setLoadingStalls(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  
  return (
    <main className="content">
      <div className='admin-content'>
        <section className="accounts">
          <div className="accounts-header"><h3>User & Stall Owner Accounts</h3></div>
          <div className="accounts-row">
            <div className="account-card">
              <Link to="/admin/users" aria-label="View user accounts" className="account-link">
                <div className="avatar emoji">👥</div>
              </Link>
              <div className="account-label">Users</div>
            </div>

            <div className="account-card">
              <Link to="/admin/stalls-owner" aria-label="View stall owner accounts" className="account-link">
                <div className="avatar emoji">👩‍🍳</div>
              </Link>
              <div className="account-label">Stall Owners</div>
            </div>
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

        <section className="stalls-list">
          <div className="section-top">
            <h3>Stall List</h3>
            <Link to="/admin/stalls" className="view-more">View more</Link>
          </div>
          <div className="stalls-columns">
            {loadingStalls ? (
              <div className="stalls-loading">Loading stalls...</div>
            ) : stallsError ? (
              <div className="stalls-error">Error: {stallsError}</div>
            ) : (
              (() => {
                const centres = Object.keys(stallsByCentre || {});
                const cols = [[], [], []];
                centres.forEach((c, idx) => cols[idx % 3].push(c));

                return cols.map((colCentres, colIdx) => (
                  <div className="stalls-col" key={colIdx}>
                    {colCentres.map((centre) => (
                      <div key={centre} className="centre-card">
                        <h4 className="centre-title">{centre}</h4>
                        {Object.keys(stallsByCentre[centre] || {}).map((cat) => {
                          const items = stallsByCentre[centre][cat] || [];
                          return (
                            <div key={cat} className="category-block">
                              <div className="category-title">
                                {cat}
                                <span className="count-badge">{items.length}</span>
                              </div>
                              <ul className="stall-list">
                                {items.map((s) => (
                                  <li key={s.StallID || s.stallId} className="stall-item">
                                    <Link to={`/admin/stalls/${s.StallID || s.stallId}`} className="stall-link">
                                      {s.StallName || s.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ));
              })()
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminHome;