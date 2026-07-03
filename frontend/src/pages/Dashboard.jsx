import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Database, HardDrive, Cpu, Activity, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import SquiggleText from '../components/SquiggleText';
import SpotlightCard from '../components/SpotlightCard';
import StarBorder from '../components/StarBorder';

const ChartWrapper = lazy(() => import('../components/ChartWrapper'));

const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' };

function Dashboard() {
  const [chartData, setChartData] = useState([]);

  // eslint-disable-next-line react-doctor/no-fetch-in-effect
  // eslint-disable-next-line react-doctor/no-fetch-in-effect
  useEffect(() => {
    let ignore = false;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/dna/history`);
        if (!ignore) {
          const data = res.data.map(item => ({
            name: item.filename.substring(0, 10) + '...',
            gc: item.gc_content,
            length: item.dna_length_bp
          })).slice(0, 10).reverse(); // Last 10 encodes
          setChartData(data);
        }
      } catch (err) {
        if (!ignore) console.error("Failed to fetch history for charts", err);
      }
    };
    fetchHistory();
    return () => { ignore = true; };
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-cyan)', textShadow: '0 0 20px rgba(0, 255, 204, 0.4)' }}>
          <SquiggleText text="Storage Reimagined" />
        </h1>
        <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px' }}>
          Welcome to HelixVault. Convert your digital files into synthesized DNA sequences, ensuring data longevity for millennia.
        </p>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '3rem' }}>
        <SpotlightCard className="glass-panel" spotlightColor="rgba(0, 255, 204, 0.2)">
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <HardDrive color="var(--accent-cyan)" size={32} />
            </div>
            <div>
              <h3>Traditional Storage</h3>
              <p className="text-muted">Magnetic/Solid State</p>
            </div>
          </div>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>Lifespan: ~10-30 years</p>
          <div style={{ width: '100%', height: '8px', background: 'var(--glass-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ width: '5%', height: '100%', background: 'var(--text-secondary)' }}></div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="glass-panel" spotlightColor="rgba(157, 78, 221, 0.2)" style={{ borderColor: 'rgba(157, 78, 221, 0.3)', boxShadow: 'var(--shadow-neon)' }}>
          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <Database color="var(--accent-purple)" size={32} />
            </div>
            <div>
              <h3>DNA Storage</h3>
              <p className="text-muted">Biological Macromolecules</p>
            </div>
          </div>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>Lifespan: ~500,000+ years</p>
          <div style={{ width: '100%', height: '8px', background: 'var(--glass-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'var(--accent-gradient)' }}></div>
          </div>
        </SpotlightCard>
      </div>

      <h2 style={{ marginBottom: '1.5rem' }}>System Overview</h2>
      <div style={statsGridStyle}>
        <SpotlightCard className="glass-panel" spotlightColor="rgba(0, 255, 204, 0.15)" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <Activity size={24} color="var(--accent-cyan)" style={{ marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>~50%</h3>
          <p className="text-muted">Target GC Content</p>
        </SpotlightCard>
        <SpotlightCard className="glass-panel" spotlightColor="rgba(157, 78, 221, 0.15)" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <Cpu size={24} color="var(--accent-purple)" style={{ marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>0</h3>
          <p className="text-muted">Homopolymers Detected</p>
        </SpotlightCard>
        <SpotlightCard className="glass-panel" spotlightColor="rgba(255, 0, 128, 0.15)" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <Database size={24} color="var(--text-primary)" style={{ marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Base-3</h3>
          <p className="text-muted">Encoding Algorithm</p>
        </SpotlightCard>
      </div>

      {chartData.length > 0 && (
        <SpotlightCard className="glass-panel" spotlightColor="rgba(0, 255, 204, 0.1)" style={{ marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 color="var(--accent-cyan)" /> GC Content Analytics (Recent Encodes)
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <Suspense fallback={<div className="flex-center" style={{ height: '100%', color: 'var(--text-secondary)' }}>Loading chart...</div>}>
              <ChartWrapper data={chartData} />
            </Suspense>
          </div>
        </SpotlightCard>
      )}

      <div style={{ marginTop: '3rem', marginBottom: '3rem', textAlign: 'center' }}>
        <Link to="/encode" style={{ textDecoration: 'none' }}>
          <StarBorder as="button" color="var(--accent-cyan)" speed="4s" style={{ cursor: 'pointer' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Start Encoding Data</span>
          </StarBorder>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
