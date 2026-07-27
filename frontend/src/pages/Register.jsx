import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
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
    
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, { email, password });
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
      await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, { email, otp });
      setSuccess('Account verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP');
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
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: '#1a1a1a', marginBottom: '0.5rem', fontSize: '2.5rem' }}>
              {step === 1 ? 'Sign up' : 'Verify Email'}
            </h2>
            <p style={{ color: '#666' }}>
              {step === 1 ? 'Create an account to start encoding.' : `Enter the OTP sent to ${email}`}
            </p>
          </div>
          
          {error && (
            <div style={{ background: '#ffeeee', color: '#cc0000', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ background: '#eeffee', color: '#008800', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {success}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="register-email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  Email Address
                </label>
                <input 
                  id="register-email"
                  type="email" 
                  required
                  className="input-minimal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="off"
                />
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <label htmlFor="register-password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-minimal"
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
                className="btn btn-solid-black" 
                style={{ width: '100%', padding: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Generate OTP & Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div style={{ marginBottom: '2.5rem' }}>
                <label htmlFor="otp-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  6-Digit OTP
                </label>
                <input 
                  id="otp-input"
                  type="text" 
                  required
                  className="input-minimal"
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
                className="btn btn-solid-black" 
                style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              
              <button 
                type="button" 
                className="btn" 
                style={{ width: '100%', justifyContent: 'center', color: '#666', border: 'none' }}
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back to Registration
              </button>
            </form>
          )}

          {step === 1 && (
            <p style={{ textAlign: 'center', marginTop: '2rem', color: '#666', fontSize: '0.9rem' }}>
              Already have an account? <Link to="/login" style={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
