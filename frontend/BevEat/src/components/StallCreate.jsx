import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../admin.css';

function StallCreate() {
  const navigate = useNavigate();
  const [StallName, setStallName] = useState('');
  const [Hawker_Centre, setHawkerCentre] = useState('');
  const [Category, setCategory] = useState('');
  const [Description, setDescription] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleCreate(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const body = { stallName: StallName, hawker_centre: Hawker_Centre, category: Category, description: Description };
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/stalls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body)
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(`Create failed: ${res.status} ${txt}`);
      setMessage('Stall created successfully');
      navigate('/admin/stalls');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin-wrapper">
      <div className="update-container">
        <div className="update-inner">
          <a className="back-link" onClick={() => navigate(-1)}>&larr;</a>
          <form onSubmit={handleCreate} className="update-form">
            <div className="form-row">
              <label>STALL NAME</label>
              <input value={StallName} onChange={e => setStallName(e.target.value)} />
            </div>
            <div className="form-row">
              <label>HAWKER CENTRE</label>
              <input value={Hawker_Centre} onChange={e => setHawkerCentre(e.target.value)} />
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
                <button type="submit" className="btn-primary">Create</button>
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

export default StallCreate;