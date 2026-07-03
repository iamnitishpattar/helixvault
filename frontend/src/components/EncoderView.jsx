import { useState, useRef } from 'react';
import { UploadCloud, Download, File as FileIcon, ArrowRight, RefreshCw, Cpu, Settings, Shield, Lock, FileText, Dna } from 'lucide-react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { API_BASE_URL } from '../config';
import { calculateSHA256, formatWeight, downloadFile } from '../utils/fileUtils';

const handleKeyDown = (e, action) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
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

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };



  const handleEncode = async () => {
    if (!file) return;
    setLoading(true);
    
    try {
      const hash = await calculateSHA256(file);
      setOriginalFileHash(hash);
      
      const formData = new FormData();
      formData.append('file', file);
      if (password) formData.append('password', password);
      formData.append('use_error_correction', useErrorCorrection);
      formData.append('use_steganography', useSteganography);

      const res = await axios.post(`${API_BASE_URL}/api/dna/encode`, formData);
      setResult(res.data);
    } catch (err) {
      alert("Error encoding file: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 204, 255);
    doc.text("HelixVault DNA Synthesis Report", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    
    // Meta data table
    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Value']],
      body: [
        ['Original Filename', result.filename],
        ['DNA Sequence Length', `${result.metrics.length} bp`],
        ['GC Content', `${result.metrics.gc_content}%`],
        ['Encrypted', password ? 'Yes' : 'No'],
        ['Error Correction (Reed-Solomon)', useErrorCorrection ? 'Yes' : 'No'],
        ['Steganography', useSteganography ? 'Yes' : 'No']
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 204, 255] }
    });

    // Sequence snippet
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const tableEnd = doc.lastAutoTable.finalY || 40;
    doc.text("DNA Sequence Snippet (first 500 bp):", 20, tableEnd + 15);
    
    doc.setFontSize(10);
    doc.setFont('courier');
    const snippet = result.dna_sequence.length > 500 ? result.dna_sequence.substring(0, 500) + '...' : result.dna_sequence;
    const splitSnippet = doc.splitTextToSize(snippet, 170);
    doc.text(splitSnippet, 20, tableEnd + 25);
    
    doc.save(`${result.filename}_DNA_Report.pdf`);
  };

  return (
    <div className="grid-cols-2">
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1.5rem' }}>1. Select File & Options</h3>
        <div 
          className={`upload-area ${file ? 'active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => handleKeyDown(e, () => fileInputRef.current?.click())}
          // eslint-disable-next-line react-doctor/no-static-element-interactions, react-doctor/click-events-have-key-events, react-doctor/prefer-tag-over-role
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
            style={{ width: '100%', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}
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
                    aria-label="Enable Error Correction"
                  />
                  <span><Shield size={16} color="var(--accent-cyan)" style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Enable Reed-Solomon Error Correction</span>
                </label>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '2rem', marginTop: '0.2rem' }}>Protects against base mutations and sequencing errors.</p>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={useSteganography}
                    onChange={(e) => setUseSteganography(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
                    aria-label="Enable Steganography"
                  />
                  <span><Dna size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> Enable DNA Steganography</span>
                </label>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '2rem', marginTop: '0.2rem' }}>Hides your data within a host organism's genome (simulated from NCBI).</p>
              </div>
            </div>
          )}
        </div>

        <button 
          type="button"
          className="btn btn-primary" 
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleEncode}
          disabled={!file || loading}
        >
          {loading ? <RefreshCw className="animate-spin" /> : <Cpu />}
          {loading ? 'Synthesizing...' : 'Encode to DNA'}
        </button>
      </div>

      <div className="glass-panel" style={result ? { borderColor: 'var(--accent-cyan)' } : {}}>
        <h3 style={{ marginBottom: '1.5rem' }}>2. Synthesis Result</h3>
        
        {!result ? (
          <div className="flex-center" style={{ height: '70%', flexDirection: 'column', color: 'var(--text-secondary)' }}>
            <ArrowRight size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>Awaiting file encoding...</p>
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
                <h4 style={{ color: 'var(--accent-pink)' }}>${(result.metrics.length * 0.10).toLocaleString()}</h4>
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
                style={{ flex: '1 1 45%', justifyContent: 'center' }}
                onClick={() => downloadFile(result.fasta, `${result.filename}.fasta`)}
              >
                <Download size={16} /> FASTA
              </button>
              <button 
                type="button"
                className="btn" 
                style={{ flex: '1 1 45%', justifyContent: 'center' }}
                onClick={() => downloadFile(result.genbank, `${result.filename}.gb`)}
              >
                <Download size={16} /> GenBank
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                style={{ flex: '1 1 100%', justifyContent: 'center', marginTop: '0.5rem' }}
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
