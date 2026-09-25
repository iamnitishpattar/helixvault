import { Home, Dna, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '2rem' }}>
      <div style={{ position: 'relative' }}>
        <Dna size={120} color="var(--accent-cyan)" style={{ opacity: 0.15, animation: 'pulse 4s infinite' }} />
        <AlertTriangle size={48} color="var(--accent-gold)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      </div>
      <div>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '4rem', letterSpacing: '0.05em' }}>404</h1>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sequence Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
          We searched the entire genome, but the sequence you are looking for has either mutated or been deleted.
        </p>
        <Link to="/" className="btn btn-outline-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Home size={18} /> Return to Base Pairs
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
