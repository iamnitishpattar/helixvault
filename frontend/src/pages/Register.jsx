import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, UserPlus, Key, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [step, setStep] = useState(1); // 1: Register, 2: Verify OTP
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register` , {
        email,
        password
      });
      setSuccess('OTP sent to your email! Please check your inbox.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.post(`${API_BASE_URL}/api/auth/verify-otp` , {
        email,
        otp
      });
      setSuccess('Account verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {step === 1 ? 'Create Account' : 'Verify Email'}
        </h2>
        
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}
        
        {success && (
          <div className="alert-success">
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="register-email" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <Mail size={16} /> Email Address
              </label>
              <input 
                id="register-email"
                type="email" 
                required
                className="input-glass"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="off"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label htmlFor="register-password" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <Lock size={16} /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-glass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength="6"
                  style={{ paddingRight: '2.5rem' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Generate OTP & Continue'} <Mail size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Enter the 6-digit OTP sent to <strong>{email}</strong>
            </p>
            
            <div style={{ marginBottom: '2rem' }}>
              <label htmlFor="otp-input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <Key size={16} /> 6-Digit OTP
              </label>
              <input 
                id="otp-input"
                type="text" 
                required
                className="input-glass"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength="6"
                style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.2rem' }}
                autoComplete="off"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP'} <ArrowRight size={18} />
            </button>
            
            <button 
              type="button" 
              className="btn" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', background: 'transparent' }}
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back to Registration
            </button>
          </form>
        )}

        {step === 1 && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-cyan)' }}>Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}
