import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Database, HardDrive, Cpu, Activity, BarChart2, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import SpotlightCard from '../components/SpotlightCard';

const ChartWrapper = lazy(() => import('../components/ChartWrapper'));

function Dashboard() {
  const [chartData, setChartData] = useState([]);

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
          })).slice(0, 10).reverse();
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

        <SpotlightCard className="showcase-card" spotlightColor="rgba(255, 255, 255, 0.05)">
          <h3>System Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted"><Activity size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/> GC Content</span>
              <strong>~50%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted"><Cpu size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/> Homopolymers</span>
              <strong>0</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-muted"><Shield size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }}/> Algorithm</span>
              <strong>Base-3</strong>
            </div>
          </div>
        </SpotlightCard>
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
    </div>
  );
}

export default Dashboard;
