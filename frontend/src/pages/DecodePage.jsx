import DecoderView from '../components/DecoderView';

function DecodePage() {
  return (
    <div className="container" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.2rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          Data <span style={{ color: 'var(--accent-purple)' }}>Decoder</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Reconstruct digital files from biological FASTA / GenBank sequencing data with parity error correction and healing.
        </p>
      </div>
      <DecoderView />
    </div>
  );
}

export default DecodePage;
