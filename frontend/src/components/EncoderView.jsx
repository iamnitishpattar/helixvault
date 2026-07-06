import { useState, useRef } from 'react';
import { UploadCloud, Download, File as FileIcon, ArrowRight, RefreshCw, Cpu, Settings, Shield, Lock, FileText, Dna } from 'lucide-react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE_URL } from '../config';
import { calculateSHA256, formatWeight, downloadFile } from '../utils/fileUtils';

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

export default function EncoderView() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [originalFileHash, setOriginalFileHash] = useState(null);
  const fileInputRef = useRef(null);

  // Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [password, setPassword] = useState('');
  const [useErrorCorrection, setUseErrorCorrection] = useState(false);
  const [useSteganography, setUseSteganography] = useState(false);
  const [synthesisMethod, setSynthesisMethod] = useState('chemical');

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleEncode = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    
    try {
      const hash = await calculateSHA256(file);
      setOriginalFileHash(hash);
      
      const formData = new FormData();
      formData.append('file', file);
      if (password) formData.append('password', password);
      formData.append('use_error_correction', useErrorCorrection);
      formData.append('use_steganography', useSteganography);

      // We need to send authentication token if protected (assuming standard Bearer)
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(`${API_BASE_URL}/api/dna/encode`, formData, { headers });
      
      if (res.data.task_id) {
        // Polling loop for Enterprise Async Tasks
        const intervalId = setInterval(async () => {
          try {
            const statusRes = await axios.get(`${API_BASE_URL}/api/dna/status/${res.data.task_id}`);
            if (statusRes.data.status === 'success') {
              clearInterval(intervalId);
              setResult(statusRes.data);
              setLoading(false);
            } else if (statusRes.data.status === 'failed') {
              clearInterval(intervalId);
              alert("Error encoding file: " + statusRes.data.error);
              setLoading(false);
            }
          } catch (e) {
             console.error("Polling error", e);
          }
        }, 1500);
      } else {
        setResult(res.data);
        setLoading(false);
      }
    } catch (err) {
      alert("Error encoding file: " + (err.response?.data?.detail || err.message));
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
    <div className="grid-cols-2">
      <div className="showcase-card">
        <h3 style={{ marginBottom: '1.5rem' }}>1. Select File & Options</h3>
        <div 
          className={`upload-area ${file ? 'active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => handleKeyDown(e, () => fileInputRef.current?.click())}
          role="button"
          tabIndex={0}
          style={{ marginBottom: '1.5rem' }}
          aria-label="Upload File Dropzone"
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
              <UploadCloud size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
              <h4>Click or drag file to upload</h4>
            </div>
          )}
        </div>

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
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  <Dna size={16} color="var(--accent-green)" /> Proposed Synthesis Method
                </label>
                <select 
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={useErrorCorrection}
                    onChange={(e) => setUseErrorCorrection(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span><Shield size={16} color="var(--accent-cyan)" style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Enable Reed-Solomon Error Correction</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={useSteganography}
                    onChange={(e) => setUseSteganography(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                  />
                  <span><Dna size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Enable DNA Steganography</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <button 
          type="button"
          className="btn" 
          style={{ width: '100%', justifyContent: 'center', background: '#fff', color: '#000', padding: '1rem', border: 'none' }}
          onClick={handleEncode}
          disabled={!file || loading}
        >
          {loading ? <RefreshCw className="animate-spin" /> : <Cpu />}
          {loading ? 'Synthesizing in Data Center...' : 'Encode to DNA'}
        </button>
      </div>

      <div className="showcase-card" style={result ? { borderColor: 'var(--accent-gold)' } : {}}>
        <h3 style={{ marginBottom: '1.5rem' }}>2. Synthesis Result</h3>
        
        {!result ? (
          <div className="flex-center" style={{ height: '70%', flexDirection: 'column', color: 'var(--text-secondary)' }}>
            <ArrowRight size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>{loading ? 'Encoding data to DNA sequence...' : 'Awaiting file encoding...'}</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Sequence Length</p>
                <h4>{result.metrics.length} bp</h4>
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
  );
}
