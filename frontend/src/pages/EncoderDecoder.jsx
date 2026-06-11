import { useState, useRef } from 'react';
import { UploadCloud, Download, File as FileIcon, ArrowRight, RefreshCw, Cpu, Database, Settings, Shield, Lock, FileText, Dna } from 'lucide-react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

function EncoderDecoder() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('encode'); // 'encode' or 'decode'
  const fileInputRef = useRef(null);

  const [decodeFile, setDecodeFile] = useState(null);
  const [decodeResult, setDecodeResult] = useState(null);
  const decodeFileInputRef = useRef(null);

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
    const formData = new FormData();
    formData.append('file', file);
    if (password) formData.append('password', password);
    formData.append('use_error_correction', useErrorCorrection);
    formData.append('use_steganography', useSteganography);

    try {
      const res = await axios.post(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/dna/encode` , formData);
      setResult(res.data);
    } catch (err) {
      alert("Error encoding file: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDecodeFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDecodeFile(e.target.files[0]);
    }
  };

  const handleDecode = async () => {
    if (!decodeFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', decodeFile);
    if (password) formData.append('password', password);
    formData.append('use_error_correction', useErrorCorrection);
    formData.append('use_steganography', useSteganography);

    try {
      const res = await axios.post(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/dna/decode` , formData);
      setDecodeResult(res.data);
    } catch (err) {
      alert("Error decoding file: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (content, filename) => {
    const element = document.createElement("a");
    const fileBlob = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(fileBlob);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
  };

  const downloadDecodedFile = () => {
    if (!decodeResult) return;
    const byteCharacters = atob(decodeResult.file_data_b64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray]);
    
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = decodeResult.filename;
    document.body.appendChild(element);
    element.click();
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

  let decodedTextPreview = null;
  if (decodeResult && decodeResult.filename.match(/\.(txt|md|csv|json|js|jsx|py|html|css|gb|fasta)$/i)) {
    try {
      decodedTextPreview = decodeURIComponent(escape(atob(decodeResult.file_data_b64)));
    } catch {
      decodedTextPreview = "Preview not available for this file type.";
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2><span className="text-gradient">Data {'<>'} DNA</span> Converter</h2>
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--glass-bg)', padding: '0.5rem', borderRadius: 'var(--radius-full)' }}>
          <button 
            className={`btn ${mode === 'encode' ? 'btn-primary' : ''}`}
            onClick={() => setMode('encode')}
            style={{ border: 'none' }}
          >
            Encode to DNA
          </button>
          <button 
            className={`btn ${mode === 'decode' ? 'btn-primary' : ''}`}
            onClick={() => setMode('decode')}
            style={{ border: 'none' }}
          >
            Decode to Data
          </button>
        </div>
      </div>

      {mode === 'encode' ? (
        <div className="grid-cols-2">
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem' }}>1. Select File & Options</h3>
            <div 
              className={`upload-area ${file ? 'active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              style={{ marginBottom: '1.5rem' }}
            >
              <input 
                type="file" 
                style={{ display: 'none' }} 
                ref={fileInputRef} 
                onChange={handleFileSelect}
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      <Lock size={16} color="var(--accent-purple)" /> AES Encryption Password
                    </label>
                    <input 
                      type="password" 
                      placeholder="Optional password to encrypt data"
                      className="input-glass"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '2rem', marginTop: '0.2rem' }}>Protects against base mutations and sequencing errors.</p>
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
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '2rem', marginTop: '0.2rem' }}>Hides your data within a host organism's genome (simulated from NCBI).</p>
                  </div>
                </div>
              )}
            </div>

            <button 
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
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', flex: 1 }}>
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>Sequence Length</p>
                    <h4>{result.metrics.length} bp</h4>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', flex: 1 }}>
                    <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>GC Content</p>
                    <h4>{result.metrics.gc_content}%</h4>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>DNA Sequence Preview</p>
                  <div style={{ 
                    background: 'var(--bg-dark)', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: 'var(--accent-cyan)',
                    wordBreak: 'break-all',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {result.dna_sequence}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="btn" 
                    style={{ flex: '1 1 45%', justifyContent: 'center' }}
                    onClick={() => downloadFile(result.fasta, `${result.filename}.fasta`)}
                  >
                    <Download size={16} /> FASTA
                  </button>
                  <button 
                    className="btn" 
                    style={{ flex: '1 1 45%', justifyContent: 'center' }}
                    onClick={() => downloadFile(result.genbank, `${result.filename}.gb`)}
                  >
                    <Download size={16} /> GenBank
                  </button>
                  <button 
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
      ) : (
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>DNA Sequence Decoder</h3>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>
            Upload the synthesized DNA file to recover your data. Match the advanced options used during encoding.
          </p>
          <div 
            className={`upload-area ${decodeFile ? 'active' : ''}`}
            onClick={() => decodeFileInputRef.current?.click()}
            style={{ marginBottom: '1.5rem' }}
          >
            <input 
              type="file" 
              style={{ display: 'none' }} 
              ref={decodeFileInputRef} 
              onChange={handleDecodeFileSelect}
              accept=".fasta,.gb,.txt"
            />
            {decodeFile ? (
              <div>
                <FileIcon size={48} color="var(--accent-cyan)" style={{ marginBottom: '1rem' }} />
                <h4 style={{ marginBottom: '0.5rem' }}>{decodeFile.name}</h4>
              </div>
            ) : (
              <div>
                <UploadCloud size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                <h4>Click or drag DNA file to upload</h4>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <button 
              className="btn" 
              style={{ width: '100%', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} /> Decoding Options
              </div>
              <span>{showAdvanced ? '▲' : '▼'}</span>
            </button>

            {showAdvanced && (
              <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <input 
                    type="password" 
                    placeholder="Decryption Password (if used)"
                    className="input-glass"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={useErrorCorrection}
                      onChange={(e) => setUseErrorCorrection(e.target.checked)}
                    />
                    <span>Use Error Correction</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={useSteganography}
                      onChange={(e) => setUseSteganography(e.target.checked)}
                    />
                    <span>Extract from Steganography</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '2rem', justifyContent: 'center' }}
            onClick={handleDecode}
            disabled={!decodeFile || loading}
          >
            {loading ? <RefreshCw className="animate-spin" /> : <Database />}
            {loading ? 'Decoding...' : 'Extract Data'}
          </button>

          {decodeResult && (
            <div style={{ background: 'rgba(0,255,204,0.1)', border: '1px solid var(--accent-cyan)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <FileIcon size={48} color="var(--accent-cyan)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Successfully Decoded</h3>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Original Filename: <strong>{decodeResult.filename}</strong></p>
              
              {decodedTextPreview && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Content Preview:</p>
                  <textarea 
                    readOnly
                    className="input-glass"
                    style={{ width: '100%', minHeight: '150px', maxHeight: '300px', resize: 'vertical', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}
                    value={decodedTextPreview}
                  ></textarea>
                </div>
              )}

              <button className="btn" onClick={downloadDecodedFile}>
                <Download size={16} /> Download Recovered File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EncoderDecoder;
