import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UploadCloud, Download, File as FileIcon, ArrowRight, RefreshCw, Cpu, Settings, Shield, Lock, FileText, Dna, Zap, AlertTriangle, Database, Activity, Check } from 'lucide-react';
import { useCarrier } from '../context/CarrierContext';
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import VisualPipeline from './VisualPipeline';
import DnaVialPlaceholder from './DnaVialPlaceholder';
import { API_BASE_URL } from '../config';
import { calculateSHA256, formatWeight, downloadFile } from '../utils/fileUtils';
import { getSafeApiErrorMessage, getSafeServerMessage, logClientRequestFailure } from '../utils/errorMessages';

const handleKeyDown = (e, action) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
};

const SYNTHESIS_METHODS = {
  chemical: { name: 'Traditional Chemical', costPerBp: 0.10, speed: '10-50 bp/sec', toxicity: 'High', color: 'var(--accent-gold)' },
  enzymatic: { name: 'Enzymatic', costPerBp: 0.15, speed: '100 bp/sec', toxicity: 'Low', color: 'var(--accent-green)' },
  photo: { name: 'Photolithographic', costPerBp: 0.05, speed: '10,000 bp/sec (Array)', toxicity: 'High', color: 'var(--accent-purple)' }
};

// File validation constants (mirror backend)
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = [
  'application/pdf','image/png','image/jpeg','image/gif','image/webp','text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword',
  'video/mp4', 'video/webm', 'video/quicktime'
];

const PROGRESS_STAGES = [
  { label: 'Encrypting with AES-256...', icon: Lock },
  { label: 'Applying Reed-Solomon ECC...', icon: Shield },
  { label: 'Encoding to Base-3 DNA...', icon: Dna },
  { label: 'Embedding Steganography...', icon: Activity },
  { label: 'Saving to Vault...', icon: Database },
];

const ENCODE_ERROR_MESSAGE = 'Encoding failed. Please check the file and selected options, then try again.';

export default function EncoderView() {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);  // inline validation error
  const [apiError, setApiError] = useState(null);    // API error messages
  const [showPipelineDemo, setShowPipelineDemo] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressStage, setProgressStage] = useState(0);  // 0=idle, 1-5=stages
  const [result, setResult] = useState(null);
  const [originalFileHash, setOriginalFileHash] = useState(null);
  const fileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const stageIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
    };
  }, []);
  // Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [password, setPassword] = useState('');
  const [useErrorCorrection, setUseErrorCorrection] = useState(true);
  const [useFountain, setUseFountain] = useState(false);
  const [fountainOverhead, setFountainOverhead] = useState(1.5);
  const [useSteganography, setUseSteganography] = useState(false);
  const [synthesisMethod, setSynthesisMethod] = useState('enzymatic');

  const { selectedCarrier, clearCarrier } = useCarrier();
  const location = useLocation();
  const [carrierAccession, setCarrierAccession] = useState('');

  useEffect(() => {
    const carrierFromState = location.state?.selectedCarrier || selectedCarrier;
    if (carrierFromState) {
      setUseSteganography(true);
      setShowAdvanced(true);
      setCarrierAccession(carrierFromState);
    }
  }, [location.state, selectedCarrier]);


  const validateFile = useCallback((f) => {
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large: ${(f.size / (1024 * 1024)).toFixed(1)} MB. Maximum is ${MAX_SIZE_MB} MB.`;
    }
    if (!ALLOWED_TYPES.includes(f.type)) {
      return `Unsupported file type: "${f.type || 'unknown'}". Allowed: PDF, PNG, JPG, GIF, TXT, DOCX, MP4.`;
    }
    return null;
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const err = validateFile(f);
      setFileError(err);
      setFile(err ? null : f);
    }
  };

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      const err = validateFile(dropped);
      setFileError(err);
      setFile(err ? null : dropped);
    }
  }, [validateFile]);

  const handleEncode = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setApiError(null);
    setProgressStage(1);
    
    // Animate through stages while the backend processes
    let stageIdx = 1;
    stageIntervalRef.current = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, PROGRESS_STAGES.length);
      setProgressStage(stageIdx);
    }, 2200);

    try {
      const hash = await calculateSHA256(file);
      setOriginalFileHash(hash);
      
      const formData = new FormData();
      formData.append('file', file);
      if (password) formData.append('password', password);
      formData.append('use_error_correction', useErrorCorrection);
      formData.append('use_steganography', useSteganography);
      if (useSteganography && carrierAccession) {
        formData.append('steganography_carrier', carrierAccession);
      }
      formData.append('use_fountain', useFountain);
      formData.append('fountain_overhead', fountainOverhead);

      const res = await axios.post(`${API_BASE_URL}/api/dna/encode`, formData, { 
        withCredentials: true 
      });
      
      if (res.data.task_id) {
        // Polling loop for Enterprise Async Tasks
        pollingIntervalRef.current = setInterval(async () => {
          try {
            const statusRes = await axios.get(`${API_BASE_URL}/api/dna/status/${res.data.task_id}`, {
              withCredentials: true
            });
            if (statusRes.data.status === 'success') {
              clearInterval(pollingIntervalRef.current);
              clearInterval(stageIntervalRef.current);
              setProgressStage(0);
              setResult(statusRes.data);
              setLoading(false);
            } else if (statusRes.data.status === 'failed') {
              clearInterval(pollingIntervalRef.current);
              clearInterval(stageIntervalRef.current);
              setProgressStage(0);
              setApiError(getSafeServerMessage(statusRes.data.error, ENCODE_ERROR_MESSAGE));
              setLoading(false);
            }
          } catch (e) {
             logClientRequestFailure('Encoder status polling failed; retrying', e);
          }
        }, 1500);
      } else {
        clearInterval(stageIntervalRef.current);
        setProgressStage(0);
        setResult(res.data);
        setLoading(false);
      }
    } catch (err) {
      clearInterval(stageIntervalRef.current);
      setProgressStage(0);
      setApiError(getSafeApiErrorMessage(err, ENCODE_ERROR_MESSAGE));
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(0, 204, 255);
    doc.text("HelixVault DNA Synthesis Report", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    
    const methodDetails = SYNTHESIS_METHODS[synthesisMethod];

    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Original Filename', result.filename],
        ['DNA Sequence Length', `${result.metrics.length} bp`],
        ['GC Content', `${result.metrics.gc_content}%`],
        ['Synthesis Method', methodDetails.name],
        ['Est. Cost', `$${(result.metrics.length * methodDetails.costPerBp).toLocaleString()}`],
        ['Encrypted', password ? 'Yes' : 'No'],
        ['Error Correction (Reed-Solomon)', useErrorCorrection ? 'Yes' : 'No'],
        ['Steganography', useSteganography ? 'Yes' : 'No']
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 204, 255] }
    });

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const tableEnd = doc.lastAutoTable?.finalY || 100;
    doc.text("DNA Sequence Snippet (first 500 bp):", 20, tableEnd + 15);
    
    doc.setFontSize(10);
    doc.setFont('courier');
    const snippet = result.dna_sequence.length > 500 ? result.dna_sequence.substring(0, 500) + '...' : result.dna_sequence;
    const splitSnippet = doc.splitTextToSize(snippet, 170);
    doc.text(splitSnippet, 20, tableEnd + 25);
    
    doc.save(`${result.filename}_DNA_Report.pdf`);
  };

  const currentMethod = SYNTHESIS_METHODS[synthesisMethod];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div className="grid-cols-2" style={{ alignItems: 'start' }}>
      <div className="showcase-card">
        <h3 style={{ marginBottom: '1.5rem' }}>1. Select File & Options</h3>
        <div 
          className={`upload-area ${file ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => handleKeyDown(e, () => fileInputRef.current?.click())}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          style={{ 
            marginBottom: '0.5rem',
            borderColor: isDragOver ? 'var(--accent-cyan)' : undefined,
            background: isDragOver ? 'rgba(0,204,255,0.06)' : undefined,
            transition: 'border-color 0.2s, background 0.2s'
          }}
          aria-label="Upload File Dropzone — Click or Drag and Drop"
        >
          <input 
            type="file" 
            style={{ display: 'none' }} 
            ref={fileInputRef} 
            onChange={handleFileSelect}
            aria-label="File Upload Input"
          />
          {file ? (
            <div>
              <FileIcon size={48} color="var(--accent-cyan)" style={{ marginBottom: '1rem' }} />
              <h4 style={{ marginBottom: '0.5rem' }}>{file.name}</h4>
              <p className="text-muted">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div>
              <UploadCloud size={48} color={isDragOver ? 'var(--accent-cyan)' : 'var(--text-secondary)'} style={{ marginBottom: '1rem' }} />
              <h4>{isDragOver ? 'Drop it!' : 'Click or drag file to upload'}</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>PDF, PNG, JPG, TXT, DOCX, MP4 — max 10 MB</p>
            </div>
          )}
        </div>

        {/* Inline file validation error */}
        {fileError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 'var(--radius-sm)', color: '#ff6b6b', fontSize: '0.85rem' }}>
            <AlertTriangle size={16} />
            {fileError}
          </div>
        )}

        {/* API Error badge */}
        {apiError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 'var(--radius-sm)', color: '#ff6b6b', fontSize: '0.85rem' }}>
            <AlertTriangle size={16} />
            {apiError}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            type="button"
            className="btn" 
            style={{ width: '100%', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} /> Advanced Security & Biological Options
            </div>
            <span>{showAdvanced ? '▲' : '▼'}</span>
          </button>

          {showAdvanced && (
            <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)', borderTop: 'none' }}>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="synthesis-method" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  <Dna size={16} color="var(--accent-green)" /> Proposed Synthesis Method
                </label>
                <select 
                  id="synthesis-method"
                  className="input-glass" 
                  value={synthesisMethod}
                  onChange={(e) => setSynthesisMethod(e.target.value)}
                >
                  <option value="chemical">Traditional Chemical (Standard)</option>
                  <option value="enzymatic">Enzymatic (Eco-Friendly)</option>
                  <option value="photo">Photolithographic (High-Throughput)</option>
                </select>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Speed: <strong style={{ color: currentMethod.color }}>{currentMethod.speed}</strong></span>
                  <span>Toxicity: <strong>{currentMethod.toxicity}</strong></span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="encoder-password" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  <Lock size={16} color="var(--accent-purple)" /> AES Encryption Password
                </label>
                <input 
                  id="encoder-password"
                  type="password" 
                  placeholder="Optional password to encrypt data"
                  className="input-glass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>If set, data is encrypted before DNA synthesis.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setUseErrorCorrection(!useErrorCorrection);
                    if (!useErrorCorrection) setUseFountain(false); // Mutually exclusive for now
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setUseErrorCorrection(!useErrorCorrection);
                      if (!useErrorCorrection) setUseFountain(false);
                    }
                  }}
                  style={{ 
                    width: '20px', height: '20px', borderRadius: '4px', border: '1px solid #333', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    background: useErrorCorrection ? '#00e5ff' : 'transparent'
                  }}
                >
                  {useErrorCorrection && <Check size={14} color="#000" />}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Enable Reed-Solomon Error Correction</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div 
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setUseFountain(!useFountain);
                      if (!useFountain) setUseErrorCorrection(false); // Mutually exclusive for now
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setUseFountain(!useFountain);
                        if (!useFountain) setUseErrorCorrection(false);
                      }
                    }}
                    style={{ 
                      width: '20px', height: '20px', borderRadius: '4px', border: '1px solid #333', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: useFountain ? '#00e5ff' : 'transparent'
                    }}
                  >
                    {useFountain && <Check size={14} color="#000" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Enable DNA Fountain Codes (Advanced LT)</div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>Rateless erasure codes for maximum dropout resilience.</div>
                  </div>
                </div>
                {useFountain && (
                  <div style={{ marginTop: '0.5rem', paddingLeft: '2rem', borderLeft: '2px solid rgba(0, 229, 255, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Redundancy Overhead:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#00e5ff' }}>{fountainOverhead}x ({Math.round((fountainOverhead - 1) * 100)}% extra droplets)</span>
                    </div>
                    <input 
                      type="range" 
                      min="1.1" 
                      max="3.0" 
                      step="0.1" 
                      value={fountainOverhead} 
                      onChange={(e) => setFountainOverhead(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: '#00e5ff', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#666', marginTop: '0.2rem' }}>
                      <span>1.1x (Minimal)</span>
                      <span>1.5x (Standard)</span>
                      <span>3.0x (Ultra-Robust)</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: useSteganography && carrierAccession ? '1px solid rgba(0,255,204,0.3)' : 'none' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={useSteganography}
                    onChange={(e) => setUseSteganography(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span style={{ fontWeight: 500 }}><Dna size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Enable DNA Steganography</span>
                </label>
                {useSteganography && (
                  <div style={{ marginTop: '0.4rem', paddingLeft: '1.75rem', borderLeft: '2px solid var(--accent-cyan)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label htmlFor="stego-carrier-input" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Host Carrier Sequence / Accession ID:
                      </label>
                      {carrierAccession && (
                        <button 
                          type="button" 
                          onClick={() => { setCarrierAccession(''); clearCarrier(); }}
                          style={{ background: 'none', border: 'none', color: '#ff6b6b', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Clear Carrier
                        </button>
                      )}
                    </div>
                    <input 
                      id="stego-carrier-input"
                      type="text" 
                      placeholder="e.g. CM184355.1 (Klebsiella pneumoniae plasmid carrier)"
                      className="input-minimal"
                      style={{ fontSize: '0.85rem', padding: '0.6rem 0.8rem', width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: 'var(--text-primary)' }}
                      value={carrierAccession}
                      onChange={(e) => setCarrierAccession(e.target.value)}
                    />
                    <p style={{ fontSize: '0.75rem', color: carrierAccession ? 'var(--accent-green)' : '#888', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {carrierAccession ? `✨ Active Carrier [${carrierAccession}] selected for silent flanking insertion.` : 'Enter NCBI Accession ID or leave blank for default camouflage.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Multi-step progress indicator */}
        {loading && progressStage > 0 && (() => {
          const stage = PROGRESS_STAGES[progressStage - 1];
          const StageIcon = stage.icon;
          return (
            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(0,204,255,0.05)', border: '1px solid rgba(0,204,255,0.15)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <StageIcon size={18} color="var(--accent-cyan)" className="animate-spin" />
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 600 }}>{stage.label}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {PROGRESS_STAGES.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < progressStage ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)', transition: 'background 0.4s' }} />
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Stage {progressStage} of {PROGRESS_STAGES.length}</p>
            </div>
          );
        })()}

        <button 
          type="button"
          className="btn" 
          style={{ width: '100%', justifyContent: 'center', background: '#fff', color: '#000', padding: '1rem', border: 'none' }}
          onClick={handleEncode}
          disabled={!file || loading || !!fileError}
        >
          {loading ? <RefreshCw className="animate-spin" /> : <Cpu />}
          {loading ? `${PROGRESS_STAGES[Math.max(0, progressStage - 1)]?.label || 'Processing...'}` : 'Encode to DNA'}
        </button>
      </div>

      <div className="showcase-card" style={result ? { borderColor: 'var(--accent-gold)' } : {}}>
        <h3 style={{ marginBottom: '1.5rem' }}>2. Synthesis Result</h3>
        
        {!result ? (
          <div className="flex-center" style={{ height: '70%', flexDirection: 'column', color: 'var(--text-secondary)' }}>
            <DnaVialPlaceholder 
              loading={loading} 
              progressStage={progressStage}
              stageLabel={PROGRESS_STAGES[Math.max(0, progressStage - 1)]?.label}
            />
            {!loading && (
              <button
                type="button"
                onClick={() => setShowPipelineDemo(!showPipelineDemo)}
                style={{
                  marginTop: '1.5rem',
                  background: showPipelineDemo ? 'rgba(255, 100, 100, 0.12)' : 'rgba(0, 255, 204, 0.12)',
                  border: showPipelineDemo ? '1px solid #ff6b6b' : '1px solid var(--accent-cyan)',
                  color: showPipelineDemo ? '#ff6b6b' : 'var(--accent-cyan)',
                  padding: '0.65rem 1.3rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  boxShadow: showPipelineDemo ? '0 0 15px rgba(255,100,100,0.15)' : '0 0 15px rgba(0,255,204,0.15)'
                }}
              >
                {showPipelineDemo ? '✕ Close Pipeline Demo' : '✨ Preview "Digital-to-Biological" Pipeline Demo'}
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Sequence Length</p>
                <h4>{result.metrics.length?.toLocaleString()} bp</h4>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>GC Content</p>
                <h4>{result.metrics.gc_content}%</h4>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Est. Synthesis Cost</p>
                <h4 style={{ color: currentMethod.color }}>${(result.metrics.length * currentMethod.costPerBp).toLocaleString()}</h4>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Physical Weight</p>
                <h4 style={{ color: 'var(--accent-purple)' }}>{formatWeight(result.metrics.length)}</h4>
              </div>
              {/* New expanded metrics */}
              {result.metrics.shannon_entropy !== undefined && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Shannon Entropy</p>
                  <h4 style={{ color: 'var(--accent-gold)' }}>{result.metrics.shannon_entropy} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>bits/sym</span></h4>
                </div>
              )}
              {result.metrics.homopolymer_count !== undefined && (
                <div style={{ background: result.metrics.homopolymer_count === 0 ? 'rgba(0,255,100,0.05)' : 'rgba(255,80,80,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: result.metrics.homopolymer_count === 0 ? '1px solid rgba(0,255,100,0.15)' : '1px solid rgba(255,80,80,0.15)' }}>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Homopolymers</p>
                  <h4 style={{ color: result.metrics.homopolymer_count === 0 ? 'var(--accent-green)' : '#ff6b6b' }}>
                    {result.metrics.homopolymer_count === 0 ? '✓ None' : result.metrics.homopolymer_count}
                  </h4>
                </div>
              )}
            </div>

            {result.biosecurity_report && (
              <div style={{ 
                background: result.biosecurity_report.passed ? 'rgba(0, 255, 100, 0.08)' : 'rgba(255, 80, 80, 0.08)', 
                border: result.biosecurity_report.passed ? '1px solid rgba(0, 255, 100, 0.25)' : '1px solid rgba(255, 80, 80, 0.25)', 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-sm)', 
                marginBottom: '1.5rem', 
                fontSize: '0.82rem' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <strong style={{ color: result.biosecurity_report.passed ? 'var(--accent-green)' : '#ff6b6b' }}>
                    🛡️ Enterprise Biosecurity Screen: {result.biosecurity_report.pathogen_screen_status}
                  </strong>
                  <span style={{ fontWeight: 600, color: result.biosecurity_report.score >= 80 ? 'var(--accent-green)' : '#ffaa00' }}>
                    Safety Score: {result.biosecurity_report.score}/100
                  </span>
                </div>
                {result.biosecurity_report.flags && result.biosecurity_report.flags.length > 0 && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {result.biosecurity_report.flags.map((flag, idx) => (
                      <div key={idx} style={{ color: flag.includes('CRITICAL') ? '#ff6b6b' : 'var(--text-secondary)' }}>• {flag}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Storage density callout */}
            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <Zap size={14} color="var(--accent-purple)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
              <strong style={{ color: 'var(--accent-purple)' }}>Storage Density:</strong> 1 gram of this DNA could theoretically store <strong style={{ color: 'var(--text-primary)' }}>215 Petabytes</strong> — equivalent to ~4.3 million 50 GB Blu-ray discs. <span style={{ fontSize: '0.75rem' }}>(Church et al., Nature 2012)</span>
            </div>

            {originalFileHash && (
              <div style={{ background: 'rgba(0,255,204,0.05)', border: '1px solid rgba(0,255,204,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Original File SHA-256 Checksum</p>
                <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>{originalFileHash}</p>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>DNA Sequence Preview</p>
              <div className="sequence-preview">
                {result.dna_sequence}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn" 
                style={{ flex: '1 1 45%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => downloadFile(result.fasta, `${result.filename}.fasta`)}
              >
                <Download size={16} /> FASTA
              </button>
              <button 
                type="button"
                className="btn" 
                style={{ flex: '1 1 45%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={() => downloadFile(result.genbank, `${result.filename}.gb`)}
              >
                <Download size={16} /> GenBank
              </button>
              <button 
                type="button"
                className="btn" 
                style={{ flex: '1 1 100%', justifyContent: 'center', marginTop: '0.5rem', background: '#fff', color: '#000', padding: '1rem', border: 'none' }}
                onClick={generatePDFReport}
              >
                <FileText size={16} /> Generate PDF Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Full-Width Widescreen Visual Pipeline Display */}
    {(showPipelineDemo || (loading && progressStage > 0)) && (
      <div style={{ marginTop: '2.5rem', width: '100%', animation: 'fadeIn 0.3s ease' }}>
        <VisualPipeline 
          file={file} 
          progressStage={progressStage} 
          isDemo={showPipelineDemo && !loading} 
          onClose={() => setShowPipelineDemo(false)} 
        />
      </div>
    )}
  </div>
  );
}
