import EncoderView from '../components/EncoderView';

function EncodePage() {
  return (
    <div className="container" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          DNA <span style={{ color: 'var(--accent-cyan)' }}>Encoder</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Transform digital files (PDF, MP4, ZIP, etc.) into high-density synthetic biological oligonucleotides with error correction.
        </p>
      </div>
      <EncoderView />
    </div>
  );
}

export default EncodePage;
