import { useState, useEffect } from 'react';
import { Database, HardDrive, Cpu, Activity, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

function Dashboard() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`\${import.meta.env.VITE_API_URL || 'https://helixvault.onrender.com'}/api/dna/history` );
        const data = res.data.map(item => ({
          name: item.filename.substring(0, 10) + '...',
          gc: item.gc_content,
          length: item.dna_length_bp
        })).slice(0, 10).reverse(); // Last 10 encodes
        setChartData(data);
      } catch (err) {
        console.error("Failed to fetch history for charts", err);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }} className="text-gradient">Storage Reimagined</h1>
        <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px' }}>
          Welcome to HelixVault. Convert your digital files into synthesized DNA sequences, ensuring data longevity for millennia.
        </p>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '3rem' }}>
        <div className="glass-panel">
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
        </div>

        <div className="glass-panel" style={{ borderColor: 'rgba(157, 78, 221, 0.3)', boxShadow: 'var(--shadow-neon)' }}>
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
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem' }}>System Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <Activity size={24} color="var(--accent-cyan)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>~50%</h3>
          <p className="text-muted">Target GC Content</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <Cpu size={24} color="var(--accent-purple)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>0</h3>
          <p className="text-muted">Homopolymers Detected</p>
        </div>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <Database size={24} color="var(--text-primary)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Base-3</h3>
          <p className="text-muted">Encoding Algorithm</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="glass-panel" style={{ marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 color="var(--accent-cyan)" /> GC Content Analytics (Recent Encodes)
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" domain={[0, 100]} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--accent-cyan)' }}
                  itemStyle={{ color: 'var(--accent-cyan)' }}
                />
                <Area type="monotone" dataKey="gc" stroke="var(--accent-cyan)" fillOpacity={1} fill="url(#colorGc)" name="GC Content %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <Link to="/encode" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
            Start Encoding Data
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
