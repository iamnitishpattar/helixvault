import { useState } from 'react';
import { Search, Server, Dna, ArrowRight, ExternalLink, Activity } from 'lucide-react';
import axios from 'axios';

function BioDatabase() {
  const [ncbiQuery, setNcbiQuery] = useState('plasmid');
  const [ncbiResults, setNcbiResults] = useState([]);
  const [loadingNcbi, setLoadingNcbi] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);

  const [ensemblQuery, setEnsemblQuery] = useState('BRCA1');
  const [ensemblResult, setEnsemblResult] = useState(null);
  const [loadingEnsembl, setLoadingEnsembl] = useState(false);

  const searchNcbi = async () => {
    if (!ncbiQuery) return;
    setLoadingNcbi(true);
    try {
      const res = await axios.get(`\${import.meta.env.VITE_API_URL || 'https://helixvault.onrender.com'}/api/bio/ncbi/search?query=${ncbiQuery}`);
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
      const res = await axios.get(`\${import.meta.env.VITE_API_URL || 'https://helixvault.onrender.com'}/api/bio/ncbi/fetch/${id}`);
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
      const res = await axios.get(`\${import.meta.env.VITE_API_URL || 'https://helixvault.onrender.com'}/api/bio/ensembl/gene/${ensemblQuery}`);
      setEnsemblResult(res.data.data);
    } catch {
      alert("Error searching Ensembl: Gene not found or API error.");
    } finally {
      setLoadingEnsembl(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h2><span className="text-gradient">Biological</span> Context Integration</h2>
        <p className="text-muted" style={{ maxWidth: '700px', margin: '1rem auto' }}>
          Explore natural DNA sequences to use as potential "carriers" for your synthesized data, 
          and investigate genome annotations to ensure biological safety.
        </p>
      </div>

      <div className="grid-cols-2">
        {/* NCBI Section */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Server color="var(--accent-cyan)" size={28} />
            <h3 style={{ margin: 0 }}>NCBI Entrez Database</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              className="input-glass" 
              placeholder="Search terms (e.g. pUC19, GFP)"
              value={ncbiQuery}
              onChange={(e) => setNcbiQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchNcbi()}
            />
            <button className="btn btn-primary" onClick={searchNcbi} disabled={loadingNcbi}>
              <Search size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {loadingNcbi && <p className="text-muted">Loading...</p>}
            
            {!loadingNcbi && selectedSequence ? (
              <div>
                <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', marginBottom: '1rem' }} onClick={() => setSelectedSequence(null)}>
                  &larr; Back to Results
                </button>
                <h4>{selectedSequence.id}</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{selectedSequence.description}</p>
                <div style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '1rem', 
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  wordBreak: 'break-all',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {selectedSequence.sequence}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ncbiResults.map((result) => (
                  <div key={result.id} style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--glass-border)',
                    padding: '1rem', 
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }} onClick={() => fetchNcbiSequence(result.id)}
                     onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'}
                     onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                  >
                    <div>
                      <h5 style={{ color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>{result.accession}</h5>
                      <p className="text-muted" style={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{result.title}</p>
                    </div>
                    <ArrowRight size={16} color="var(--text-secondary)" />
                  </div>
                ))}
                {ncbiResults.length === 0 && !loadingNcbi && (
                  <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>No results. Try a search query.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ensembl Section */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Activity color="var(--accent-purple)" size={28} />
            <h3 style={{ margin: 0 }}>Ensembl Annotations</h3>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              className="input-glass" 
              placeholder="Gene symbol (e.g. BRCA1)"
              value={ensemblQuery}
              onChange={(e) => setEnsemblQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchEnsembl()}
            />
            <button className="btn" style={{ background: 'var(--accent-purple)', color: 'white', border: 'none' }} onClick={searchEnsembl} disabled={loadingEnsembl}>
              <Search size={18} />
            </button>
          </div>

          <div style={{ flex: 1 }}>
            {loadingEnsembl && <p className="text-muted">Fetching gene data...</p>}
            
            {ensemblResult && !loadingEnsembl && (
              <div style={{ background: 'rgba(157, 78, 221, 0.05)', border: '1px solid rgba(157, 78, 221, 0.3)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
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
                  <button className="btn" style={{ width: '100%', justifyContent: 'center' }}>
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
