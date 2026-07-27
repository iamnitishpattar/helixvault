import { useState } from 'react';
import { Droplet, Database, Music, Film, BookOpen, Layers, Sparkles, Activity, Check } from 'lucide-react';

const PRESETS = [
  {
    id: 'albums',
    label: '20,000 Music Albums (10 GB)',
    bytes: 10 * 1024 * 1024 * 1024,
    microliters: 0.05,
    icon: Music,
    fillPercent: 12,
    color: '#00ffcc',
    quote: 'Your current archive pool takes up 0.05 microliters of fluid. You can fit 20,000 more of your music albums into this single physical droplet.'
  },
  {
    id: 'movies',
    label: '4K Movie Vault (1 TB)',
    bytes: 1024 * 1024 * 1024 * 1024,
    microliters: 5.0,
    icon: Film,
    fillPercent: 35,
    color: '#ff007f',
    quote: 'An entire 1,000-movie 4K Blu-ray library compressed into a fluid droplet smaller than a grain of sand.'
  },
  {
    id: 'wikipedia',
    label: 'Wikipedia Offline + Books (100 TB)',
    bytes: 100 * 1024 * 1024 * 1024 * 1024,
    microliters: 500.0,
    icon: BookOpen,
    fillPercent: 65,
    color: '#00ff66',
    quote: 'The sum of all human written knowledge suspended in half a milliliter of stable synthetic oligonucleotide fluid.'
  },
  {
    id: 'enterprise',
    label: 'Global Enterprise Archive (10 PB)',
    bytes: 10 * 1024 * 1024 * 1024 * 1024 * 1024,
    microliters: 50000.0, // 50 mL
    icon: Database,
    fillPercent: 92,
    color: '#b266ff',
    quote: '10 Petabytes of enterprise cloud data centers replaced by a single standard 50 mL laboratory glass tube.'
  }
];

export default function PhysicalStorageSimulator({ userBytes = 0 }) {
  const [selectedId, setSelectedId] = useState('albums');
  const current = PRESETS.find(p => p.id === selectedId) || PRESETS[0];

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13, 13, 18, 0.95) 0%, rgba(20, 25, 35, 0.95) 100%)',
      border: '1px solid rgba(0, 255, 204, 0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: '2rem',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 255, 204, 0.08)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative ambient glow */}
      <div style={{
        position: 'absolute',
        bottom: '-50px',
        left: '-50px',
        width: '200px',
        height: '200px',
        background: `radial-gradient(circle, ${current.color}15 0%, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'background 0.5s ease'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-cyan)' }}>
            Physical Storage Container Simulator
          </span>
          <h3 style={{ fontSize: '1.6rem', margin: '0.25rem 0 0 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Where is my data physically living?
          </h3>
        </div>

        <div style={{
          background: 'rgba(0, 255, 204, 0.1)',
          border: '1px solid var(--accent-cyan)',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          color: 'var(--accent-cyan)',
          fontSize: '0.8rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 0 15px rgba(0, 255, 204, 0.2)'
        }}>
          <Droplet size={16} className="animate-bounce" /> DNA Density: 1 EB / mm³
        </div>
      </div>

      {/* Preset Selector Pill Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {PRESETS.map(preset => {
          const Icon = preset.icon;
          const isSelected = preset.id === selectedId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedId(preset.id)}
              style={{
                background: isSelected ? `${preset.color}20` : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${isSelected ? preset.color : 'rgba(255, 255, 255, 0.1)'}`,
                color: isSelected ? '#fff' : '#aaa',
                padding: '0.6rem 1rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 0 15px ${preset.color}30` : 'none'
              }}
            >
              <Icon size={16} color={isSelected ? preset.color : '#777'} />
              {preset.label}
              {isSelected && <Check size={14} color={preset.color} />}
            </button>
          );
        })}
      </div>

      {/* Simulator Visualizer Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 1fr) 2fr',
        gap: '2.5rem',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.4)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Left: Graphic Vial / Droplet */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'relative',
            width: '100px',
            height: '180px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '3px solid rgba(255, 255, 255, 0.25)',
            borderTop: 'none',
            borderRadius: '0 0 50px 50px',
            overflow: 'hidden',
            boxShadow: `0 15px 35px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,255,255,0.05), 0 0 30px ${current.color}20`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}>
            {/* Vial cap lines */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderBottom: '2px solid rgba(255, 255, 255, 0.3)'
            }} />
            
            {/* Measurement tick marks */}
            {[20, 40, 60, 80].map((mark, i) => (
              <div key={i} style={{
                position: 'absolute',
                bottom: `${mark}%`,
                right: 0,
                width: '15px',
                height: '1px',
                background: 'rgba(255, 255, 255, 0.3)'
              }} />
            ))}

            {/* Glowing Liquid Animation Fill */}
            <div style={{
              height: `${current.fillPercent}%`,
              width: '100%',
              background: `linear-gradient(0deg, ${current.color} 0%, ${current.color}80 100%)`,
              boxShadow: `0 0 25px ${current.color}`,
              transition: 'height 0.6s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s ease',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Bubbles in liquid */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'rgba(255, 255, 255, 0.6)',
                filter: 'blur(1px)'
              }} />
              <Droplet size={24} color="#000" style={{ opacity: 0.6 }} className="animate-pulse" />
            </div>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: current.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Droplet size={14} /> {current.microliters} µL Volume
            </span>
            <span style={{ fontSize: '0.7rem', color: '#777' }}>Micro-Vial Container #4A</span>
          </div>
        </div>

        {/* Right: Metric Explanation & Callout */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: `${current.color}20`,
              border: `1px solid ${current.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: current.color
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.4rem', margin: 0, color: '#fff' }}>
                {current.label}
              </h4>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Physical Archive Pool Equivalent
              </span>
            </div>
          </div>

          {/* User-friendly quote box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderLeft: `4px solid ${current.color}`,
            padding: '1.25rem',
            borderRadius: '0 12px 12px 0',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <p style={{ fontSize: '1.05rem', color: '#fff', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
              “{current.quote}”
            </p>
          </div>

          {/* Quick comparison specs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Physical Dimensions</span>
              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Micro-droplet (~0.5mm sphere)</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#888', display: 'block' }}>Traditional Storage Equivalent</span>
              <strong style={{ color: current.color, fontSize: '0.9rem' }}>{Math.round(current.bytes / (1024 * 1024 * 1024))} GB of magnetic flash</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
