import React, { useMemo } from 'react';
import { Dna, Sparkles, Activity } from 'lucide-react';

export default function DnaVialPlaceholder({ loading = false, progressStage = 0, stageLabel = '' }) {
  // Generate coordinates for a double helix inside an Erlenmeyer laboratory flask
  const { pathA, pathB, rungs } = useMemo(() => {
    const numRungs = 16;
    const rungsList = [];
    const pointsA = [];
    const pointsB = [];

    for (let i = 0; i <= 36; i++) {
      const t = i / 36; // 0 to 1
      const y = 185 - t * 155; // 185 (bottom) up to 30 (top rim)
      // Angle for ~2 full rotations
      const theta = t * Math.PI * 3.8;
      
      // Calculate half-width of flask at height y
      // Flask neck: Y from 30 to 75 (radius ~12)
      // Flask body: Y from 75 to 190 (radius expands from 12 to 55)
      let maxRadius = 11;
      if (y > 75) {
        maxRadius = 11 + ((y - 75) / 115) * 40;
      }
      
      const r = maxRadius * 0.72; // keep inside glass walls
      const xA = 110 + Math.sin(theta) * r;
      const xB = 110 + Math.sin(theta + Math.PI) * r;
      
      pointsA.push(`${i === 0 ? 'M' : 'L'} ${xA.toFixed(1)} ${y.toFixed(1)}`);
      pointsB.push(`${i === 0 ? 'M' : 'L'} ${xB.toFixed(1)} ${y.toFixed(1)}`);
    }

    // Generate horizontal base pair rungs
    const colors = ['#00ffcc', '#b266ff', '#ff0055', '#00ff66', '#d4af37'];
    for (let i = 1; i <= numRungs; i++) {
      const t = i / (numRungs + 1);
      const y = 180 - t * 145;
      const theta = t * Math.PI * 3.8;
      
      let maxRadius = 11;
      if (y > 75) {
        maxRadius = 11 + ((y - 75) / 115) * 40;
      }
      const r = maxRadius * 0.72;
      const x1 = 110 + Math.sin(theta) * r;
      const x2 = 110 - Math.sin(theta) * r;
      
      rungsList.push({
        id: i,
        x1: x1.toFixed(1),
        y1: y.toFixed(1),
        x2: x2.toFixed(1),
        y2: y.toFixed(1),
        color: colors[i % colors.length],
        depth: Math.cos(theta) // for visual depth
      });
    }

    return {
      pathA: pointsA.join(' '),
      pathB: pointsB.join(' '),
      rungs: rungsList
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem 1rem',
      width: '100%',
      minHeight: '340px',
      position: 'relative',
      userSelect: 'none'
    }}>
      {/* CSS Animations */}
      <style>{`
        @keyframes placeholder-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes placeholder-pulse {
          0%, 100% { opacity: 0.45; filter: drop-shadow(0 0 8px rgba(0, 255, 204, 0.15)); }
          50% { opacity: 0.75; filter: drop-shadow(0 0 16px rgba(0, 255, 204, 0.35)); }
        }
        @keyframes placeholder-spin-glow {
          0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 12px rgba(0, 255, 204, 0.4)); }
          50% { opacity: 1; filter: drop-shadow(0 0 24px rgba(178, 102, 255, 0.6)); }
        }
        @keyframes bubble-rise {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          30% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-110px) scale(1.1); opacity: 0; }
        }
        @keyframes scanline-sweep {
          0% { transform: translateY(-100px); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(120px); opacity: 0; }
        }
        @keyframes badge-pulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Holographic Wireframe Container */}
      <div style={{
        position: 'relative',
        width: '220px',
        height: '240px',
        animation: loading ? 'none' : 'placeholder-float 5s ease-in-out infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg
          viewBox="0 0 220 240"
          width="100%"
          height="100%"
          style={{
            overflow: 'visible',
            animation: loading ? 'placeholder-spin-glow 1.8s ease-in-out infinite' : 'placeholder-pulse 4s ease-in-out infinite',
            transition: 'all 0.5s ease'
          }}
        >
          <defs>
            {/* Glass Cyan Gradient */}
            <linearGradient id="vialGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ffcc" stopOpacity={loading ? "0.8" : "0.4"} />
              <stop offset="50%" stopColor="#00ffcc" stopOpacity={loading ? "0.3" : "0.15"} />
              <stop offset="100%" stopColor="#b266ff" stopOpacity={loading ? "0.7" : "0.35"} />
            </linearGradient>

            {/* Liquid / Pool Gradient at Bottom */}
            <linearGradient id="liquidPool" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#00ffcc" stopOpacity={loading ? "0.25" : "0.1"} />
            </linearGradient>

            {/* Glow filters */}
            <filter id="wireframeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Ambient Radial Glow */}
          <circle
            cx="110"
            cy="140"
            r="65"
            fill="url(#liquidPool)"
            style={{ filter: 'blur(15px)', opacity: loading ? 0.8 : 0.4 }}
          />

          {/* Liquid pool at the base of flask */}
          <path
            d="M 42 175 Q 110 180 178 175 L 186 190 Q 110 205 34 190 Z"
            fill="url(#liquidPool)"
          />

          {/* Floating Data Droplets / Bubbles inside Flask */}
          {[
            { cx: 90, cy: 170, r: 2.5, delay: '0s', duration: '3s' },
            { cx: 125, cy: 160, r: 1.5, delay: '0.8s', duration: '2.5s' },
            { cx: 105, cy: 150, r: 3, delay: '1.5s', duration: '3.5s' },
            { cx: 118, cy: 175, r: 2, delay: '2.2s', duration: '2.8s' }
          ].map((bubble, idx) => (
            <circle
              key={idx}
              cx={bubble.cx}
              cy={bubble.cy}
              r={bubble.r}
              fill="none"
              stroke="#00ffcc"
              strokeWidth="1"
              style={{
                animation: `bubble-rise ${loading ? parseFloat(bubble.duration)*0.6 + 's' : bubble.duration} infinite ease-in`,
                animationDelay: bubble.delay,
                opacity: 0.6
              }}
            />
          ))}

          {/* --- THE DNA DOUBLE HELIX WIREFRAME --- */}
          <g filter={loading ? "url(#wireframeGlow)" : undefined}>
            {/* Base Pair Rungs */}
            {rungs.map((rung) => (
              <g key={rung.id} opacity={loading ? 0.9 : 0.55}>
                <line
                  x1={rung.x1}
                  y1={rung.y1}
                  x2={rung.x2}
                  y2={rung.y2}
                  stroke={rung.color}
                  strokeWidth="1"
                  strokeDasharray={loading ? "none" : "2 1"}
                />
                {/* Left & Right Nucleotide Nodes */}
                <circle cx={rung.x1} cy={rung.y1} r={loading ? "2" : "1.5"} fill={rung.color} />
                <circle cx={rung.x2} cy={rung.y2} r={loading ? "2" : "1.5"} fill="#00ffcc" />
              </g>
            ))}

            {/* Helix Backbone Strand A (Cyan) */}
            <path
              d={pathA}
              fill="none"
              stroke="#00ffcc"
              strokeWidth={loading ? "2.2" : "1.5"}
              strokeLinecap="round"
              opacity={loading ? "1" : "0.65"}
            />

            {/* Helix Backbone Strand B (Purple/Gold) */}
            <path
              d={pathB}
              fill="none"
              stroke={loading ? "#b266ff" : "#d4af37"}
              strokeWidth={loading ? "2.2" : "1.5"}
              strokeLinecap="round"
              opacity={loading ? "0.9" : "0.5"}
            />
          </g>

          {/* --- THE LABORATORY VIAL (ERLENMEYER FLASK) OUTLINE --- */}
          <g stroke="url(#vialGlass)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Top Rim Lip */}
            <ellipse cx="110" cy="25" rx="16" ry="3.5" strokeWidth="2" />
            <path d="M 94 25 L 94 29.5 Q 110 33 126 29.5 L 126 25" />

            {/* Left Neck Wall */}
            <line x1="96" y1="29.5" x2="96" y2="75" />
            {/* Right Neck Wall */}
            <line x1="124" y1="29.5" x2="124" y2="75" />

            {/* Left Body Slope */}
            <line x1="96" y1="75" x2="34" y2="190" />
            {/* Right Body Slope */}
            <line x1="124" y1="75" x2="186" y2="190" />

            {/* Bottom Base Curve */}
            <path d="M 34 190 Q 110 206 186 190" strokeWidth="2.2" />
          </g>

          {/* Glass Specular Reflection Highlight (Left Side) */}
          <path
            d="M 99 35 L 99 72 L 45 175"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.22"
          />

          {/* Measurement Graduations in Base Pairs (bp) on Right Wall */}
          <g stroke="#00ffcc" strokeWidth="1" opacity={loading ? 0.7 : 0.35} fontSize="7.5" fontFamily="monospace" fill="#00ffcc">
            {/* 5 KB mark */}
            <line x1="124" y1="75" x2="132" y2="75" />
            <text x="136" y="77" stroke="none">5 KB</text>

            {/* 1 KB mark */}
            <line x1="140" y1="105" x2="148" y2="105" />
            <text x="152" y="107" stroke="none">1 KB</text>

            {/* 500 bp mark */}
            <line x1="156" y1="135" x2="164" y2="135" />
            <text x="168" y="137" stroke="none">500 bp</text>

            {/* 100 bp mark */}
            <line x1="172" y1="165" x2="180" y2="165" />
            <text x="184" y="167" stroke="none">100 bp</text>
          </g>

          {/* Holographic Crosshairs / Corner Tech Markers */}
          <g stroke="rgba(255,255,255,0.2)" strokeWidth="1">
            <line x1="25" y1="200" x2="33" y2="200" />
            <line x1="25" y1="200" x2="25" y2="192" />
            <line x1="195" y1="200" x2="187" y2="200" />
            <line x1="195" y1="200" x2="195" y2="192" />
          </g>
        </svg>

        {/* Shimmering Scanline overlay when loading */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: '10%',
            width: '80%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--accent-cyan), var(--accent-purple), transparent)',
            boxShadow: '0 0 10px var(--accent-cyan)',
            animation: 'scanline-sweep 2s linear infinite'
          }} />
        )}
      </div>

      {/* Status Typography & Holographic Pill Badge */}
      <div style={{ textAlign: 'center', marginTop: '0.75rem', zIndex: 2 }}>
        {loading ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.5rem 1.1rem',
            background: 'rgba(0, 255, 204, 0.08)',
            border: '1px solid rgba(0, 255, 204, 0.35)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--accent-cyan)',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: '0 0 20px rgba(0, 255, 204, 0.15)',
            letterSpacing: '0.02em',
            animation: 'badge-pulse 1.5s infinite'
          }}>
            <Activity size={16} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
            <span>{stageLabel || 'Synthesizing DNA Sequence...'}</span>
          </div>
        ) : (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.45rem 1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
            letterSpacing: '0.03em',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--accent-cyan)',
              opacity: 0.65,
              display: 'inline-block',
              boxShadow: '0 0 8px var(--accent-cyan)'
            }}></span>
            <span style={{ fontWeight: 500, color: '#e0e0e0' }}>Awaiting File Encoding</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ color: 'var(--accent-gold)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={12} /> Ready for Synthesis
            </span>
          </div>
        )}

        <p style={{
          fontSize: '0.78rem',
          color: loading ? 'var(--text-secondary)' : 'rgba(255, 255, 255, 0.35)',
          marginTop: '0.6rem',
          maxWidth: '280px',
          lineHeight: 1.5
        }}>
          {loading 
            ? 'Translating digital bits into a physical biological sequence...'
            : 'Select encryption & biological options on the left, then initiate encoding to view the sequence.'}
        </p>
      </div>
    </div>
  );
}
