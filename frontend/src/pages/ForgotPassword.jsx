import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, KeyRound, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email,
        otp,
        new_password: newPassword
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '80vh', padding: '2rem 0' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: step >= 1 ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)' }} />
          <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: step >= 2 ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)' }} />
          <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: step >= 3 ? 'var(--accent-pink)' : 'rgba(255,255,255,0.1)' }} />
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Success!'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          {step === 1 ? "Enter your email to receive a reset code." : step === 2 ? "Enter the 6-digit code sent to your email." : "Your password has been reset."}
        </p>

        {error && (
          <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4d4d', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid rgba(255,0,0,0.3)' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <Mail size={16} /> Email Address
              </label>
              <input
                type="email"
                required
                className="input-glass"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'} <ArrowRight size={18} />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <KeyRound size={16} /> 6-Digit OTP
              </label>
              <input
                type="text"
                required
                className="input-glass"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                style={{ letterSpacing: '0.2rem', textAlign: 'center', fontSize: '1.2rem' }}
              />
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                <Lock size={16} /> New Password
              </label>
              <input
                type="password"
                required
                className="input-glass"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(45deg, var(--accent-purple), var(--accent-pink))' }} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'} <ArrowRight size={18} />
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 size={64} color="var(--accent-cyan)" style={{ margin: '0 auto 1.5rem' }} />
            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Return to Login
            </button>
          </div>
        )}

        {step !== 3 && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
            Remembered your password? <Link to="/login" style={{ color: 'var(--accent-cyan)' }}>Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}
