import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../admin.css';

function Stall() {
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusCode, setStatusCode] = useState(null);

  async function fetchStalls() {
    try {
      setLoading(true);
      setError(null);
      setStatusCode(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/admin/stalls`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        setStatusCode(res.status);
        const text = await res.text();
        throw new Error(`Failed to load stalls: ${res.status} ${text}`);
      }
      const data = await res.json();
      setStalls(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStalls();
  }, []);

  if (loading) return <div className="admin-wrapper"><p>Loading stalls...</p></div>;
  if (error) return <div className="admin-wrapper"><p>Error: {error}</p></div>;

  return (
    <div className="admin-wrapper">
      <div style={{ padding: 20 }}>
        <div style={{ maxWidth: 800, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ textAlign: 'left', margin: 0 }}>Stall list</h2>
          <Link to="/admin/stores/create" className="btn-primary" style={{ textDecoration: 'none' }}>Add New Stall</Link>
        </div>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {stalls.map(s => (
            <div key={s.StallID} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e7e7e7', padding: 20, borderRadius: 8 }}>
                <div>
                  <div><strong>Stall Name:</strong> {s.StallName}</div>
                  <div><strong>Hawker Center:</strong> {s.Hawker_Center}</div>
                  <div><strong>Category:</strong> {s.Category}</div>
                  <div><strong>Description:</strong> {s.Description}</div>
                </div>
                <Link to={`/admin/stalls/${s.StallID}`} style={{ fontSize: 24, color: '#222', textDecoration: 'none' }}>&gt;</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Stall;