import React, { useState } from 'react';
import auth from '../services/auth';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await auth.register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #4F8EF7 0%, #6DD5FA 100%)' }}>
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 8px 32px rgba(79,142,247,0.15)', padding: 40, width: 350, maxWidth: '90vw', textAlign: 'center' }}>
        
        <h1 style={{ fontFamily: 'Segoe UI, Arial, sans-serif', color: '#4F8EF7', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>StudyPal</h1>
        <h2 style={{ fontWeight: 400, color: '#222', marginBottom: 24 }}>Create your account</h2>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontWeight: 500, color: '#4F8EF7' }}>Email</label>
            <input name="email" value={form.email} onChange={onChange} required type="email" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #dbeafe', marginTop: 4, fontSize: 16 }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontWeight: 500, color: '#4F8EF7' }}>Password</label>
            <input type="password" name="password" value={form.password} onChange={onChange} required style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #dbeafe', marginTop: 4, fontSize: 16 }} />
          </div>
          <button type="submit" style={{ background: 'linear-gradient(90deg, #4F8EF7 0%, #6DD5FA 100%)', color: 'white', fontWeight: 600, fontSize: 18, border: 'none', borderRadius: 8, padding: '12px 0', cursor: 'pointer', marginTop: 8, boxShadow: '0 2px 8px rgba(79,142,247,0.10)' }}>Register</button>
          {error && <div style={{ color: '#e53e3e', fontWeight: 500, marginTop: 8 }}>{error}</div>}
        </form>
        <p style={{ marginTop: 24, color: '#555', fontSize: 15 }}>
          Already have an account? <Link to="/login" style={{ color: '#4F8EF7', fontWeight: 500, textDecoration: 'underline' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
