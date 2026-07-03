import { useState } from 'react';
import { Search, Server, Dna, ArrowRight, ExternalLink, Activity, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

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

const ensemblBoxStyle = {
  background: 'rgba(157, 78, 221, 0.05)', 
  border: '1px solid rgba(157, 78, 221, 0.3)', 
  padding: '1.5rem', 
  borderRadius: 'var(--radius-md)'
};

function BioDatabase() {
  const [ncbiQuery, setNcbiQuery] = useState('plasmid');
  const [ncbiResults, setNcbiResults] = useState([]);
  const [loadingNcbi, setLoadingNcbi] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);

  const [ensemblQuery, setEnsemblQuery] = useState('BRCA1');
  const [ensemblResult, setEnsemblResult] = useState(null);
  const [loadingEnsembl, setLoadingEnsembl] = useState(false);

  const [ncbiDropdownOpen, setNcbiDropdownOpen] = useState(false);
  const ncbiOptions = ['plasmid', 'pUC19', 'GFP', 'T7 promoter', 'Cas9'];

  const [ensemblDropdownOpen, setEnsemblDropdownOpen] = useState(false);
  const ensemblOptions = ['BRCA1', 'TP53', 'EGFR', 'MYC', 'INS'];

  const searchNcbi = async () => {
    if (!ncbiQuery) return;
    setLoadingNcbi(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bio/ncbi/search?query=${ncbiQuery}`);
      setNcbiResults(res.data.results);
      setSelectedSequence(null);
    } catch (err) {
      alert("Error searching NCBI: " + err.message);
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
      alert("Error fetching sequence: " + err.message);
    } finally {
      setLoadingNcbi(false);
    }
  };

  const searchEnsembl = async () => {
    if (!ensemblQuery) return;
    setLoadingEnsembl(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bio/ensembl/gene/${ensemblQuery}`);
      setEnsemblResult(res.data.data);
    } catch {
      alert("Error searching Ensembl: Gene not found or API error.");
    } finally {
      setLoadingEnsembl(false);
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

      <div className="grid-cols-2">
        {/* NCBI Section */}
        <div className="showcase-card" style={{ display: 'flex', flexDirection: 'column' }}>
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
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-black)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem', zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  {ncbiOptions.map(option => (
                    <div 
                      key={option}
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      onMouseDown={() => {
                        setNcbiQuery(option);
                        setNcbiDropdownOpen(false);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="btn btn-solid-black" onClick={searchNcbi} disabled={loadingNcbi} style={{ padding: '0 1rem' }}>
              <Search size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {loadingNcbi && <p className="text-muted">Loading...</p>}
            
            {!loadingNcbi && selectedSequence ? (
              <div>
                <button type="button" className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', marginBottom: '1rem' }} onClick={() => setSelectedSequence(null)}>
                  &larr; Back to Results
                </button>
                <h4>{selectedSequence.id}</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{selectedSequence.description}</p>
                <div style={sequenceStyle}>
                  {selectedSequence.sequence}
                </div>
              </div>
            ) : (
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

        {/* Ensembl Section */}
        <div className="showcase-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              Ensembl Annotations
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="input-minimal" 
                  placeholder="Gene symbol (e.g. BRCA1)"
                  value={ensemblQuery}
                  onChange={(e) => setEnsemblQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchEnsembl()}
                  onClick={() => setEnsemblDropdownOpen(!ensemblDropdownOpen)}
                  onBlur={() => setTimeout(() => setEnsemblDropdownOpen(false), 200)}
                  aria-label="Search Ensembl Gene Symbol"
                  style={{ width: '100%', paddingRight: '2.5rem', cursor: 'pointer' }}
                />
                <ChevronDown size={18} color="#888" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              
              {ensemblDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-black)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem', zIndex: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                  {ensemblOptions.map(option => (
                    <div 
                      key={option}
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      onMouseDown={() => {
                        setEnsemblQuery(option);
                        setEnsemblDropdownOpen(false);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="btn btn-solid-black" onClick={searchEnsembl} disabled={loadingEnsembl} style={{ padding: '0 1rem' }}>
              <Search size={18} />
            </button>
          </div>

          <div style={{ flex: 1 }}>
            {loadingEnsembl && <p className="text-muted">Fetching gene data...</p>}
            
            {ensemblResult && !loadingEnsembl && (
              <div style={ensemblBoxStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ margin: 0, color: 'var(--accent-purple)' }}>{ensemblResult.display_name}</h2>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>{ensemblResult.id}</p>
                  </div>
                  <span className="badge" style={{ background: 'rgba(157, 78, 221, 0.2)', color: '#d8b4e2' }}>
                    {ensemblResult.biotype}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  {ensemblResult.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Species</p>
                    <strong>{ensemblResult.species}</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Assembly Name</p>
                    <strong>{ensemblResult.assembly_name}</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Strand</p>
                    <strong>{ensemblResult.strand === 1 ? 'Forward (+)' : 'Reverse (-)'}</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Length</p>
                    <strong>{(ensemblResult.end - ensemblResult.start).toLocaleString()} bp</strong>
                  </div>
                </div>

                <a href={`https://www.ensembl.org/Homo_sapiens/Gene/Summary?g=${ensemblResult.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button type="button" className="btn" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                    View in Ensembl <ExternalLink size={14} />
                  </button>
                </a>
              </div>
            )}

            {!ensemblResult && !loadingEnsembl && (
              <div className="flex-center" style={{ height: '200px', flexDirection: 'column', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <Dna size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Search for a gene symbol to view annotations and structural context.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BioDatabase;
