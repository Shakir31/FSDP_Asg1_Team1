import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../admin.css';

function StallUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [StallName, setStallName] = useState('');
  const [HawkerCenter, setHawkerCenter] = useState('');
  const [Category, setCategory] = useState('');
  const [Description, setDescription] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStallProfile() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/admin/stalls/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to load profile: ${res.status} ${txt}`);
        }
        const data = await res.json();
        setStallName(data.StallName || '');
        setHawkerCenter(data.HawkerCenter || '');
        setCategory(data.Category || '');
        setDescription(data.Description || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStallProfile();
  }, [id]);

  async function handleStallUpdate(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const body = { StallName: StallName, HawkerCenter: HawkerCenter, Category: Category, Description: Description };
      if (password) body.Password = password;
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/admin/stalls/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body)
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(`Update failed: ${res.status} ${txt}`);
      setMessage('Profile updated successfully');
      setPassword('');
      if (id) navigate('/admin/stalls');
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteStall() {
    const confirmed = window.confirm('Delete this stall? This action cannot be undone.');
    if (!confirmed) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/admin/stalls/${id}`, { 
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete failed: ${res.status} ${txt}`);
        }

        if (id) navigate('/admin/stalls');
        else navigate('/');
    } catch (err) {
        setError(err.message);
    }
  }  
  

  return (
    <div className="admin-wrapper">
      <div className="update-container">
        <div className="update-inner">
          <a className="back-link" onClick={() => navigate(-1)}>&larr;</a>
          <form onSubmit={handleStallUpdate} className="update-form">
            <div className="form-row">
              <label>STALL NAME</label>
              <input value={StallName} onChange={e => setStallName(e.target.value)} />
            </div>
            <div className="form-row">
              <label>HAWKER CENTER</label>
              <input value={HawkerCenter} onChange={e => setHawkerCenter(e.target.value)} />
            </div>
            <div className="form-row">
              <label>CATEGORY</label>
              <input value={Category} onChange={e => setCategory(e.target.value)} />
            </div>
            <div className="form-row">
              <label>DESCRIPTION</label>
              <input value={Description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="form-actions">
              <div className="actions-row">
                <button type="submit" className="btn-primary">Update</button>
                <button type="button" className="btn-danger" onClick={deleteStall}>Delete</button>
              </div>
            </div>

            {message && <div className="message">{message}</div>}
            {error && <div className="error">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default StallUpdate;