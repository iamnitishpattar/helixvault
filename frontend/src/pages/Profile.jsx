import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, ShieldAlert, BarChart2, Mail, Key } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';
import { logClientRequestFailure } from '../utils/errorMessages';

function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/dna/stats`, {
          withCredentials: true
        });
        if (!ignore) {
          setStats(res.data);
        }
      } catch (err) {
        if (!ignore) logClientRequestFailure('Failed to fetch user stats for profile', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchStats();
    return () => { ignore = true; };
  }, []);

  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="text-gradient"><User style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} /> Account Profile</h2>
        <p className="text-muted">Manage your HelixVault enterprise account and security settings.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={40} color="#000" />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#fff' }}>Operator Identity</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <Mail size={16} /> {user?.email || 'Authenticated User'}
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', marginBottom: '2rem' }}>
          <h4 style={{ color: 'var(--gold-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={18} /> Storage Footprint
          </h4>
          
          {loading ? (
            <p className="text-muted">Loading metrics...</p>
          ) : stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Vaulted Payloads</p>
                <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{stats.total_files}</p>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total DNA Sequenced</p>
                <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{stats.total_bp_encoded.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>bp</span></p>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Est. Synthesis Cost</p>
                <p style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>${stats.total_synthesis_cost_usd.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted">No metrics available.</p>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
          <h4 style={{ color: 'var(--gold-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={18} /> Account Actions
          </h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={logout}
              className="btn btn-dark" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
            >
              <LogOut size={16} /> Terminate Session
            </button>
            
            <button 
              className="btn" 
              style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30', border: '1px solid rgba(255, 59, 48, 0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
              onClick={() => toast.info('Action Required', 'Account deletion requires administrative authorization. Please contact support.')}
            >
              <ShieldAlert size={16} /> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
