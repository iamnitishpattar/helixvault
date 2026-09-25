import { useState, useRef, useEffect } from 'react';
import { UploadCloud, Download, File as FileIcon, RefreshCw, Database, Settings, Dna, Thermometer } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { calculateSHA256, base64ToBlob } from '../utils/fileUtils';
import { getSafeApiErrorMessage, getSafeServerMessage, logClientRequestFailure } from '../utils/errorMessages';
import { useToast } from '../context/ToastContext';

const handleKeyDown = (e, action) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
};

const DECODE_ERROR_MESSAGE = 'Decoding failed. Please check the DNA file and selected options, then try again.';

const getMimeType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeMap = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    json: 'application/json',
    html: 'text/html',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    ogv: 'video/ogg',
    flv: 'video/x-flv',
    '3gp': 'video/3gpp',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
  };
  return mimeMap[ext] || 'application/octet-stream';
};

export default function DecoderView() {
  const toast = useToast();
  const [decodeFile, setDecodeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decodeResult, setDecodeResult] = useState(null);
  const [decodedHash, setDecodedHash] = useState(null);
  const [mediaBlobUrl, setMediaBlobUrl] = useState(null);
  const decodeFileInputRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  // Create a Blob URL for media preview
  useEffect(() => {
    let url = null;
    if (decodeResult) {
      try {
        const ext = decodeResult.filename.split('.').pop().toLowerCase();
        if (ext === 'pdf') {
          const blob = base64ToBlob(decodeResult.file_data_b64, 'application/pdf');
          url = URL.createObjectURL(blob);
          setMediaBlobUrl(url);
        } else if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogv', 'flv', '3gp'].includes(ext)) {
          const mimeType = getMimeType(decodeResult.filename);
          const blob = base64ToBlob(decodeResult.file_data_b64, mimeType);
          url = URL.createObjectURL(blob);
          setMediaBlobUrl(url);
        }
      } catch (e) {
        console.error("Failed to create preview blob", e);
      }
    } else {
      setMediaBlobUrl(null);
    }
    
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [decodeResult]);
  
  const [mutationMessage, setMutationMessage] = useState("");

  // Advanced Options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [password, setPassword] = useState('');
  const [useErrorCorrection, setUseErrorCorrection] = useState(false);
  const [useFountain, setUseFountain] = useState(false);
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
    formData.append('use_fountain', useFountain);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/dna/decode`, formData, { 
        withCredentials: true 
      });
      
      if (res.data.task_id) {
        // Polling loop for Async Background Task
        pollingIntervalRef.current = setInterval(async () => {
          try {
            const statusRes = await axios.get(`${API_BASE_URL}/api/dna/status/${res.data.task_id}`);
            if (statusRes.data.status === 'success') {
              clearInterval(pollingIntervalRef.current);
              setDecodeResult(statusRes.data);
              
              // Calculate hash of decoded file
              fetch(`data:application/octet-stream;base64,${statusRes.data.file_data_b64}`)
                .then(res => res.blob())
                .then(blob => calculateSHA256(blob))
                .then(setDecodedHash);
              
              setLoading(false);
            } else if (statusRes.data.status === 'failed') {
              clearInterval(pollingIntervalRef.current);
              toast.error('Decode Failed', getSafeServerMessage(statusRes.data.error, DECODE_ERROR_MESSAGE));
              setLoading(false);
            }
          } catch (e) {
            logClientRequestFailure('Decoder status polling failed; retrying', e);
          }
        }, 1500);
      } else {
        setDecodeResult(res.data);
        fetch(`data:application/octet-stream;base64,${res.data.file_data_b64}`)
          .then(r => r.blob())
          .then(blob => calculateSHA256(blob))
          .then(hash => {
            setDecodedHash(hash);
            setLoading(false);
          });
      }
    } catch (err) {
      logClientRequestFailure('Decoding failed', err);
      toast.error('Decode Failed', getSafeApiErrorMessage(err, DECODE_ERROR_MESSAGE));
    } finally {
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



  const downloadDecodedFile = async () => {
    if (!decodeResult) return;
    const mimeType = getMimeType(decodeResult.filename);
    try {
      const res = await fetch(`data:${mimeType};base64,${decodeResult.file_data_b64}`);
      const blob = await res.blob();
      const element = document.createElement("a");
      const url = URL.createObjectURL(blob);
      element.href = url;
      element.download = decodeResult.filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  let filePreview = null;
  if (decodeResult) {
    const ext = decodeResult.filename.split('.').pop().toLowerCase();
    if (['txt', 'md', 'csv', 'json', 'js', 'jsx', 'py', 'html', 'css', 'gb', 'fasta'].includes(ext)) {
      let textContent = null;
      let textError = false;
      try {
        textContent = decodeURIComponent(escape(atob(decodeResult.file_data_b64)));
      } catch {
        textError = true;
      }
      
      if (textError) {
        filePreview = <p className="text-muted">Preview not available for this text file.</p>;
      } else {
        filePreview = (
          <textarea 
            readOnly
            className="input-glass"
            style={{ width: '100%', minHeight: '150px', maxHeight: '300px', resize: 'vertical', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}
            value={textContent}
            aria-label="File Preview Textarea"
          ></textarea>
        );
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
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'ogv', 'flv', '3gp'].includes(ext)) {
      const mimeType = getMimeType(decodeResult.filename);
      filePreview = (
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {mediaBlobUrl && (
            <video
              controls
              style={{ width: '100%', maxHeight: '400px', display: 'block' }}
            >
              <source src={mediaBlobUrl} type={mimeType} />
              Your browser does not support the video element.
            </video>
          )}
          <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎬 {decodeResult.filename} · {mimeType}
          </div>
        </div>
      );
    } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      const audioMime = getMimeType(decodeResult.filename);
      filePreview = (
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', padding: '1.5rem' }}>
          <audio controls style={{ width: '100%' }}>
            <source src={`data:${audioMime};base64,${decodeResult.file_data_b64}`} type={audioMime} />
            Your browser does not support the audio element.
          </audio>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
            🎵 {decodeResult.filename} · {audioMime}
          </p>
        </div>
      );
    } else if (ext === 'pdf') {
      filePreview = (
        <div style={{ height: '500px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {mediaBlobUrl ? (
            <iframe 
              src={`${mediaBlobUrl}#toolbar=0`} 
              title="PDF Preview" 
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div className="flex-center" style={{ height: '100%', background: 'rgba(0,0,0,0.2)' }}>
              <p className="text-muted">Loading PDF preview...</p>
            </div>
          )}
        </div>
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
              <label htmlFor="environment" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                <Thermometer size={16} color="var(--accent-pink)" /> Simulated Storage Environment
              </label>
              <select 
                id="environment"
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
              <label htmlFor="decoder-password" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Decryption Password</label>
              <input 
                id="decoder-password"
                type="password" 
                placeholder="Decryption Password (if used)"
                className="input-glass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={useErrorCorrection}
                  onChange={(e) => {
                    setUseErrorCorrection(e.target.checked);
                    if (e.target.checked) setUseFountain(false);
                  }}
                />
                <span>Use Error Correction</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={useFountain}
                  onChange={(e) => {
                    setUseFountain(e.target.checked);
                    if (e.target.checked) setUseErrorCorrection(false);
                  }}
                />
                <span>Use Fountain Codes</span>
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
                  aria-label="Verify Integrity"
                  type="file" 
                  className="input-glass" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const originalHash = await calculateSHA256(e.target.files[0]);
                      if (decodedHash === validationHash) {
                        toast.success('Integrity Verified', '✅ INTEGRITY VERIFIED 100%! The decoded file is a perfect pixel-by-pixel match with your original file.');
                      } else {
                        toast.error('Integrity Check Failed', '❌ INTEGRITY FAILED! The decoded file does not match the original file.');
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
