import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email }, { timeout: 25000 });
      setStep(2);
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('The server is waking up (free tier). Please wait 30 seconds and try again.');
      } else {
        setError(err.response?.data?.detail || 'Failed to send reset code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email,
        otp,
        new_password: newPassword
      }, { timeout: 25000 });
      setStep(3);
    } catch (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('The server is waking up (free tier). Please wait 30 seconds and try again.');
      } else {
        setError(err.response?.data?.detail || 'Password reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'row' }}>
      {/* Left Panel - Visuals */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <h1 style={{ fontSize: '3.5rem', color: '#fff', textShadow: '0 4px 20px rgba(0,0,0,0.5)', marginBottom: '0.5rem' }}>HELIXVAULT</h1>
          <p style={{ color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.9rem' }}>The Biological Data Engine</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{ flex: 1, backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', color: '#1a1a1a' }}>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
            <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: step >= 1 ? '#1a1a1a' : '#eee' }} />
            <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: step >= 2 ? '#1a1a1a' : '#eee' }} />
            <div style={{ height: '4px', flex: 1, borderRadius: '2px', background: step >= 3 ? '#1a1a1a' : '#eee' }} />
          </div>

          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: '#1a1a1a', marginBottom: '0.5rem', fontSize: '2.5rem' }}>
              {step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Success!'}
            </h2>
            <p style={{ color: '#666' }}>
              {step === 1 ? "Enter your email to receive a reset code." : step === 2 ? "Enter the 6-digit code sent to your email." : "Your password has been reset."}
            </p>
          </div>

          {error && (
            <div style={{ background: '#ffeeee', color: '#cc0000', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: '2.5rem' }}>
                <label htmlFor="forgot-email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  className="input-minimal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="btn btn-solid-black" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="forgot-otp" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  6-Digit OTP
                </label>
                <input
                  id="forgot-otp"
                  type="text"
                  required
                  className="input-minimal"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  style={{ letterSpacing: '0.5rem', textAlign: 'center', fontSize: '1.2rem' }}
                  autoComplete="off"
                />
              </div>
              <div style={{ marginBottom: '2.5rem' }}>
                <label htmlFor="forgot-new-password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="forgot-new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-minimal"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    style={{ paddingRight: '2.5rem' }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="password-toggle-btn"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-solid-black" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle2 size={64} color="#00aa00" style={{ margin: '0 auto 1.5rem' }} />
              <button type="button" onClick={() => navigate('/login')} className="btn btn-solid-black" style={{ width: '100%', padding: '1rem' }}>
                Return to Log in
              </button>
            </div>
          )}

          {step !== 3 && (
            <p style={{ textAlign: 'center', marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>
              Remembered your password? <Link to="/login" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
