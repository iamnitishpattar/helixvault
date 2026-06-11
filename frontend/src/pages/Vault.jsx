import { useState, useEffect } from 'react';
import { Archive, Lock, Shield, Dna } from 'lucide-react';
import axios from 'axios';

function Vault() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/dna/history');
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="text-gradient"><Archive style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} /> My DNA Vault</h2>
        <p className="text-muted">A secure history of all your synthesized DNA payloads.</p>
      </div>

      <div className="glass-panel">
        {loading ? (
          <p className="text-muted text-center">Loading vault data...</p>
        ) : history.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem' }}>
            <Archive size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3>Your Vault is Empty</h3>
            <p className="text-muted">Encode some files to see them appear here.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Filename</th>
                <th style={{ padding: '1rem' }}>Date</th>
                <th style={{ padding: '1rem' }}>Size (Bytes)</th>
                <th style={{ padding: '1rem' }}>DNA Length (bp)</th>
                <th style={{ padding: '1rem' }}>Features</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.filename}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem' }}>{item.original_size_bytes}</td>
                  <td style={{ padding: '1rem', color: 'var(--accent-cyan)' }}>{item.dna_length_bp}</td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    {item.is_encrypted && <Lock size={16} color="var(--accent-purple)" title="Encrypted" />}
                    {item.has_error_correction && <Shield size={16} color="var(--accent-cyan)" title="Error Correction" />}
                    {item.has_steganography && <Dna size={16} color="var(--text-primary)" title="Steganography" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Vault;
