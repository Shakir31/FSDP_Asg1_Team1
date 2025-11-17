import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../admin.css';

function UserUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/admin/users/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to load profile: ${res.status} ${txt}`);
        }
        const data = await res.json();
        setName(data.Name || '');
        setEmail(data.Email || '');
        setPhone(data.Phone || '');
        setAddress(data.Address || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [id]);

  async function handleUpdate(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const body = { Name: name, Email: email, Phone: phone, Address: address };
      if (password) body.Password = password;
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body)
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(`Update failed: ${res.status} ${txt}`);
      setMessage('Profile updated successfully');
      setPassword('');
      if (id) navigate('/admin/users');
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteUser() {
    const confirmed = window.confirm('Delete this user? This action cannot be undone.');
    if (!confirmed) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/admin/users/${id}`, { 
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Delete failed: ${res.status} ${txt}`);
        }

        if (id) navigate('/admin/users');
        else navigate('/');
    } catch (err) {
        setError(err.message);
    }
  }  
  

  return (
    <div className="admin-wrapper">
      <div className="user-update-container">
        <div className="user-update-inner">
          <a className="back-link" onClick={() => navigate(-1)}>&larr;</a>
          <form onSubmit={handleUpdate} className="update-form">
            <div className="form-row">
              <label>NAME</label>
              <input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-row">
              <label>EMAIL</label>
              <input value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-row">
              <label>PASSWORD</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
            </div>
            {/* <div className="form-row">
              <label>PHONE</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-row">
              <label>ADDRESS</label>
              <input value={address} onChange={e => setAddress(e.target.value)} />
            </div> */}
            <div className="form-actions">
              <div className="actions-row">
                <button type="submit" className="btn-primary">Update</button>
                <button type="button" className="btn-danger" onClick={deleteUser}>Delete</button>
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

export default UserUpdate;
