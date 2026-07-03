import { useState } from 'react';
import EncoderView from '../components/EncoderView';
import DecoderView from '../components/DecoderView';

function EncoderDecoder() {
  const [mode, setMode] = useState('encode'); // 'encode' or 'decode'

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Data {'<>'} DNA <span style={{ color: 'var(--text-secondary)' }}>Engine</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: 'var(--radius-full)' }}>
          <button 
            type="button"
            className={`btn ${mode === 'encode' ? 'btn-outline-gold' : ''}`}
            onClick={() => setMode('encode')}
            style={mode === 'encode' ? { background: 'var(--bg-black)' } : { color: 'var(--text-secondary)', border: '1px solid transparent' }}
          >
            Encode to DNA
          </button>
          <button 
            type="button"
            className={`btn ${mode === 'decode' ? 'btn-outline-gold' : ''}`}
            onClick={() => setMode('decode')}
            style={mode === 'decode' ? { background: 'var(--bg-black)' } : { color: 'var(--text-secondary)', border: '1px solid transparent' }}
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
