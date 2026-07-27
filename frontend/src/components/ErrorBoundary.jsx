import { Component } from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
    console.warn("ErrorBoundary caught an unexpected component error.");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '2rem', textAlign: 'center', padding: '2rem' }}>
          <AlertTriangle size={64} color="var(--accent-red, #ff4444)" />
          <div>
            <h1 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Something went wrong.</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
              An unexpected error occurred in this component. Our team has been notified.
            </p>
            <Link to="/" className="btn btn-outline-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Home size={18} /> Return Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
