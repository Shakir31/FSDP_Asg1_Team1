import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../admin.css';

function UserAccount() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusCode, setStatusCode] = useState(null);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);
      setStatusCode(null);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/admin/users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        setStatusCode(res.status);
        const text = await res.text();
        throw new Error(`Failed to load users: ${res.status} ${text}`);
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className="admin-wrapper"><p>Loading users...</p></div>;
  if (error) return <div className="admin-wrapper"><p>Error: {error}</p></div>;

  return (
    <div className="admin-wrapper">
      <div style={{ padding: 20 }}>
        <h2 style={{ textAlign: 'center' }}>User account list</h2>
        <div style={{ maxWidth: 800, margin: '20px auto' }}>
          {users.map(u => (
            <div key={u.UserID} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e7e7e7', padding: 20, borderRadius: 8 }}>
                <div>
                  <div><strong>Name:</strong> {u.Name}</div>
                  <div><strong>Email:</strong> {u.Email}</div>
                  <div><strong>Phone:</strong> {u.Phone || '-'}</div>
                  <div><strong>Address:</strong> {u.Address || '-'}</div>
                </div>
                <Link to={`/admin/users/${u.UserID}`} style={{ fontSize: 24, color: '#222', textDecoration: 'none' }}>&gt;</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UserAccount;