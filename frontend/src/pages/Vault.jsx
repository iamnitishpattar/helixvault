import { useState, useEffect } from 'react';
import { Archive, Lock, Shield, Dna, MapPin, FileText } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

function Vault() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE_URL}/api/dna/history`, { headers });
        if (!ignore) {
          setHistory(res.data);
        }
      } catch (err) {
        if (!ignore) console.error("Failed to fetch history", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchHistory();
    return () => { ignore = true; };
  }, []);

  const downloadProtocol = (item) => {
    const rack = Math.floor((item.id * 7) % 50) + 1;
    const box = (item.id % 10) + 1;
    const tube = `A${item.id}`;
    const location = `Rack ${rack}, Box ${box}, Tube ${tube}`;

    const protocolText = `================================================
HELIXVAULT ENTERPRISE DATA CENTER S.O.P.
================================================
Document ID: HV-SOP-${item.id}
Date Generated: ${new Date().toLocaleString()}

1. SAMPLE METADATA
------------------------------------------------
Original Filename: ${item.filename}
Payload Size: ${item.original_size_bytes} bytes
DNA Sequence Length: ${item.dna_length_bp} base pairs
Steganography Enabled: ${item.has_steganography ? "YES (E. coli Host)" : "NO"}
Error Correction: ${item.has_error_correction ? "YES (Reed-Solomon ECC)" : "NO"}
Encryption: ${item.has_encrypted ? "YES (AES-256)" : "NO"}

2. PHYSICAL STORAGE LOCATION
------------------------------------------------
Facility: Cold Archival Sub-Level 4
Location ID: ${location}
Preservation Temp: -80 C
Atmosphere: Nitrogen-sealed glass encapsulation

3. EXTRACTION PROTOCOL
------------------------------------------------
WARNING: Ensure sterile environment (BSL-1 minimum).
Step 1: Retrieve Tube ${tube} from Rack ${rack}, Box ${box}.
Step 2: Allow sample to thaw to room temperature for 15 minutes.
Step 3: Rehydrate dried DNA pellet with 50 µL of TE buffer (pH 8.0).
Step 4: Load 10 µL of rehydrated sample into Oxford Nanopore MinION sequencer.
Step 5: Process sequence output through HelixVault Heuristic Decoder algorithm.
Step 6: If Steganography=YES, apply marker isolation protocol before decoding.

================================================
Authorized by: HelixVault Automated Systems
================================================
`;
    const blob = new Blob([protocolText], { type: 'text/plain' });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = `SOP_${item.filename}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  return (
    <div style={{ padding: '2rem 3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="text-gradient"><Archive style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} /> My DNA Vault</h2>
        <p className="text-muted">A secure history of all your synthesized DNA payloads across our global data centers.</p>
      </div>

      <div className="glass-panel">
        {loading ? (
          <p className="text-muted text-center">Loading enterprise vault data...</p>
        ) : history.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem' }}>
            <Archive size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3>Your Enterprise Vault is Empty</h3>
            <p className="text-muted">Encode some files to provision them in physical cold storage.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Filename</th>
                <th style={{ padding: '1rem' }}>Physical Location</th>
                <th style={{ padding: '1rem' }}>DNA Length (bp)</th>
                <th style={{ padding: '1rem' }}>Features</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const rack = Math.floor((item.id * 7) % 50) + 1;
                const box = (item.id % 10) + 1;
                return (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.filename}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }}/> 
                    Rack {rack}, Box {box}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--accent-cyan)' }}>{item.dna_length_bp}</td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    {item.is_encrypted && <Lock size={16} color="var(--accent-purple)" title="Encrypted" />}
                    {item.has_error_correction && <Shield size={16} color="var(--accent-cyan)" title="Error Correction" />}
                    {item.has_steganography && <Dna size={16} color="var(--text-primary)" title="Steganography" />}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      type="button" 
                      className="btn" 
                      style={{ padding: '0.5rem', background: 'var(--accent-gold)', color: '#000', fontSize: '0.8rem' }}
                      onClick={() => downloadProtocol(item)}
                    >
                      <FileText size={14} style={{ marginRight: '4px' }}/> SOP
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Vault;
