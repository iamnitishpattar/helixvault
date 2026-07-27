import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ArrowRight, Dna } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { logClientRequestFailure } from '../utils/errorMessages';
import { useCarrier } from '../context/CarrierContext';

const sequenceStyle = {
  background: 'rgba(0,0,0,0.3)', 
  padding: '1rem', 
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'monospace',
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  wordBreak: 'break-all',
  maxHeight: '200px',
  overflowY: 'auto'
};

const resultItemStyle = {
  background: 'rgba(255,255,255,0.02)', 
  border: '1px solid var(--glass-border)',
  padding: '1rem', 
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  transition: 'var(--transition-fast)'
};


const ncbiOptions = ['plasmid', 'pUC19', 'GFP', 'T7 promoter', 'Cas9'];
const BIO_DATABASE_ERROR = 'Unable to complete the biological database request. Please try again later.';

function BioDatabase() {
  const [ncbiQuery, setNcbiQuery] = useState('plasmid');
  const [ncbiResults, setNcbiResults] = useState([]);
  const [loadingNcbi, setLoadingNcbi] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [previewSplicing, setPreviewSplicing] = useState(false);

  const [ncbiDropdownOpen, setNcbiDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { selectCarrier } = useCarrier();

  const handleSelectCarrier = () => {
    if (!selectedSequence) return;
    const accessionId = selectedSequence.accession || selectedSequence.id;
    selectCarrier(accessionId, selectedSequence.sequence);
    navigate('/encode', { state: { selectedCarrier: accessionId } });
  };

  const searchNcbi = async () => {
    if (!ncbiQuery) return;
    setLoadingNcbi(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bio/ncbi/search?query=${ncbiQuery}`);
      setNcbiResults(res.data.results);
      setSelectedSequence(null);
    } catch (err) {
      logClientRequestFailure('NCBI search failed', err);
      alert(BIO_DATABASE_ERROR);
    } finally {
      setLoadingNcbi(false);
    }
  };

  const fetchNcbiSequence = async (id) => {
    setLoadingNcbi(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bio/ncbi/fetch/${id}`);
      setSelectedSequence(res.data);
    } catch (err) {
      logClientRequestFailure('NCBI sequence fetch failed', err);
      alert(BIO_DATABASE_ERROR);
    } finally {
      setLoadingNcbi(false);
    }
  };


  return (
    <div className="container">
      <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Biological Context Integration</h2>
        <p className="text-muted" style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.8' }}>
          Explore natural DNA sequences to use as potential "carriers" for your synthesized data, 
          and investigate genome annotations to ensure biological safety.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* NCBI Section */}
        <div className="showcase-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              NCBI Entrez Database
            </h3>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="input-minimal" 
                  placeholder="Search terms (e.g. pUC19, GFP)"
                  value={ncbiQuery}
                  onChange={(e) => setNcbiQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchNcbi()}
                  onClick={() => setNcbiDropdownOpen(!ncbiDropdownOpen)}
                  onBlur={() => setTimeout(() => setNcbiDropdownOpen(false), 200)}
                  aria-label="Search NCBI Database"
                  style={{ width: '100%', paddingRight: '2.5rem', cursor: 'pointer' }}
                />
                <ChevronDown size={18} color="#888" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              
              {ncbiDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem', zIndex: 1000, boxShadow: '0 15px 35px rgba(0,0,0,0.8)', maxHeight: '240px', overflowY: 'auto' }}>
                  {ncbiOptions.map(option => (
                    <button 
                      key={option}
                      type="button"
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', textAlign: 'left', font: 'inherit' }}
                      onMouseDown={() => {
                        setNcbiQuery(option);
                        setNcbiDropdownOpen(false);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      onFocus={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onBlur={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" aria-label="Search NCBI" className="btn btn-solid-black" onClick={searchNcbi} disabled={loadingNcbi} style={{ padding: '0 1rem' }}>
              <Search size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {loadingNcbi && <p className="text-muted">Loading...</p>}
            
            {!loadingNcbi && selectedSequence ? (() => {
              const seq = selectedSequence.sequence.toUpperCase();
              const gcCount = (seq.match(/[GC]/g) || []).length;
              const gcRatio = seq.length > 0 ? ((gcCount / seq.length) * 100).toFixed(1) : '0.0';

              let maxLen = 0;
              let maxChar = '';
              let currentLen = 0;
              let currentChar = '';
              for (let i = 0; i < seq.length; i++) {
                if (seq[i] === currentChar) {
                  currentLen++;
                } else {
                  currentChar = seq[i];
                  currentLen = 1;
                }
                if (currentLen > maxLen) {
                  maxLen = currentLen;
                  maxChar = currentChar;
                }
              }
              const isSafe = maxLen <= 5;
              const payloadCapacity = Math.max(1, Math.floor(seq.length * 0.25));

              // Splicing highlights (e.g. flanking pos 142 or adapted for shorter seq)
              const splicePos = Math.min(142, Math.max(0, Math.floor(seq.length * 0.2)));
              const spliceLen = Math.min(100, Math.max(20, Math.floor(seq.length * 0.3)));

              return (
                <div>
                  {/* 3. Action Button next to Back button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button type="button" className="btn" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)' }} onClick={() => setSelectedSequence(null)}>
                      &larr; Back to Results
                    </button>

                    <button 
                      type="button" 
                      className="btn" 
                      onClick={handleSelectCarrier}
                      style={{ 
                        background: '#ffffff', 
                        color: '#000000', 
                        border: 'none', 
                        padding: '0.55rem 1.25rem', 
                        fontSize: '0.88rem', 
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 0 20px rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Dna size={16} /> Select Carrier for Storage Pipeline &rarr;
                    </button>
                  </div>

                  {/* Header & 1. Preview Toggle */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.4rem' }}>{selectedSequence.id}</h4>
                      <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>{selectedSequence.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewSplicing(!previewSplicing)}
                      style={{
                        background: previewSplicing ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: previewSplicing ? '1px solid var(--accent-green)' : '1px solid rgba(255,255,255,0.15)',
                        color: previewSplicing ? 'var(--accent-green)' : 'var(--text-secondary)',
                        padding: '0.45rem 0.95rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        boxShadow: previewSplicing ? '0 0 15px rgba(0,255,102,0.2)' : 'none'
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: previewSplicing ? 'var(--accent-green)' : '#666', display: 'inline-block', boxShadow: previewSplicing ? '0 0 8px var(--accent-green)' : 'none' }}></span>
                      {previewSplicing ? '✨ Preview Data Splicing (Active)' : 'Preview Data Splicing'}
                    </button>
                  </div>

                  {/* 2. Live DNA Character Metrics Bar */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div style={{ background: 'rgba(0, 204, 255, 0.08)', border: '1px solid rgba(0, 204, 255, 0.25)', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>GC Content:</span>
                      <strong>{gcRatio}%</strong>
                    </div>
                    <div style={{ background: isSafe ? 'rgba(0, 255, 102, 0.08)' : 'rgba(255, 80, 80, 0.08)', border: isSafe ? '1px solid rgba(0, 255, 102, 0.25)' : '1px solid rgba(255, 80, 80, 0.25)', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      <span style={{ color: isSafe ? 'var(--accent-green)' : '#ff6b6b', fontWeight: 600 }}>Max Homopolymer:</span>
                      <strong>{maxLen}x {maxChar}</strong>
                      <span style={{ color: isSafe ? 'var(--accent-green)' : '#ff6b6b', fontSize: '0.75rem' }}>({isSafe ? 'Safe for Synthesis' : 'Warning'})</span>
                    </div>
                    <div style={{ background: 'rgba(178, 102, 255, 0.08)', border: '1px solid rgba(178, 102, 255, 0.25)', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>Max Steganographic Storage:</span>
                      <strong>{payloadCapacity.toLocaleString()} Bytes</strong>
                    </div>
                  </div>

                  {/* Sequence Display with 1. Dynamic Overlay Map */}
                  <div style={{ ...sequenceStyle, position: 'relative', minHeight: '120px', color: previewSplicing ? '#777777' : 'var(--text-secondary)' }}>
                    {!previewSplicing ? (
                      selectedSequence.sequence
                    ) : (
                      <div style={{ lineHeight: '1.8' }}>
                        <span>{selectedSequence.sequence.slice(0, splicePos)}</span>
                        
                        <span style={{ position: 'relative', display: 'inline-block', margin: '0 2px', verticalAlign: 'baseline' }}>
                          {/* Tooltip */}
                          <span style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            marginBottom: '6px',
                            background: '#0a1914',
                            border: '1px solid #00ff66',
                            color: '#00ff66',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontFamily: 'Inter, sans-serif',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 15px rgba(0,255,102,0.3)',
                            zIndex: 20,
                            fontWeight: 600,
                            letterSpacing: 'normal'
                          }}>
                            ⚡ [Encrypted Payload Block 1: invoice.pdf inserted via silent substitution flanking position 142]
                          </span>
                          <strong style={{
                            color: '#00ff66',
                            background: 'rgba(0, 255, 102, 0.18)',
                            borderBottom: '2px solid #00ff66',
                            padding: '1px 3px',
                            borderRadius: '3px',
                            textShadow: '0 0 10px rgba(0,255,102,0.6)',
                            fontWeight: 700
                          }}>
                            {selectedSequence.sequence.slice(splicePos, splicePos + spliceLen)}
                          </strong>
                        </span>

                        <span>{selectedSequence.sequence.slice(splicePos + spliceLen)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ncbiResults.map((result) => (
                  <button key={result.id} type="button" style={{ ...resultItemStyle, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', textAlign: 'left', font: 'inherit', color: 'inherit', width: '100%', display: 'flex' }} onClick={() => fetchNcbiSequence(result.id)}
                     onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                     onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                  >
                    <div style={{ flex: 1 }}>
                      <h5 style={{ color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>{result.accession}</h5>
                      <p className="text-muted" style={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{result.title}</p>
                    </div>
                    <ArrowRight size={16} color="var(--text-secondary)" />
                  </button>
                ))}
                {ncbiResults.length === 0 && !loadingNcbi && (
                  <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>No results. Try a search query.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BioDatabase;
