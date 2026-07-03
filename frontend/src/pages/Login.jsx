import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Dna } from 'lucide-react';
import { API_BASE_URL } from '../config';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      await login();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: '-1rem', overflow: 'hidden' }}>
      {/* Left Panel - Visuals */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.5rem', color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,0.5)', marginBottom: '0.5rem' }}>HELIXVAULT</h1>
          <p style={{ color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.9rem' }}>The Biological Data Engine</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{ flex: 1, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '340px', color: '#1a1a1a' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', letterSpacing: '0.6em', fontSize: '1.4rem', fontWeight: 300, color: '#1a1a1a', fontFamily: "'Outfit', sans-serif" }}>
              <Dna size={24} style={{ marginLeft: '-0.6em' }} /> H E L I X
            </div>
          </div>

          <h2 style={{ color: '#1a1a1a', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Log in</h2>

          {error && (
            <div style={{ background: '#ffeeee', color: '#cc0000', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}



          <form onSubmit={handleLogin}>
            <div style={{ background: '#f5f5f5', borderRadius: '6px', padding: '2px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <input
                id="login-email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email or username"
                autoComplete="off"
                style={{ width: '100%', padding: '1rem', border: 'none', background: '#fff', borderRadius: '4px 4px 0 0', outline: 'none', fontSize: '0.9rem', color: '#1a1a1a' }}
              />
              
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  autoComplete="new-password"
                  style={{ width: '100%', padding: '1rem', paddingRight: '4rem', border: 'none', background: '#fff', borderRadius: '0 0 4px 4px', outline: 'none', fontSize: '0.9rem', color: '#1a1a1a' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{ width: '100%', padding: '1rem', background: '#2a2a2a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: '1.5rem' }}
              disabled={loading}
              onMouseOver={e => e.currentTarget.style.background = '#1a1a1a'}
              onMouseOut={e => e.currentTarget.style.background = '#2a2a2a'}
            >
              {loading ? 'Authenticating...' : 'Log in'}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Link to="/forgot-password" style={{ color: '#1a1a1a', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>
              Forgot password?
            </Link>
            
            <p style={{ marginTop: '2rem', color: '#666', fontSize: '0.85rem' }}>
              Don't have an account? <Link to="/register" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
