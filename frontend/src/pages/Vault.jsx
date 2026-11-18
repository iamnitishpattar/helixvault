import { useState, useEffect } from 'react';
import { Archive, Lock, Shield, Dna, MapPin, FileText, Download, Trash2, HardDrive, Calendar } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { logClientRequestFailure } from '../utils/errorMessages';
import HealthStatusModal, { HealthBadge } from '../components/HealthStatusModal';
import { useToast } from '../context/ToastContext';
import SkeletonLoader from '../components/SkeletonLoader';

const exportToCSV = (data) => {
  if (!data || data.length === 0) return;
  const headers = ['ID', 'Filename', 'Original Size (bytes)', 'DNA Length (bp)', 'Encrypted', 'Error Correction', 'Steganography', 'Created At'];
  const csvRows = [headers.join(',')];
  
  data.forEach(item => {
    const row = [
      item.id,
      `"${item.filename}"`,
      item.original_size_bytes,
      item.dna_length_bp,
      item.is_encrypted,
      item.has_error_correction,
      item.has_steganography,
      `"${item.created_at}"`
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'vault_history.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

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
Authorized by: HelixVault Automated Systems`;

  const blob = new Blob([protocolText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HV-SOP-${item.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const downloadSequence = async (item, format, toast, setDownloadingId) => {
  if (setDownloadingId) setDownloadingId(item.id);
  if (toast && toast.info) {
    toast.info('Generating File', `Preparing ${format.toUpperCase()} construct for ${item.filename}...`);
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/api/dna/download/${item.id}/${format}`, {
      withCredentials: true,
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    const ext = format === 'fasta' ? 'fasta' : 'gb';
    link.setAttribute('download', `${item.filename}.${ext}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    if (toast && toast.success) {
      toast.success('Download Complete', `${item.filename}.${ext} saved to downloads!`);
    }
  } catch (err) {
    logClientRequestFailure('Failed to download sequence', err);
    if (toast && toast.error) {
      toast.error('Download Failed', 'Failed to download sequence. Please try again.');
    }
  } finally {
    if (setDownloadingId) setDownloadingId(null);
  }
};

const formatBytes = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatBP = (bp) => {
  if (!bp) return '—';
  if (bp >= 1_000_000) return `${(bp / 1_000_000).toFixed(2)} Mbp`;
  if (bp >= 1_000) return `${(bp / 1_000).toFixed(1)} Kbp`;
  return `${bp} bp`;
};

function Vault() {
  const toast = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHealthItem, setSelectedHealthItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this payload from the vault?")) {
      return;
    }
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/dna/${id}`, { withCredentials: true });
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('File Deleted', 'Payload successfully removed from the vault.');
    } catch (err) {
      logClientRequestFailure('Failed to delete payload', err);
      toast.error('Delete Failed', 'Failed to delete payload. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/dna/history`, { 
          withCredentials: true 
        });
        if (!ignore) {
          setHistory(res.data);
        }
      } catch (err) {
        if (!ignore) logClientRequestFailure('Failed to fetch vault history', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchHistory();
    return () => { ignore = true; };
  }, []);

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="text-gradient">
            <Archive style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            My DNA Vault
          </h2>
          <p className="text-muted">A secure history of all your synthesized DNA payloads across our global data centers.</p>
        </div>
        <button 
          className="btn btn-outline-gold" 
          onClick={() => exportToCSV(history)}
          disabled={loading || history.length === 0}
          aria-label="Export vault history to CSV"
        >
          Export CSV
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            <SkeletonLoader height="44px" />
            <SkeletonLoader height="44px" />
            <SkeletonLoader height="44px" />
            <SkeletonLoader height="44px" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem' }}>
            <Archive size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3>Your Enterprise Vault is Empty</h3>
            <p className="text-muted">Encode some files to provision them in physical cold storage.</p>
            <div style={{ marginTop: '2rem', background: 'rgba(0, 255, 102, 0.05)', border: '1px solid rgba(0, 255, 102, 0.2)', padding: '1.5rem', borderRadius: '12px', display: 'inline-block', textAlign: 'left', maxWidth: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>✨ Demo Payload Diagnostics:</span>
                <HealthBadge
                  filename="demo_genome_sample.bin"
                  onClick={() => setSelectedHealthItem({ filename: "demo_genome_sample.bin" })}
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Click the badge above to test our human-readable DNA Health &amp; Decay status modal with Fountain code degradation diagnostics.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '820px' }}>
              <thead>
                <tr style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid var(--glass-border)',
                }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 600, width: '28%' }}>Filename</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 600, width: '16%' }}>Location</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 600, width: '13%' }}>DNA Length</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 600, width: '12%' }}>Features</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 600, width: '15%' }}>Health</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 600, width: '16%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => {
                  const rack = Math.floor((item.id * 7) % 50) + 1;
                  const box = (item.id % 10) + 1;
                  const shortName = item.filename.length > 30
                    ? item.filename.slice(0, 27) + '…'
                    : item.filename;
                  const createdDate = item.created_at
                    ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
                    : null;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Filename + size */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <div title={item.filename} style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
                          {item.filename}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <HardDrive size={11} />
                          {formatBytes(item.original_size_bytes)}
                          {createdDate && (
                            <>
                              <span style={{ opacity: 0.4 }}>·</span>
                              <Calendar size={11} />
                              {createdDate}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          <MapPin size={13} style={{ flexShrink: 0, color: 'var(--accent-cyan)', opacity: 0.8 }} />
                          Rack {rack}, Box {box}
                        </div>
                      </td>

                      {/* DNA Length */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}>
                          {formatBP(item.dna_length_bp)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.dna_length_bp?.toLocaleString()} bp
                        </div>
                      </td>

                      {/* Features */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {item.is_encrypted && (
                            <span title="AES-256 Encrypted" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', fontSize: '0.65rem', color: 'var(--accent-purple)', fontWeight: 600 }}>
                              <Lock size={10} /> ENC
                            </span>
                          )}
                          {item.has_error_correction && (
                            <span title="Reed-Solomon ECC" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,255,255,0.08)', border: '1px solid rgba(0,255,255,0.2)', fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                              <Shield size={10} /> ECC
                            </span>
                          )}
                          {item.has_steganography && (
                            <span title={item.carrier_accession ? `DNA Steganography Carrier: ${item.carrier_accession}` : "DNA Steganography Enabled"} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,255,204,0.08)', border: '1px solid rgba(0,255,204,0.25)', fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                              <Dna size={10} /> {item.carrier_accession ? `STG: ${item.carrier_accession}` : 'STG'}
                            </span>
                          )}
                          {!item.is_encrypted && !item.has_error_correction && !item.has_steganography && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Health */}
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <HealthBadge
                          filename={item.filename}
                          onClick={() => setSelectedHealthItem(item)}
                          size="small"
                        />
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => downloadProtocol(item)}
                            title="Download Standard Operating Procedure"
                            aria-label={`Download SOP for ${item.filename}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                              background: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold)',
                              fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.28)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,55,0.15)'}
                          >
                            <FileText size={12} /> SOP
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadSequence(item, 'genbank', toast, setDownloadingId)}
                            disabled={downloadingId === item.id}
                            title="Download GenBank sequence"
                            aria-label={`Download GenBank for ${item.filename}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '5px 10px', borderRadius: '6px', cursor: downloadingId === item.id ? 'wait' : 'pointer',
                              background: downloadingId === item.id ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255,255,255,0.06)',
                              color: downloadingId === item.id ? 'var(--accent-green, #00ff66)' : 'var(--text-secondary)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { if (downloadingId !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                            onMouseLeave={e => { if (downloadingId !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                          >
                            <Download size={12} /> {downloadingId === item.id ? 'Saving...' : '.GB'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={isDeleting}
                            title="Delete payload"
                            aria-label={`Delete ${item.filename}`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer',
                              background: 'rgba(255,59,48,0.08)', color: '#ff3b30',
                              border: '1px solid rgba(255,59,48,0.2)',
                              transition: 'background 0.15s', flexShrink: 0
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <HealthStatusModal
        isOpen={!!selectedHealthItem}
        onClose={() => setSelectedHealthItem(null)}
        fileItem={selectedHealthItem}
      />
    </div>
  );
}

export default Vault;
