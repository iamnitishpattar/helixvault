import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Database, HardDrive, Cpu, Activity, BarChart2, Shield, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import SpotlightCard from '../components/SpotlightCard';
import { useAuth } from '../context/AuthContext';
import { getSafeApiErrorMessage, logClientRequestFailure } from '../utils/errorMessages';
import LongevityCalculator from '../components/LongevityCalculator';
import PhysicalStorageSimulator from '../components/PhysicalStorageSimulator';

const ChartWrapper = lazy(() => import('../components/ChartWrapper'));
const API_KEY_ERROR = 'Unable to update API keys right now. Please try again later.';

function Dashboard() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Developer API State
  const [apiKeys, setApiKeys] = useState([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKey, setNewKey] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const isRevokingRef = useRef(false);

  useEffect(() => {
    let ignore = false;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/dna/history`, {
          withCredentials: true
        });
        if (!ignore) {
          const data = res.data.map(item => ({
            name: item.filename.substring(0, 10) + '...',
            gc: item.gc_content,
            length: item.dna_length_bp
          })).slice(0, 10).reverse();
          setChartData(data);
        }
      } catch (err) {
        if (!ignore) logClientRequestFailure('Failed to fetch history for charts', err);
      }
    };
    fetchHistory();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/dna/stats`, { 
          withCredentials: true
        });
        if (!ignore) setUserStats(res.data);
      } catch (err) {
        if (!ignore) logClientRequestFailure('Failed to fetch user stats', err);
      } finally {
        if (!ignore) setStatsLoading(false);
      }
    };
    fetchStats();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchKeys = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/developer/keys`, { 
          withCredentials: true
        });
        if (!ignore) setApiKeys(res.data);
      } catch (err) {
        if (!ignore) logClientRequestFailure('Failed to fetch API keys', err);
      } finally {
        if (!ignore) setKeysLoading(false);
      }
    };
    fetchKeys();
    return () => { ignore = true; };
  }, []);

  const handleGenerateKey = async () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/developer/keys?name=Project+Key`, {}, { 
        withCredentials: true
      });
      setNewKey(res.data.api_key);
      setApiKeys([...apiKeys, { id: res.data.id, name: res.data.name, created_at: new Date().toISOString(), is_active: true }]);
    } catch (err) {
      logClientRequestFailure('API key generation failed', err);
      alert(getSafeApiErrorMessage(err, API_KEY_ERROR));
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  const handleRevokeKey = async (id) => {
    if (isRevokingRef.current) return;
    isRevokingRef.current = true;
    try {
      setIsRevoking(true);
      await axios.delete(`${API_BASE_URL}/api/developer/keys/${id}`, { 
        withCredentials: true
      });
      setApiKeys(apiKeys.filter(k => k.id !== id));
    } catch (err) {
      logClientRequestFailure('API key revocation failed', err);
      alert(getSafeApiErrorMessage(err, API_KEY_ERROR));
    } finally {
      setIsRevoking(false);
      isRevokingRef.current = false;
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '6rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>The Biological<br/>Data Engine</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '600px', lineHeight: '1.8' }}>
          Powering genomic archives and next-gen cold storage. 
          Convert digital files into synthesized DNA sequences, ensuring data longevity for millennia. Encode, analyze, and store in one place. Ship to the future.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/encode" className="btn btn-outline-gold" style={{ padding: '1rem 2rem' }}>
            START ENCODING
          </Link>
          <Link to="/decode" className="btn btn-dark" style={{ padding: '1rem 2rem' }}>
            DECODE DATA
          </Link>
          <Link to="/vault" className="btn btn-dark" style={{ padding: '1rem 2rem' }}>
            <Database size={18} /> VAULT
          </Link>
        </div>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: '#666' }}>BASE-3 ENCODING IS LIVE</p>
      </div>

      {/* Showcase Grid */}
      <div className="showcase-grid">
        <SpotlightCard className="showcase-card" spotlightColor="rgba(255, 255, 255, 0.05)">
          <h3>DNA Storage</h3>
          <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem 0' }}>
            <Database color="var(--text-primary)" size={48} />
            <p className="text-muted" style={{ textAlign: 'center' }}>Lifespan: ~500,000+ years<br/>Biological Macromolecules</p>
          </div>
        </SpotlightCard>

        <SpotlightCard className="showcase-card" spotlightColor="rgba(255, 255, 255, 0.05)">
          <h3>Traditional Storage</h3>
          <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem 0' }}>
            <HardDrive color="var(--text-secondary)" size={48} />
            <p className="text-muted" style={{ textAlign: 'center' }}>Lifespan: ~10-30 years<br/>Magnetic / Solid State</p>
          </div>
        </SpotlightCard>

        {user ? (
          <SpotlightCard className="showcase-card" spotlightColor="rgba(255, 255, 255, 0.05)">
            <h3>Your Vault Stats</h3>
          {statsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              {[1,2,3].map(i => <div key={i} style={{ height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />)}
            </div>
          ) : !userStats || userStats.total_files === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>
              <Database size={32} style={{ opacity: 0.3, margin: '0 auto' }} />
              <p style={{ fontSize: '0.85rem' }}>No sequences encoded yet.<br/>Start by encoding a file!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted"><Activity size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>Files Encoded</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{userStats.total_files}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted"><Cpu size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>Total Base Pairs</span>
                <strong>{userStats.total_bp_encoded?.toLocaleString()} bp</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted"><TrendingUp size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>Avg GC Content</span>
                <strong style={{ color: 'var(--accent-green)' }}>{userStats.avg_gc_content}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-muted"><Shield size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>AES Encrypted</span>
                <strong style={{ color: 'var(--accent-purple)' }}>{userStats.files_encrypted} files</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-muted"><Zap size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/>Est. Synthesis Cost</span>
                <strong style={{ color: 'var(--accent-gold)' }}>${userStats.total_synthesis_cost_usd?.toLocaleString()}</strong>
              </div>
            </div>
          )}
          </SpotlightCard>
        ) : (
          <SpotlightCard className="showcase-card flex-center" spotlightColor="rgba(255, 255, 255, 0.05)">
            <div style={{ textAlign: 'center' }}>
              <h3>Your Vault Stats</h3>
              <p className="text-muted" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Log in to view your encoding statistics.</p>
            </div>
          </SpotlightCard>
        )}

        {user ? (
          <SpotlightCard className="showcase-card" spotlightColor="rgba(255, 255, 255, 0.05)">
            <h3>Developer API</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem', marginTop: '0.5rem' }}>DNA-as-a-Service Access Keys</p>
          
          {newKey && (
            <div style={{ background: 'rgba(0,255,204,0.1)', border: '1px solid var(--accent-cyan)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', wordBreak: 'break-all' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Save this key now. It will not be shown again.</p>
              <code style={{ color: 'var(--accent-cyan)' }}>{newKey}</code>
            </div>
          )}

          {keysLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            </div>
          ) : apiKeys.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ fontSize: '0.85rem' }}>No API keys generated.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {apiKeys.map(k => (
                <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{k.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created: {new Date(k.created_at).toLocaleDateString()}</div>
                  </div>
                  <button disabled={isRevoking} type="button" onClick={() => handleRevokeKey(k.id)} className="btn btn-sm" style={{ background: 'rgba(255,0,0,0.1)', color: '#ff4444', border: '1px solid rgba(255,0,0,0.2)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}

            <button disabled={isGenerating} type="button" onClick={handleGenerateKey} className="btn" style={{ width: '100%', marginTop: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {isGenerating ? "Generating..." : "+ Generate New Key"}
            </button>
          </SpotlightCard>
        ) : (
          <SpotlightCard className="showcase-card flex-center" spotlightColor="rgba(255, 255, 255, 0.05)">
            <div style={{ textAlign: 'center' }}>
              <h3>Developer API</h3>
              <p className="text-muted" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Log in to manage API keys.</p>
            </div>
          </SpotlightCard>
        )}
      </div>

      {chartData.length > 0 && (
        <div className="container" style={{ marginTop: '4rem' }}>
          <SpotlightCard className="showcase-card" spotlightColor="rgba(255, 255, 255, 0.05)">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={16} /> GC Content Analytics
            </h3>
            <div style={{ width: '100%', height: 300, marginTop: '2rem' }}>
              <Suspense fallback={<div className="flex-center" style={{ height: '100%', color: 'var(--text-secondary)' }}>Loading chart...</div>}>
                <ChartWrapper data={chartData} />
              </Suspense>
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* Interactive Biological & Archival Visualizers */}
      <div className="container" style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Interactive DNA Storage Tools</h2>
          <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
            Explore longevity timelines and container volume metrics for biological macromolecule archival.
          </p>
        </div>
        <LongevityCalculator />
        <PhysicalStorageSimulator userBytes={userStats?.total_bp_encoded || 0} />
      </div>
    </div>
  );
}

export default Dashboard;
