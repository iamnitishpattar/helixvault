import { useState, useEffect } from 'react';
import { Disc, Dna, Download, Copy, CheckCircle, AlertCircle, Sparkles, Archive, FileText, ArrowRight, Layers, Shield } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import SpotlightCard from '../components/SpotlightCard';
import { getSafeApiErrorMessage, logClientRequestFailure } from '../utils/errorMessages';

// Helper to draw SVG arcs for circular plasmid features
function describeArc(x, y, radius, startAngle, endAngle) {
  const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians)
    };
  };

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

export default function PlasmidWorkbench() {
  const [vectors, setVectors] = useState([]);
  const [selectedVector, setSelectedVector] = useState('pUC19');
  const [sourceType, setSourceType] = useState('vault'); // 'vault' or 'custom'
  const [vaultFiles, setVaultFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [customSequence, setCustomSequence] = useState('GAATTCGATTACAAGCTTGTCGACGGATCC');
  const [payloadName, setPayloadName] = useState('My_Synthetic_Payload');
  
  const [loading, setLoading] = useState(false);
  const [clonedData, setClonedData] = useState(null);
  const [error, setError] = useState(null);
  const [activeFeature, setActiveFeature] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showRawSeq, setShowRawSeq] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Fetch available vectors and user vault history on load
  useEffect(() => {
    let ignore = false;
    const initData = async () => {
      try {
        const vecRes = await axios.get(`${API_BASE_URL}/api/plasmid/vectors`, { withCredentials: true });
        if (!ignore && vecRes.data?.vectors) {
          setVectors(vecRes.data.vectors);
        }
      } catch (err) {
        if (!ignore) logClientRequestFailure('Failed to fetch plasmid vectors', err);
      }

      try {
        const histRes = await axios.get(`${API_BASE_URL}/api/dna/history`, { withCredentials: true });
        if (!ignore && Array.isArray(histRes.data)) {
          setVaultFiles(histRes.data);
          if (histRes.data.length > 0) {
            setSelectedFileId(histRes.data[0].id);
            setPayloadName(histRes.data[0].filename);
          }
        }
      } catch (err) {
        if (!ignore) logClientRequestFailure('Failed to fetch vault history', err);
      }
    };
    initData();
    return () => { ignore = true; };
  }, []);

  // Perform initial cloning when loaded
  useEffect(() => {
    if (!clonedData && !loading) {
      handleClone();
    }
  }, [selectedVector]);

  const handleClone = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        vector_name: selectedVector,
        payload_name: sourceType === 'vault' && selectedFileId
          ? vaultFiles.find(f => String(f.id) === String(selectedFileId))?.filename || 'Archived_Payload'
          : payloadName || 'Custom_Oligo',
      };

      if (sourceType === 'vault' && selectedFileId) {
        payload.file_id = parseInt(selectedFileId, 10);
      } else {
        payload.dna_sequence = customSequence;
      }

      const res = await axios.post(`${API_BASE_URL}/api/plasmid/clone`, payload, {
        withCredentials: true,
        timeout: 15000
      });
      setClonedData(res.data);
      if (res.data?.features?.length > 1) {
        setActiveFeature(res.data.features[1]); // Default select the subclone payload
      }
    } catch (err) {
      setError(getSafeApiErrorMessage(err, 'Failed to clone payload into plasmid vector.'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportSnapGene = async () => {
    if (!clonedData) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/api/plasmid/export`, {
        cloned_data: clonedData,
        locus_name: `pHV_${clonedData.payload_name || 'CLONE'}`.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16),
        description: `HelixVault Synthetic Biology Circular Clone (${clonedData.vector_name})`
      }, {
        withCredentials: true,
        responseType: 'text'
      });

      const blob = new Blob([res.data], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${clonedData.vector_name}_${clonedData.payload_name || 'clone'}.gb`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getSafeApiErrorMessage(err, 'Failed to export GenBank file.'));
    }
  };

  const copySequence = () => {
    if (!clonedData?.circular_sequence) return;
    navigator.clipboard.writeText(clonedData.circular_sequence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="flex-center" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: 'var(--gradient-gold)', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
            <Disc size={28} color="#000" />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', margin: 0 }}>
            Synthetic Biology Plasmid Workbench
          </h1>
        </div>
        <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '750px', margin: '0 auto' }}>
          Visual Genetic Engineering Engine. Clone your encoded digital data payloads into circular bacterial cloning vectors (pUC19, pBR322) and export industry-standard annotated GenBank (<code>.gb</code>) files compatible with <strong>SnapGene</strong>, <strong>Benchling</strong>, and NCBI.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger flex-center" style={{ marginBottom: '2rem', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.75rem', alignItems: 'stretch' }}>
        {/* Left Column: Unified Cloning & Synthesis Deck */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SpotlightCard style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', height: '100%', gap: '1.5rem' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                <Layers size={18} /> Cloning Pipeline
              </h3>
            </div>

            {/* Step 1: Carrier Vector */}
            <div>
              <label className="text-muted" style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', fontWeight: 600 }}>
                1. Select Carrier Vector
              </label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {['pUC19', 'pBR322'].map(vName => {
                  const isSelected = selectedVector === vName;
                  const vMeta = vectors.find(v => v.name === vName) || {
                    description: vName === 'pUC19' ? 'High-copy Ampicillin cloning vector.' : 'Medium-copy dual Amp/Tet vector.',
                    antibiotic: vName === 'pUC19' ? 'Ampicillin' : 'Ampicillin & Tetracycline',
                    default_length: vName === 'pUC19' ? 2686 : 4361
                  };
                  return (
                    <div
                      key={vName}
                      onClick={() => setSelectedVector(vName)}
                      style={{
                        flex: 1,
                        padding: '0.85rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)',
                        background: isSelected ? 'rgba(234, 179, 8, 0.12)' : 'rgba(255,255,255,0.02)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <strong style={{ fontSize: '1.05rem', color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)' }}>{vName}</strong>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                            {vMeta.default_length} bp
                          </span>
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>
                          {vMeta.description}
                        </p>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                        <Shield size={12} /> {vMeta.antibiotic}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Payload Source */}
            <div>
              <label className="text-muted" style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem', fontWeight: 600 }}>
                2. Configure DNA Payload
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.4)', padding: '0.3rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  className={`btn ${sourceType === 'vault' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem' }}
                  onClick={() => setSourceType('vault')}
                >
                  <Archive size={15} style={{ marginRight: '0.3rem' }} /> HelixVault
                </button>
                <button
                  type="button"
                  className={`btn ${sourceType === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem' }}
                  onClick={() => setSourceType('custom')}
                >
                  <FileText size={15} style={{ marginRight: '0.3rem' }} /> Custom Oligo
                </button>
              </div>

              {sourceType === 'vault' ? (
                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                    Select Archived Payload:
                  </label>
                  {vaultFiles.length === 0 ? (
                    <p className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                      No archived files found in vault. Switch to Custom Oligo or use default test sequence.
                    </p>
                  ) : (
                    <select
                      className="form-control"
                      value={selectedFileId}
                      onChange={(e) => {
                        setSelectedFileId(e.target.value);
                        const f = vaultFiles.find(item => String(item.id) === String(e.target.value));
                        if (f) setPayloadName(f.filename);
                      }}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem' }}
                    >
                      {vaultFiles.map(f => (
                        <option key={f.id} value={f.id} style={{ background: '#111', color: '#fff' }}>
                          {f.filename} ({f.original_size_bytes} B • {f.dna_length_bp} bp)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                      Feature Label:
                    </label>
                    <input
                      type="text"
                      value={payloadName}
                      onChange={(e) => setPayloadName(e.target.value)}
                      className="form-control"
                      placeholder="e.g., Synthetic_Data_Payload"
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                      DNA Oligotide Sequence (5' → 3'):
                    </label>
                    <textarea
                      rows={3}
                      value={customSequence}
                      onChange={(e) => setCustomSequence(e.target.value.toUpperCase())}
                      className="form-control font-mono"
                      placeholder="GAATTC..."
                      style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.82rem', resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Execute Action */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                type="button"
                onClick={handleClone}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: 'var(--gradient-gold)', color: '#000', border: 'none', borderRadius: '8px', boxShadow: '0 4px 15px rgba(234, 179, 8, 0.25)', cursor: 'pointer' }}
              >
                {loading ? (
                  <>Cloning into MCS...</>
                ) : (
                  <>
                    <Sparkles size={18} /> Clone into {selectedVector} Vector
                  </>
                )}
              </button>
            </div>
          </SpotlightCard>
        </div>

        {/* Right Column: Systematic Construct Workspace */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SpotlightCard style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '1.75rem' }}>
            {!clonedData ? (
              <div className="flex-center" style={{ height: '550px', flexDirection: 'column', opacity: 0.5 }}>
                <Disc size={64} className="spin-slow" style={{ marginBottom: '1rem' }} />
                <h4>No Construct Synthesized Yet</h4>
                <p style={{ textAlign: 'center', maxWidth: '400px' }}>Select a carrier vector and configure your payload on the left to generate the circular map and annotations.</p>
              </div>
            ) : (
              <>
                {/* Tier 1: Construct Header & Export Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ color: 'var(--primary-color)' }}>{clonedData.vector_name}</span> 
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.2rem' }}>::</span> 
                      <span>{clonedData.payload_name}</span>
                    </h2>
                    <span className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span style={{ color: '#22c55e' }}>● Circular Construct</span> • <strong>{clonedData.total_length_bp.toLocaleString()} bp</strong> • <strong>{clonedData.gc_content_pct}% GC</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      onClick={copySequence}
                      className="btn btn-outline"
                      style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}
                      title="Copy raw circular sequence"
                    >
                      {copied ? <CheckCircle size={15} color="#22c55e" /> : <Copy size={15} />}
                      {copied ? 'Copied!' : 'Copy Seq'}
                    </button>
                    <button
                      onClick={handleExportSnapGene}
                      className="btn btn-primary"
                      style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#06B6D4', color: '#000', fontWeight: 600, border: 'none', borderRadius: '8px', boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)' }}
                    >
                      <Download size={15} /> Export SnapGene (.gb)
                    </button>
                  </div>
                </div>

                {/* Tier 2: Interactive Visualization & Parameters Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'stretch' }}>
                  {/* Left Box: SVG Viewport Canvas */}
                  <div style={{ background: 'radial-gradient(circle at center, rgba(234, 179, 8, 0.04) 0%, rgba(0,0,0,0.4) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', minHeight: '340px' }}>
                    {hoveredFeature && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#0a0a0a',
                        border: `1px solid ${hoveredFeature.color || '#fff'}`,
                        color: '#fff',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        boxShadow: `0 4px 20px rgba(0,0,0,0.8), 0 0 10px ${hoveredFeature.color || 'rgba(255,255,255,0.2)'}`,
                        zIndex: 50,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease'
                      }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: hoveredFeature.color || '#fff', display: 'inline-block' }}></span>
                        <span>[{hoveredFeature.name}: {hoveredFeature.description} - {(hoveredFeature.end - hoveredFeature.start + 1).toLocaleString()} bp]</span>
                      </div>
                    )}
                    <svg width="280" height="280" viewBox="0 0 400 400" style={{ filter: 'drop-shadow(0 0 15px rgba(234, 179, 8, 0.15))' }}>
                      <circle cx="200" cy="200" r="140" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="18" />

                      {clonedData.features.map((feat, idx) => {
                        const total = clonedData.total_length_bp;
                        const startDeg = (feat.start / total) * 360;
                        const endDeg = (feat.end / total) * 360;
                        const isHovered = (hoveredFeature || activeFeature)?.name === feat.name;

                        return (
                          <path
                            key={idx}
                            d={describeArc(200, 200, 140, startDeg, endDeg)}
                            fill="none"
                            stroke={feat.color || '#CCCCCC'}
                            strokeWidth={isHovered ? "24" : "18"}
                            strokeLinecap="round"
                            style={{
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              opacity: (activeFeature || hoveredFeature) && !isHovered ? 0.45 : 1,
                              filter: isHovered ? `drop-shadow(0 0 10px ${feat.color})` : 'none'
                            }}
                            onClick={() => setActiveFeature(feat)}
                            onMouseEnter={() => { setActiveFeature(feat); setHoveredFeature(feat); }}
                            onMouseLeave={() => setHoveredFeature(null)}
                          >
                            <title>[{feat.name}: {feat.description} - {(feat.end - feat.start + 1).toLocaleString()} bp]</title>
                          </path>
                        );
                      })}

                      <text x="200" y="185" textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="bold">
                        {clonedData.vector_name}
                      </text>
                      <text x="200" y="210" textAnchor="middle" fill="var(--primary-color)" fontSize="16" fontWeight="600">
                        {clonedData.total_length_bp} bp
                      </text>
                      <text x="200" y="230" textAnchor="middle" fill="var(--text-secondary)" fontSize="13">
                        {clonedData.gc_content_pct}% GC Content
                      </text>
                    </svg>
                  </div>

                  {/* Right Box: Specification Ledger */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary-color)', fontWeight: 700 }}>
                          {activeFeature ? 'Selected Biological Feature' : 'Construct Specification Ledger'}
                        </span>
                        {activeFeature && (
                          <button
                            type="button"
                            onClick={() => setActiveFeature(null)}
                            style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Reset View
                          </button>
                        )}
                      </div>

                      {activeFeature ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: activeFeature.color || '#ccc', boxShadow: `0 0 10px ${activeFeature.color}` }} />
                            <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>{activeFeature.name}</h4>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', gap: '0.1rem', marginBottom: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <span className="text-muted">Feature Type</span>
                              <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{activeFeature.type}</code>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <span className="text-muted">Strand Orientation</span>
                              <strong>{activeFeature.strand === 1 ? '+ (Direct 5\'→3\')' : '- (Reverse 3\'→5\')'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <span className="text-muted">Start Coordinate</span>
                              <strong>{activeFeature.start.toLocaleString()} bp</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <span className="text-muted">End Coordinate</span>
                              <strong>{activeFeature.end.toLocaleString()} bp</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                              <span className="text-muted">Segment Length</span>
                              <strong style={{ color: activeFeature.color || 'var(--primary-color)' }}>{(activeFeature.end - activeFeature.start + 1).toLocaleString()} bp</strong>
                            </div>
                          </div>
                          <p className="text-muted" style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.4, background: 'rgba(0,0,0,0.4)', padding: '0.65rem 0.8rem', borderRadius: '6px', borderLeft: `3px solid ${activeFeature.color || '#ccc'}` }}>
                            {activeFeature.description}
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', gap: '0.1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="text-muted">Host Organism</span>
                            <strong style={{ color: '#fff' }}>E. coli K-12 (DH5α / BL21)</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="text-muted">Construct Type</span>
                            <strong style={{ color: '#fff' }}>Circular Bacterial Cloning Vector</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="text-muted">Total Length</span>
                            <strong style={{ color: 'var(--primary-color)' }}>{clonedData.total_length_bp.toLocaleString()} bp</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="text-muted">GC Content Ratio</span>
                            <strong style={{ color: '#fff' }}>{clonedData.gc_content_pct}%</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="text-muted">Selection Marker</span>
                            <strong style={{ color: '#EF4444' }}>{clonedData.vector_name === 'pUC19' ? 'Ampicillin (100 µg/mL)' : 'Amp / Tet (50 µg/mL)'}</strong>
                          </div>
                          <p className="text-muted" style={{ fontStyle: 'italic', marginTop: '1rem', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '6px' }}>
                            ✨ Hover or click on any colored arc on the circular ring to inspect specific feature coordinates.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tier 3: Annotated Features Table & Restriction Enzymes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.6rem 0', fontSize: '0.95rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Annotated Biological Features & Markers
                    </h4>
                    <div style={{ maxHeight: '230px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', background: 'rgba(0,0,0,0.3)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.06)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.12)', position: 'sticky', top: 0, zIndex: 10 }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Feature Name</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Coordinates</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clonedData.features.map((f, i) => {
                            const isSelected = activeFeature?.name === f.name;
                            return (
                              <tr
                                key={i}
                                onClick={() => setActiveFeature(f)}
                                style={{
                                  cursor: 'pointer',
                                  background: isSelected ? 'rgba(234, 179, 8, 0.18)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <td style={{ padding: '0.7rem 1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', color: isSelected ? 'var(--primary-color)' : '#fff' }}>
                                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: f.color, flexShrink: 0 }} />
                                  <span>{f.name}</span>
                                </td>
                                <td style={{ padding: '0.7rem 1rem' }}><code style={{ background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{f.type}</code></td>
                                <td style={{ padding: '0.7rem 1rem', whiteSpace: 'nowrap' }}>{f.start.toLocaleString()} - {f.end.toLocaleString()} bp</td>
                                <td style={{ padding: '0.7rem 1rem', color: 'var(--text-secondary)' }}>{f.description}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Restriction Cut Sites Sleek Footer Bar */}
                  <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <span className="text-muted" style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1rem' }}>✂️</span> <strong>Detected Restriction Sites:</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {Object.entries(clonedData.restriction_sites || {}).map(([rName, rData]) => (
                        <span key={rName} style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '20px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', color: '#D8B4FE', fontWeight: 600 }}>
                          {rName} ({rData.motif}) • {rData.count} cut{rData.count > 1 ? 's' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
