import { useState } from 'react';
import EncoderView from '../components/EncoderView';
import DecoderView from '../components/DecoderView';

function EncoderDecoder() {
  const [mode, setMode] = useState('encode'); // 'encode' or 'decode'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2><span className="text-gradient">Data {'<>'} DNA</span> Converter</h2>
        <div style={{ display: 'flex', gap: '1rem', background: 'var(--glass-bg)', padding: '0.5rem', borderRadius: 'var(--radius-full)' }}>
          <button 
            type="button"
            className={`btn ${mode === 'encode' ? 'btn-primary' : ''}`}
            onClick={() => setMode('encode')}
            style={{ border: 'none' }}
          >
            Encode to DNA
          </button>
          <button 
            type="button"
            className={`btn ${mode === 'decode' ? 'btn-primary' : ''}`}
            onClick={() => setMode('decode')}
            style={{ border: 'none' }}
          >
            Decode to Data
          </button>
        </div>
      </div>

      {mode === 'encode' ? <EncoderView /> : <DecoderView />}
    </div>
  );
}

export default EncoderDecoder;
