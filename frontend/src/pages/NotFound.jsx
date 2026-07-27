import { Home, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '2rem', textAlign: 'center', padding: '2rem' }}>
      <AlertCircle size={64} color="var(--accent-purple, #b14dff)" />
      <div>
        <h1 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '3rem' }}>404</h1>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-outline-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Home size={18} /> Return Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
