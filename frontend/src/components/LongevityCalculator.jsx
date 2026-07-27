import { useState } from 'react';
import { HardDrive, Disc, Shield, Archive, Dna, Clock, AlertTriangle, CheckCircle2, Sparkles, Flame, Snowflake } from 'lucide-react';

const TIMELINES = [
  {
    years: 5,
    label: '5 Years',
    medium: 'Standard HDD / Consumer SSD',
    icon: HardDrive,
    color: '#ff6b6b',
    iconBg: 'rgba(255, 107, 107, 0.15)',
    borderColor: 'rgba(255, 107, 107, 0.4)',
    survival: 'Vulnerable',
    recopy: 'Every 3–5 years',
    energy: 'High (Continuous active power needed)',
    desc: 'Standard hard drives suffer from mechanical failure and magnetic degradation within half a decade.'
  },
  {
    years: 25,
    label: '25 Years',
    medium: 'Enterprise Magnetic Tape (LTO-9)',
    icon: Disc,
    color: '#ffb300',
    iconBg: 'rgba(255, 179, 0, 0.15)',
    borderColor: 'rgba(255, 179, 0, 0.4)',
    survival: 'Moderate',
    recopy: 'Every 10 years',
    energy: 'Medium (Requires climate-controlled library)',
    desc: 'Magnetic tapes require rigorous temperature control and periodic rewinding/migrating to prevent sticking.'
  },
  {
    years: 50,
    label: '50 Years',
    medium: 'M-Disc / Archival Optical Media',
    icon: Disc,
    color: '#00ccff',
    iconBg: 'rgba(0, 204, 255, 0.15)',
    borderColor: 'rgba(0, 204, 255, 0.4)',
    survival: 'Good',
    recopy: 'Every 30–40 years',
    energy: 'Low (Dry physical storage)',
    desc: 'M-Discs use inorganic rock-like layers resistant to light and heat, but optical drives are becoming obsolete.'
  },
  {
    years: 100,
    label: '100 Years',
    medium: 'Underground Microfiche / Salt Vaults',
    icon: Archive,
    color: '#b28a5d',
    iconBg: 'rgba(178, 138, 93, 0.15)',
    borderColor: 'rgba(178, 138, 93, 0.4)',
    survival: 'Very Good',
    recopy: 'Manual inspection needed',
    energy: 'Zero (Passive underground vault)',
    desc: 'Physical analog storage survives well but has extremely low data density and cannot store complex software or databases.'
  },
  {
    years: 1000,
    label: '1,000+ Years',
    medium: 'Standard Ambient Synthetic DNA',
    icon: Dna,
    color: '#00ff66',
    iconBg: 'rgba(0, 255, 102, 0.15)',
    borderColor: 'rgba(0, 255, 102, 0.4)',
    survival: 'Indestructible',
    recopy: 'NEVER (Zero migration)',
    energy: 'ZERO (Ambient room temp / Cold storage)',
    isTimeCapsule: true,
    desc: 'Your file will survive the collapse of modern hardware on standard ambient synthetic DNA.'
  },
  {
    years: 10000,
    label: '10,000+ Years',
    medium: 'Silica-Encapsulated Fossil DNA',
    icon: Sparkles,
    color: '#ff007f',
    iconBg: 'rgba(255, 0, 127, 0.15)',
    borderColor: 'rgba(255, 0, 127, 0.4)',
    survival: 'Geological Permanence',
    recopy: 'NEVER (Zero migration)',
    energy: 'ZERO (Survives extreme temperatures)',
    isTimeCapsule: true,
    desc: 'Your file will survive the collapse of modern hardware on standard ambient synthetic DNA.'
  },
  {
    years: 500000,
    label: '500,000+ Years',
    medium: 'Deep-Earth Cryo-Genomic Archive',
    icon: Clock,
    color: '#b266ff',
    iconBg: 'rgba(178, 102, 255, 0.15)',
    borderColor: 'rgba(178, 102, 255, 0.4)',
    survival: 'Cosmic Permanence',
    recopy: 'NEVER (Zero migration)',
    energy: 'ZERO (Permafrost / Lunar storage ready)',
    isTimeCapsule: true,
    desc: 'Your file will survive the collapse of modern hardware on standard ambient synthetic DNA.'
  }
];

export default function LongevityCalculator() {
  const [sliderIndex, setSliderIndex] = useState(4); // Default to 1,000 years
  const current = TIMELINES[sliderIndex];
  const IconComponent = current.icon;

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(13, 13, 18, 0.95) 0%, rgba(20, 25, 35, 0.95) 100%)',
      border: `1px solid ${current.borderColor}`,
      borderRadius: 'var(--radius-lg)',
      padding: '2rem',
      boxShadow: `0 12px 40px rgba(0, 0, 0, 0.6), 0 0 30px ${current.iconBg}`,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* Background glowing orb */}
      <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '240px',
        height: '240px',
        background: `radial-gradient(circle, ${current.iconBg} 0%, transparent 70%)`,
        pointerEvents: 'none',
        transition: 'all 0.5s ease'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: current.color }}>
            Time-Capsule & Longevity Calculator
          </span>
          <h3 style={{ fontSize: '1.6rem', margin: '0.25rem 0 0 0', color: '#fff' }}>
            How long do you want to secure this data?
          </h3>
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid ${current.borderColor}`,
          padding: '0.6rem 1.25rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <Clock size={20} color={current.color} className="animate-pulse" />
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: current.color, fontFamily: 'Outfit, sans-serif' }}>
            {current.label}
          </span>
        </div>
      </div>

      {/* Slider Control */}
      <div style={{ marginBottom: '2.5rem', padding: '0 0.5rem' }}>
        <input
          type="range"
          min="0"
          max={TIMELINES.length - 1}
          step="1"
          value={sliderIndex}
          onChange={(e) => setSliderIndex(parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            height: '8px',
            background: 'linear-gradient(90deg, #ff6b6b 0%, #00ccff 50%, #00ff66 75%, #b266ff 100%)',
            borderRadius: '4px',
            outline: 'none',
            cursor: 'pointer',
            accentColor: current.color
          }}
          aria-label="Longevity Slider"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {TIMELINES.map((t, idx) => (
            <span
              key={idx}
              onClick={() => setSliderIndex(idx)}
              style={{
                cursor: 'pointer',
                fontWeight: idx === sliderIndex ? 800 : 400,
                color: idx === sliderIndex ? current.color : '#777',
                transition: 'color 0.2s',
                transform: idx === sliderIndex ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Medium Showcase Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${current.borderColor}`,
        borderRadius: '16px',
        padding: '1.75rem',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '1.5rem',
        alignItems: 'center',
        marginBottom: '1.5rem',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)'
      }}>
        {/* Big Graphic Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          background: current.iconBg,
          border: `2px solid ${current.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 25px ${current.iconBg}`,
          transition: 'all 0.3s ease'
        }}>
          <IconComponent size={44} color={current.color} className={current.isTimeCapsule ? 'animate-bounce' : ''} />
        </div>

        {/* Medium Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h4 style={{ fontSize: '1.35rem', margin: 0, color: '#fff' }}>
              {current.medium}
            </h4>
            {current.isTimeCapsule && (
              <span style={{
                background: 'rgba(0, 255, 102, 0.2)',
                border: '1px solid #00ff66',
                color: '#00ff66',
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: '20px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 0 10px rgba(0, 255, 102, 0.3)'
              }}>
                <Sparkles size={12} /> Millennium Capsule Certified
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.95rem', color: current.isTimeCapsule ? '#fff' : 'var(--text-secondary)', lineHeight: '1.6', margin: 0, fontStyle: current.isTimeCapsule ? 'italic' : 'normal' }}>
            {current.isTimeCapsule ? (
              <strong style={{ color: current.color }}>“{current.desc}”</strong>
            ) : (
              current.desc
            )}
          </p>
        </div>
      </div>

      {/* Comparison Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
            Physical Survival Rating
          </span>
          <strong style={{ color: current.color, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {current.isTimeCapsule ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {current.survival}
          </strong>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
            Data Re-copy Frequency
          </span>
          <strong style={{ color: current.isTimeCapsule ? '#00ff66' : '#ffb300', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {current.recopy}
          </strong>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
            Energy Maintenance
          </span>
          <strong style={{ color: current.isTimeCapsule ? '#00ffcc' : '#ff6b6b', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {current.isTimeCapsule ? <Snowflake size={16} /> : <Flame size={16} />}
            {current.energy}
          </strong>
        </div>
      </div>
    </div>
  );
}
