import { useState, useEffect } from 'react';
import { UploadCloud, Shield, Dna, CheckCircle2, Activity, Play, Pause, RotateCcw, Sparkles, Cpu, Layers, ArrowRight } from 'lucide-react';
import { formatWeight } from '../utils/fileUtils';

const SAMPLE_DNA_STREAM = ['A', 'T', 'C', 'G', 'G', 'A', 'C', 'T', 'A', 'A', 'G', 'C', 'T', 'T', 'G', 'A', 'C', 'G', 'T', 'A', 'C', 'G', 'A', 'T'];
const BASE_COLORS = {
  'A': { text: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.15)', border: 'rgba(255, 107, 107, 0.4)' },
  'T': { text: '#00ffcc', bg: 'rgba(0, 255, 204, 0.15)', border: 'rgba(0, 255, 204, 0.4)' },
  'C': { text: '#ff007f', bg: 'rgba(255, 0, 127, 0.15)', border: 'rgba(255, 0, 127, 0.4)' },
  'G': { text: '#ffd166', bg: 'rgba(255, 209, 102, 0.15)', border: 'rgba(255, 209, 102, 0.4)' }
};

export default function VisualPipeline({ file, progressStage = 0, isDemo = false, onClose }) {
  const [activeStep, setActiveStep] = useState(isDemo ? 1 : Math.max(1, Math.min(3, progressStage || 1)));
  const [isPlaying, setIsPlaying] = useState(isDemo);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [binaryStream, setBinaryStream] = useState('01011001');
  const [dnaIndex, setDnaIndex] = useState(0);

  const displayFile = file || { name: 'invoice.pdf', size: 1258291 };
  const formattedSize = displayFile.size ? (displayFile.size / (1024 * 1024)).toFixed(2) + ' MB' : '1.20 MB';

  // Sync active step with prop when not in standalone demo mode
  useEffect(() => {
    if (!isDemo && progressStage > 0) {
      if (progressStage === 1) setActiveStep(1);
      else if (progressStage === 2 || progressStage === 3) setActiveStep(2);
      else if (progressStage >= 4) setActiveStep(3);
    }
  }, [progressStage, isDemo]);

  // Demo auto-cycling simulation
  useEffect(() => {
    let timer;
    if (isDemo && isPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev) => (prev % 3) + 1);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isDemo, isPlaying]);

  // Step 1 upload progress animation
  useEffect(() => {
    let interval;
    if (activeStep === 1) {
      setUploadPercent(0);
      interval = setInterval(() => {
        setUploadPercent((prev) => {
          if (prev >= 100) return 100;
          return prev + 5;
        });
      }, 80);
    } else {
      setUploadPercent(100);
    }
    return () => clearInterval(interval);
  }, [activeStep]);

  // Step 3 binary & DNA animation
  useEffect(() => {
    let interval;
    if (activeStep === 3) {
      interval = setInterval(() => {
        const randomBin = Array.from({ length: 8 }, () => (Math.random() > 0.5 ? '1' : '0')).join('');
        setBinaryStream(randomBin);
        setDnaIndex((prev) => (prev + 1) % SAMPLE_DNA_STREAM.length);
      }, 250);
    }
    return () => clearInterval(interval);
  }, [activeStep]);

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13, 13, 18, 0.95) 0%, rgba(20, 25, 35, 0.95) 100%)',
      border: '1px solid rgba(0, 255, 204, 0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.75rem',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 255, 204, 0.08)',
      position: 'relative',
      overflow: 'hidden',
      marginBottom: '1.5rem',
      transition: 'all 0.3s ease'
    }}>
      {/* Decorative background glow */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(0, 255, 204, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '280px', flex: '1 1 auto' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(0, 255, 204, 0.15)',
            border: '1px solid var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            flexShrink: 0
          }}>
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.15rem', margin: '0 0 0.2rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Digital-to-Biological Visual Pipeline
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Real-time conceptual translation: <strong style={{ color: 'var(--accent-cyan)' }}>Digital Bits</strong> → <strong style={{ color: 'var(--accent-green)' }}>Liquid Synthetic DNA</strong>
            </div>
          </div>
        </div>

        {/* Controls if Demo Mode */}
        {isDemo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 255, 204, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: isPlaying ? '#aaa' : 'var(--accent-cyan)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Auto-Cycle ON' : 'Paused'}
            </button>
            <button
              type="button"
              onClick={() => setActiveStep((prev) => (prev % 3) + 1)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              title="Next Step"
            >
              <RotateCcw size={14} /> Next Step
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'rgba(255, 80, 80, 0.1)',
                  border: '1px solid rgba(255, 80, 80, 0.25)',
                  color: '#ff6b6b',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  marginLeft: '0.25rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
                title="Close"
              >
                ✕ Close
              </button>
            )}
          </div>
        )}
      </div>

      {/* Step Indicators Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { id: 1, title: 'Step 1: Upload', sub: `Uploading ${displayFile.name} (${formattedSize})`, icon: UploadCloud },
          { id: 2, title: 'Step 2: Error Correction', sub: 'Applying Fountain & Reed-Solomon ECC', icon: Shield },
          { id: 3, title: 'Step 3: DNA Synthesis', sub: 'Synthesizing Bits (0101) to DNA (ATCG)', icon: Dna },
        ].map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          const isDone = activeStep > step.id;

          return (
            <div
              key={step.id}
              onClick={() => isDemo && setActiveStep(step.id)}
              style={{
                background: isActive ? 'rgba(0, 255, 204, 0.08)' : isDone ? 'rgba(0, 255, 102, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isActive ? 'var(--accent-cyan)' : isDone ? 'rgba(0, 255, 102, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '12px',
                padding: '1rem',
                cursor: isDemo ? 'pointer' : 'default',
                transition: 'all 0.25s ease',
                position: 'relative',
                boxShadow: isActive ? '0 0 15px rgba(0, 255, 204, 0.15)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: isActive ? 'var(--accent-cyan)' : isDone ? '#00ff66' : 'rgba(255, 255, 255, 0.1)',
                  color: (isActive || isDone) ? '#000' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}>
                  {isDone ? <CheckCircle2 size={15} /> : step.id}
                </div>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: isActive ? 'var(--accent-cyan)' : isDone ? '#00ff66' : '#bbb' }}>
                  {step.title}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginTop: '0.25rem' }}>
                {step.sub}
              </div>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '10%',
                  right: '10%',
                  height: '2px',
                  background: 'var(--accent-cyan)',
                  boxShadow: '0 0 8px var(--accent-cyan)'
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Main Dynamic Stage Display Area */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '1.5rem',
        minHeight: '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* STEP 1: UPLOADING */}
        {activeStep === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UploadCloud size={18} color="var(--accent-cyan)" />
                Uploading <code style={{ color: 'var(--accent-cyan)', background: 'rgba(0,255,204,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{displayFile.name}</code> ({formattedSize})
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{uploadPercent}%</span>
            </div>
            
            {/* Progress bar */}
            <div style={{ width: '100%', height: '12px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden', position: 'relative', marginBottom: '1rem' }}>
              <div style={{
                width: `${uploadPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0088ff 0%, #00ffcc 100%)',
                borderRadius: '6px',
                transition: 'width 0.1s linear',
                boxShadow: '0 0 12px rgba(0, 255, 204, 0.6)'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>Transfer protocol: Secure SSL / Chunked Stream</span>
              <span>Speed: 142.8 MB/s (AES-256 Pre-Encryption Active)</span>
            </div>
          </div>
        )}

        {/* STEP 2: ERROR CORRECTION */}
        {activeStep === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="#00ff66" />
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                Applying Fountain Error Correction & Reed-Solomon Parity
              </span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(0, 255, 102, 0.15)', color: '#00ff66', padding: '2px 8px', borderRadius: '12px', marginLeft: 'auto', fontWeight: 600 }}>
                1.5x Redundancy Protection
              </span>
            </div>

            {/* Visual Block Matrix */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', padding: '1.5rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', margin: '1.25rem 0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.6rem', fontWeight: 600 }}>Original Data Blocks</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Blk 1', 'Blk 2', 'Blk 3', 'Blk 4'].map((blk, i) => (
                    <div key={i} style={{
                      background: 'rgba(0, 204, 255, 0.15)',
                      border: '1px solid #00ccff',
                      color: '#00ccff',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      {blk}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center' }}>
                <ArrowRight size={28} className="animate-pulse" />
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.6rem', fontWeight: 600 }}>Synthesized Parity Droplets (LT Code)</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Drop α', 'Drop β', 'Drop γ', 'Drop δ', 'Drop ε', 'Drop ζ'].map((drop, i) => (
                    <div key={i} style={{
                      background: i > 3 ? 'rgba(255, 179, 0, 0.15)' : 'rgba(0, 255, 102, 0.15)',
                      border: `1px solid ${i > 3 ? '#ffb300' : '#00ff66'}`,
                      color: i > 3 ? '#ffb300' : '#00ff66',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      boxShadow: i > 3 ? '0 0 8px rgba(255, 179, 0, 0.2)' : 'none'
                    }}>
                      {drop}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: '#aaa' }}>
              ✨ <strong style={{ color: '#fff' }}>Rateless Erasure Coding:</strong> Your file can be completely restored even if any <strong style={{ color: '#ffb300' }}>33%</strong> of DNA droplets are physically lost!
            </div>
          </div>
        )}

        {/* STEP 3: SYNTHESIZING TO DNA */}
        {activeStep === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Dna size={18} color="var(--accent-pink)" className="animate-spin" />
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                Synthesizing to DNA: Binary Bits (<code style={{ color: '#00ffcc' }}>010110</code>) → Double Helix (<code style={{ color: '#ff007f' }}>A-T-C-G</code>)
              </span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255, 0, 127, 0.15)', color: '#ff007f', padding: '2px 8px', borderRadius: '12px', marginLeft: 'auto', fontWeight: 600 }}>
                Rate: 10,000 bp/sec
              </span>
            </div>

            {/* Binary to DNA Stream Animation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', margin: '1.25rem 0' }}>
              {/* Binary source */}
              <div style={{ textAlign: 'center', flex: '1 1 200px', minWidth: '180px' }}>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Binary Bits</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 'bold', color: '#00ffcc', letterSpacing: '3px', textShadow: '0 0 10px rgba(0,255,204,0.5)' }}>
                  {binaryStream}
                </div>
              </div>

              {/* Converter Engine Icon */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #ff007f 0%, #7928ca 100%)', padding: '0.7rem', borderRadius: '50%', marginBottom: '0.4rem', boxShadow: '0 0 20px rgba(255,0,127,0.5)' }}>
                  <Cpu size={24} color="#fff" />
                </div>
                <span style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 700, letterSpacing: '1px' }}>BASE-4 ENCODER</span>
              </div>

              {/* DNA String Output */}
              <div style={{ textAlign: 'center', flex: '1.5 1 240px', minWidth: '220px' }}>
                <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Synthesized DNA Strand</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {Array.from({ length: 10 }).map((_, i) => {
                    const base = SAMPLE_DNA_STREAM[(dnaIndex + i) % SAMPLE_DNA_STREAM.length];
                    const style = BASE_COLORS[base];
                    return (
                      <span key={i} style={{
                        display: 'inline-block',
                        width: '32px',
                        height: '36px',
                        lineHeight: '34px',
                        textAlign: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        fontFamily: 'monospace',
                        color: style.text,
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        borderRadius: '8px',
                        boxShadow: `0 0 10px ${style.bg}`,
                        transition: 'all 0.2s ease'
                      }}>
                        {base}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#aaa' }}>
              <span>🧬 Oligonucleotide Pool: Stable at ambient room temperature</span>
              <span>Encapsulation: Glass-sealed micro-vial</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#777' }}>
        <span>HelixVault v2.4 — Biological Data Engine</span>
        <span>Zero Data Degradation Guaranteed • Millennial Lifespan</span>
      </div>
    </div>
  );
}
