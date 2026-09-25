import { useState, useEffect } from 'react';
import { ShieldAlert, Users, Database, FileText } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';
import SkeletonLoader from '../components/SkeletonLoader';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let ignore = false;
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/stats`, { withCredentials: true });
        if (!ignore) {
          setStats(res.data.stats);
        }
      } catch (err) {
        if (!ignore) {
          toast.error("Access Denied", "You don't have admin privileges or the server is down.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchStats();
    return () => { ignore = true; };
  }, [toast]);

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="text-gradient">
          <ShieldAlert style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} /> 
          Admin Dashboard
        </h2>
        <p className="text-muted">Platform-wide statistics and management.</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <SkeletonLoader height="120px" />
          <SkeletonLoader height="120px" />
          <SkeletonLoader height="120px" />
          <SkeletonLoader height="120px" />
        </div>
      ) : stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <Users size={32} color="var(--accent-cyan)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{stats.total_users}</h3>
            <p className="text-muted" style={{ margin: 0 }}>Total Users</p>
          </div>
          
          <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <FileText size={32} color="var(--accent-purple)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{stats.total_encoded_files}</h3>
            <p className="text-muted" style={{ margin: 0 }}>Encoded Files</p>
          </div>
          
          <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <Database size={32} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{stats.total_dna_synthesized_bp}</h3>
            <p className="text-muted" style={{ margin: 0 }}>DNA Synthesized (bp)</p>
          </div>
          
          <div className="glass-panel" style={{ textAlign: 'center', padding: '2rem' }}>
            <Database size={32} color="#ff3b30" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{stats.total_storage_mb}</h3>
            <p className="text-muted" style={{ margin: 0 }}>Total Storage (MB)</p>
          </div>
        </div>
      ) : (
        <div className="glass-panel text-center" style={{ padding: '3rem' }}>
          <h3>Failed to load statistics</h3>
          <p className="text-muted">Ensure you have admin rights.</p>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
