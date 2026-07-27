import { useState } from 'react';
import { Cpu, Search, Dna, Activity, FileText, CheckCircle, AlertCircle, Filter, Sparkles, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import SpotlightCard from '../components/SpotlightCard';
import { getSafeApiErrorMessage } from '../utils/errorMessages';

export default function BioCompute() {
  const [query, setQuery] = useState('GATTACA');
  const [mode, setMode] = useState('motif'); // 'motif' or 'keyword'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const sampleMotifs = ['GATTACA', 'ATG', 'CCCGATTACAAA', 'CGCG'];
  const sampleKeywords = ['confidential', 'report', 'contract', 'data'];
  const sampleVectors = ['secure backup', 'confidential report', 'image file', 'high gc content'];

  const handleSearch = async (val, searchMode = mode) => {
    const searchVal = typeof val === 'string' ? val : query;
    if (!searchVal || !searchVal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/compute/search`, {
        query: searchVal,
        mode: searchMode
      }, {
        withCredentials: true,
        timeout: 15000
      });
      setResults(res.data.data);
    } catch (err) {
      setError(getSafeApiErrorMessage(err, 'Failed to execute biological computation search.'));
    } finally {
      setLoading(false);
    }
  };

  const onChipClick = (val) => {
    setQuery(val);
    handleSearch(val, mode);
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <div className="flex-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--gradient-gold)', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
            <Cpu size={28} color="#000" />
          </div>
          <span style={{ color: 'var(--gold-primary)', fontWeight: '600', letterSpacing: '0.15em', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            In-Memory Genetic Execution
          </span>
        </div>
        <h1 style={{ fontSize: '2.8rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(135deg, #fff 0%, #a5a5a5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Live Biological Computing Engine
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
          Search, filter, and execute pattern recognition directly across compressed DNA nucleotide archives ($A, C, G, T$) in memory without decoding them back to binary.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-dark)', borderRadius: '16px', padding: '0.4rem', display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => { setMode('motif'); setQuery('GATTACA'); }}
            style={{
              background: mode === 'motif' ? 'var(--gradient-gold)' : 'transparent',
              color: mode === 'motif' ? '#000' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.75rem 1.75rem',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
          >
            <Dna size={18} /> Motif & Regex Search ($A,C,G,T$)
          </button>
          <button
            type="button"
            onClick={() => { setMode('keyword'); setQuery('confidential'); }}
            style={{
              background: mode === 'keyword' ? 'var(--gradient-gold)' : 'transparent',
              color: mode === 'keyword' ? '#000' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.75rem 1.75rem',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
          >
            <Search size={18} /> In-DNA Keyword Mapping
          </button>
          <button
            type="button"
            onClick={() => { setMode('vector'); setQuery('secure backup'); }}
            style={{
              background: mode === 'vector' ? 'var(--gradient-gold)' : 'transparent',
              color: mode === 'vector' ? '#000' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.75rem 1.75rem',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
          >
            <Sparkles size={18} /> Neural Vector RAG (64-D ML)
          </button>
        </div>
      </div>

      {/* Search Console Input */}
      <SpotlightCard className="glass-panel" style={{ padding: '2.5rem', marginBottom: '3rem', borderRadius: '24px', border: '1px solid rgba(255,215,0,0.15)' }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '280px', position: 'relative' }}>
            <Search size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'motif' ? 'Enter sequence motif (e.g. GATTACA, ATG, A{2,}[CG]+)' : 'Enter text keyword to translate & search in genetic space...'}
              style={{
                width: '100%',
                padding: '1.25rem 1.25rem 1.25rem 3.5rem',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--border-dark)',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '1.05rem',
                fontFamily: mode === 'motif' ? 'monospace' : 'inherit',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-gold"
            style={{ padding: '0 2.5rem', height: 'auto', borderRadius: '14px', fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            {loading ? (
              <>
                <div className="spinner-sm" style={{ borderTopColor: '#000', borderRightColor: '#000' }} />
                SCANNING DNA...
              </>
            ) : (
              <>
                <Sparkles size={18} /> EXECUTE COMPUTE
              </>
            )}
          </button>
        </form>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Quick Test:</span>
          {(mode === 'motif' ? sampleMotifs : mode === 'keyword' ? sampleKeywords : sampleVectors).map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChipClick(chip)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--gold-primary)',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontFamily: mode === 'motif' ? 'monospace' : 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      </SpotlightCard>

      {/* Error Display */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1.25rem', borderRadius: '16px', color: '#f87171', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Search Results Section */}
      {results && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          {/* Summary Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dark)', padding: '1.25rem 2rem', borderRadius: '16px', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Query Mode: </span>
              <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{results.mode}</strong>
              <span style={{ margin: '0 0.75rem', color: 'var(--border-dark)' }}>|</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Genetic Signature: </span>
              <code style={{ color: 'var(--gold-primary)', background: 'rgba(255,215,0,0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>{results.pattern_searched}</code>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Archives Scanned: </span>
                <strong style={{ color: '#fff' }}>{results.files_searched}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Hits: </span>
                <strong style={{ color: 'var(--gold-primary)', fontSize: '1.1rem' }}>{results.total_matches}</strong>
              </div>
            </div>
          </div>

          {/* Matches List */}
          {results.results.length === 0 ? (
            <SpotlightCard className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: '24px' }}>
              <Dna size={48} color="var(--text-secondary)" style={{ opacity: 0.4, marginBottom: '1.5rem', margin: '0 auto' }} />
              <h3 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '0.5rem' }}>No Biological Sequence Matches Found</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                We scanned your active DNA archives but could not locate the sequence signature <code>{results.pattern_searched}</code>. Try uploading a new file in the Vault or searching for common codons like <code>GATTACA</code> or <code>ATG</code>.
              </p>
            </SpotlightCard>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {results.results.map((fileRes) => (
                <SpotlightCard key={fileRes.file_id} className="glass-panel" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileText size={22} color="var(--gold-primary)" />
                      <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem' }}>{fileRes.filename}</h3>
                      <span style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                        ID #{fileRes.file_id}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Length: <strong style={{ color: '#fff' }}>{fileRes.dna_length_bp} bp</strong>
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Overall GC: <strong style={{ color: '#fff' }}>{fileRes.overall_gc_content}%</strong>
                      </span>
                      <span style={{ background: 'rgba(255,215,0,0.15)', color: 'var(--gold-primary)', fontWeight: '700', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                        {fileRes.match_count} {fileRes.match_count === 1 ? 'Hit' : 'Hits'}
                      </span>
                    </div>
                  </div>

                  {/* Snippets Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {fileRes.matches.map((hit, idx) => (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span>Coordinates: <strong style={{ color: '#fff' }}>{hit.start_bp}bp - {hit.end_bp}bp</strong></span>
                          <span>Local GC: <strong style={{ color: hit.window_gc_content >= 40 && hit.window_gc_content <= 60 ? '#10b981' : '#f59e0b' }}>{hit.window_gc_content}%</strong></span>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#a5b4fc', wordBreak: 'break-all', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid var(--gold-primary)' }}>
                          {hit.snippet.split(hit.sequence).map((part, i, arr) => (
                            <span key={i}>
                              {part}
                              {i < arr.length - 1 && (
                                <strong style={{ background: 'var(--gold-primary)', color: '#000', padding: '0 0.25rem', borderRadius: '3px' }}>
                                  {hit.sequence}
                                </strong>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </SpotlightCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
