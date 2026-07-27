import { useState } from 'react';
import { ShieldCheck, AlertTriangle, X, Activity, Dna, CheckCircle2, Sparkles, RefreshCw, Cpu } from 'lucide-react';

export function HealthBadge({ filename = "Archive Payload", onClick, label = "Status: Structurally Stable", size = "normal" }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? 'rgba(0, 255, 102, 0.25)' : 'rgba(0, 255, 102, 0.12)',
        border: '1px solid #00ff66',
        color: '#00ff66',
        padding: size === 'small' ? '0.25rem 0.6rem' : '0.45rem 0.85rem',
        borderRadius: '20px',
        fontSize: size === 'small' ? '0.75rem' : '0.85rem',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: isHovered ? '0 0 15px rgba(0, 255, 102, 0.4)' : '0 0 8px rgba(0, 255, 102, 0.15)',
        transition: 'all 0.25s ease',
        whiteSpace: 'nowrap'
      }}
      title="Click to view DNA structural health and Fountain Code error correction diagnostics"
    >
      <span style={{
        width: size === 'small' ? '6px' : '8px',
        height: size === 'small' ? '6px' : '8px',
        borderRadius: '50%',
        background: '#00ff66',
        boxShadow: '0 0 6px #00ff66',
        display: 'inline-block'
      }} className="animate-pulse" />
      <ShieldCheck size={size === 'small' ? 14 : 16} />
      {label}
    </button>
  );
}

export default function HealthStatusModal({ isOpen, onClose, fileItem }) {
  const [degradationPercent, setDegradationPercent] = useState(15);
  const [imgSrc, setImgSrc] = useState('/assets/mutation.gif');

  if (!isOpen) return null;

  const displayFile = fileItem?.filename || "enc_genome_archive_2026.bin";
  const isProtected = degradationPercent < 30;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, rgba(13, 13, 18, 0.98) 0%, rgba(20, 25, 35, 0.98) 100%)',
        border: '1px solid #00ff66',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '650px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 255, 102, 0.15)',
        position: 'relative',
        padding: '2rem'
      }}>
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#aaa',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title="Close Dialog"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(0, 255, 102, 0.15)',
            border: '1px solid #00ff66',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00ff66'
          }}>
            <ShieldCheck size={26} className="animate-pulse" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.4rem', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              DNA Health & Decay Status
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Diagnostic Report for <code style={{ color: '#00ff66', background: 'rgba(0,255,102,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{displayFile}</code>
            </span>
          </div>
        </div>

        {/* Primary User Quote & Explanation Box */}
        <div style={{
          background: 'rgba(0, 255, 102, 0.06)',
          border: '1px solid rgba(0, 255, 102, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.85rem'
        }}>
          <Sparkles size={24} color="#00ff66" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '1rem', color: '#00ff66', margin: '0 0 0.4rem 0' }}>
              Structural Protection Guarantee
            </h4>
            <p style={{ fontSize: '0.95rem', color: '#fff', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
              “Fountain codes are actively protecting this file. Even if 20% of the DNA strand degrades physically over time, your file will still open perfectly.”
            </p>
          </div>
        </div>

        {/* Mutation GIF Diagnostic Viewer */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} color="var(--accent-cyan)" /> Live Molecular Degradation Simulation
            </span>
            <span style={{ fontSize: '0.75rem', color: '#00ffcc', background: 'rgba(0,255,204,0.1)', padding: '2px 8px', borderRadius: '10px' }}>
              Reed-Solomon + LT Fountain Active
            </span>
          </div>

          <div style={{
            background: '#000',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 0 30px rgba(0,255,102,0.1)'
          }}>
            <img
              src={imgSrc}
              onError={() => {
                if (imgSrc === '/assets/mutation.gif') setImgSrc('/mutation.gif');
                else setImgSrc('https://raw.githubusercontent.com/niti5999/helixvault/main/assets/mutation.gif');
              }}
              alt="DNA Mutation & Erasure Recovery Animation"
              style={{ width: '100%', height: '220px', objectFit: 'cover', opacity: 0.9 }}
            />
            
            {/* Overlay Status Badge on Image */}
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem'
            }}>
              <span style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Dna size={16} color="#ff007f" /> Strand Integrity: <strong style={{ color: '#00ff66' }}>Structurally Stable</strong>
              </span>
              <span style={{ color: '#00ffcc', fontWeight: 700 }}>
                100% Decodable
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Stress-Test Slider */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              Simulated Physical Strand Degradation:
            </span>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 800,
              color: degradationPercent > 25 ? '#ff6b6b' : degradationPercent > 15 ? '#ffb300' : '#00ff66'
            }}>
              {degradationPercent}% Physical Loss
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="35"
            step="1"
            value={degradationPercent}
            onChange={(e) => setDegradationPercent(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              height: '8px',
              background: 'linear-gradient(90deg, #00ff66 0%, #ffb300 65%, #ff6b6b 100%)',
              borderRadius: '4px',
              outline: 'none',
              cursor: 'pointer',
              marginBottom: '1rem',
              accentColor: degradationPercent > 25 ? '#ff6b6b' : '#00ff66'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#aaa' }}>Decoded File Integrity:</span>
            {isProtected ? (
              <span style={{ color: '#00ff66', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> 100% PERFECT (0 Bytes Lost)
              </span>
            ) : (
              <span style={{ color: '#ff6b6b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={16} /> Parity Limit Exceeded (&gt;30% loss)
              </span>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            className="btn"
            onClick={onClose}
            style={{
              background: '#00ff66',
              color: '#000',
              fontWeight: 700,
              padding: '0.65rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 255, 102, 0.4)'
            }}
          >
            Acknowledge Health Report
          </button>
        </div>
      </div>
    </div>
  );
}
