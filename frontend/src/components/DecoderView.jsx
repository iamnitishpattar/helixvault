import { useState, useRef } from 'react';
import { UploadCloud, Download, File as FileIcon, RefreshCw, Database, Settings, Dna, Thermometer } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { calculateSHA256 } from '../utils/fileUtils';

const handleKeyDown = (e, action) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
};

export default function DecoderView() {
  const [decodeFile, setDecodeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decodeResult, setDecodeResult] = useState(null);
  const [decodedHash, setDecodedHash] = useState(null);
  const decodeFileInputRef = useRef(null);
  
  const [mutationMessage, setMutationMessage] = useState("");

  // Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [password, setPassword] = useState('');
  const [useErrorCorrection, setUseErrorCorrection] = useState(false);
  const [useSteganography, setUseSteganography] = useState(false);
  
  // Environment Decay Options
  const [environment, setEnvironment] = useState('freezer');

  const handleDecodeFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDecodeFile(e.target.files[0]);
    }
  };

  const handleDecode = async () => {
    if (!decodeFile) return;
    setLoading(true);
    setDecodeResult(null);
    setDecodedHash(null);
    
    const formData = new FormData();
    formData.append('file', decodeFile);
    if (password) formData.append('password', password);
    formData.append('use_error_correction', useErrorCorrection);
    formData.append('use_steganography', useSteganography);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(`${API_BASE_URL}/api/dna/decode`, formData, { headers });
      
      if (res.data.task_id) {
        // Polling loop for Async Background Task
        const intervalId = setInterval(async () => {
          try {
            const statusRes = await axios.get(`${API_BASE_URL}/api/dna/status/${res.data.task_id}`);
            if (statusRes.data.status === 'success') {
              clearInterval(intervalId);
              setDecodeResult(statusRes.data);
              
              // Calculate hash of decoded file
              const byteCharacters = atob(statusRes.data.file_data_b64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              calculateSHA256(new Blob([byteArray])).then(setDecodedHash);
              
              setLoading(false);
            } else if (statusRes.data.status === 'failed') {
              clearInterval(intervalId);
              alert("Error decoding file: " + statusRes.data.error);
              setLoading(false);
            }
          } catch (e) {
            console.error("Polling error", e);
          }
        }, 1500);
      } else {
        setDecodeResult(res.data);
        const byteCharacters = atob(res.data.file_data_b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const hash = await calculateSHA256(new Blob([byteArray]));
        setDecodedHash(hash);
        setLoading(false);
      }
    } catch (err) {
      alert("Error decoding file: " + (err.response?.data?.detail || err.message));
      setLoading(false);
    }
  };

  const handleMutateSequence = async () => {
    if (!decodeFile) return;
    
    const text = await decodeFile.text();
    let chars = text.split('');
    const basesList = ['A', 'C', 'G', 'T'];
    let mutationsCount = 0;
    let indelCount = 0;
    
    // Set parameters based on environment
    let errorRate = 0;
    let indelRate = 0;
    if (environment === 'freezer') {
      errorRate = 0.0001;
      indelRate = 0;
    } else if (environment === 'room') {
      errorRate = 0.005;
      indelRate = 0;
    } else if (environment === 'invivo') {
      errorRate = 0.01;
      indelRate = 0.005; // High indel rate for In Vivo
    }

    let i = 0;
    while(i < chars.length) {
      if (!basesList.includes(chars[i].toUpperCase())) {
        i++;
        continue;
      }

      if (Math.random() < errorRate) {
        // Substitution
        const availableBases = basesList.filter(b => b !== chars[i].toUpperCase());
        chars[i] = availableBases[Math.floor(Math.random() * availableBases.length)];
        mutationsCount++;
      } else if (Math.random() < indelRate) {
        if (Math.random() > 0.5) {
          // Deletion
          chars.splice(i, 1);
          indelCount++;
          continue; // Don't increment i
        } else {
          // Insertion
          chars.splice(i, 0, basesList[Math.floor(Math.random() * basesList.length)]);
          indelCount++;
          i++; // Skip the inserted base
        }
      }
      i++;
    }
    
    const mutatedText = chars.join('');
    const mutatedFile = new File([mutatedText], `mutated_${decodeFile.name}`, {
      type: decodeFile.type || 'text/plain'
    });
    
    setMutationMessage(`Mutation Applied [${environment}]: ${mutationsCount} substitutions, ${indelCount} indels corrupted!`);
    setDecodeFile(mutatedFile);
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
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  let filePreview = null;
  if (decodeResult) {
    const ext = decodeResult.filename.split('.').pop().toLowerCase();
    if (['txt', 'md', 'csv', 'json', 'js', 'jsx', 'py', 'html', 'css', 'gb', 'fasta'].includes(ext)) {
      try {
        const textContent = decodeURIComponent(escape(atob(decodeResult.file_data_b64)));
        filePreview = (
          <textarea 
            readOnly
            className="input-glass"
            style={{ width: '100%', minHeight: '150px', maxHeight: '300px', resize: 'vertical', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}
            value={textContent}
            aria-label="File Preview Textarea"
          ></textarea>
        );
      } catch {
        filePreview = <p className="text-muted">Preview not available for this text file.</p>;
      }
    } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      filePreview = (
        <div style={{ textAlign: 'center' }}>
          <img 
            src={`data:image/${ext === 'svg' ? 'svg+xml' : ext};base64,${decodeResult.file_data_b64}`} 
            alt="Decoded Preview" 
            style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 'var(--radius-sm)', objectFit: 'contain' }} 
          />
        </div>
      );
    } else if (['pdf'].includes(ext)) {
      filePreview = (
        <iframe 
          src={`data:application/pdf;base64,${decodeResult.file_data_b64}#toolbar=0`} 
          style={{ width: '100%', height: '500px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)' }}
          title="PDF Preview"
        ></iframe>
      );
    } else {
      filePreview = (
        <div className="flex-center" style={{ height: '150px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <p className="text-muted">Preview not available for this file type (.{ext}). Please download to view.</p>
        </div>
      );
    }
  }

  return (
    <div className="showcase-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '1.5rem' }}>DNA Sequence Decoder</h3>
      <p className="text-muted" style={{ marginBottom: '1rem' }}>
        Upload the synthesized DNA file to recover your data. Match the advanced options used during encoding.
      </p>
      
      <div 
        className={`upload-area ${decodeFile ? 'active' : ''}`}
        onClick={() => decodeFileInputRef.current?.click()}
        onKeyDown={(e) => handleKeyDown(e, () => decodeFileInputRef.current?.click())}
        role="button"
        tabIndex={0}
        style={{ marginBottom: '1.5rem' }}
        aria-label="Upload DNA File Dropzone"
      >
        <input 
          type="file" 
          style={{ display: 'none' }} 
          ref={decodeFileInputRef} 
          onChange={handleDecodeFileSelect}
          accept=".fasta,.gb,.txt"
          aria-label="DNA File Upload Input"
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
          type="button"
          className="btn" 
          style={{ width: '100%', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} /> Decoding & Environmental Options
          </div>
          <span>{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)' }}>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                <Thermometer size={16} color="var(--accent-pink)" /> Simulated Storage Environment
              </label>
              <select 
                className="input-glass" 
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              >
                <option value="freezer">Deep Freeze Archival (-80°C) [Low Error]</option>
                <option value="room">In Vitro Room Temp [Medium Error]</option>
                <option value="invivo">In Vivo (Living E. coli Cell) [High Error + Indels]</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input 
                type="password" 
                placeholder="Decryption Password (if used)"
                className="input-glass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          type="button"
          className="btn" 
          style={{ flex: 1, justifyContent: 'center', background: 'rgba(255,0,85,0.05)', borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }}
          onClick={handleMutateSequence}
          disabled={!decodeFile || loading}
        >
          <Dna /> Simulate Environmental Mutation
        </button>
        <button 
          type="button"
          className="btn" 
          style={{ flex: 2, justifyContent: 'center', background: '#fff', color: '#000', padding: '1rem', border: 'none' }}
          onClick={handleDecode}
          disabled={!decodeFile || loading}
        >
          {loading ? <RefreshCw className="animate-spin" /> : <Database />}
          {loading ? 'Decoding from Enterprise Queue...' : 'Extract Data'}
        </button>
      </div>
      
      {mutationMessage && (
        <div style={{ background: 'rgba(255,0,85,0.1)', border: '1px solid var(--accent-pink)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--accent-pink)' }}>
          {mutationMessage}
        </div>
      )}

      {decodeResult && (
        <div style={{ background: 'rgba(0,255,204,0.1)', border: '1px solid var(--accent-cyan)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <FileIcon size={48} color="var(--accent-cyan)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Successfully Decoded</h3>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Original Filename: <strong>{decodeResult.filename}</strong></p>
          
          {filePreview && (
            <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Content Preview:</p>
              {filePreview}
            </div>
          )}

          {decodedHash && (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', textAlign: 'left' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Recovered File SHA-256 Checksum:</p>
              <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-cyan)', wordBreak: 'break-all', marginBottom: '1rem' }}>{decodedHash}</p>
              
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Verify Integrity (Optional): Select original file to compare hashes.</p>
                <input 
                  type="file" 
                  className="input-glass" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const originalHash = await calculateSHA256(e.target.files[0]);
                      if (originalHash === decodedHash) {
                        alert("✅ INTEGRITY VERIFIED 100%! The decoded file is a perfect pixel-by-pixel match with your original file.");
                      } else {
                        alert("❌ INTEGRITY FAILED! The decoded file does not match the original file.");
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          <button type="button" className="btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} onClick={downloadDecodedFile}>
            <Download size={16} /> Download Recovered File
          </button>
        </div>
      )}
    </div>
  );
}
