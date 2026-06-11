import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Database, Dna, LayoutDashboard, Search, LogOut, Mail, Phone, AtSign } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import EncoderDecoder from './pages/EncoderDecoder';
import BioDatabase from './pages/BioDatabase';
import Vault from './pages/Vault';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './context/AuthContext';

function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Don't show nav on login/register pages
  if (['/login', '/register'].includes(location.pathname)) {
    return null;
  }
  
  return (
    <nav>
      <div className="flex-center" style={{ gap: '1rem' }}>
        <Dna color="var(--accent-cyan)" size={32} className="animate-float" />
        <h2 className="text-gradient">HelixVault</h2>
      </div>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <div className="flex-center" style={{ gap: '0.5rem' }}>
            <LayoutDashboard size={18} />
            Dashboard
          </div>
        </Link>
        <Link to="/encode" className={location.pathname === '/encode' ? 'active' : ''}>
          <div className="flex-center" style={{ gap: '0.5rem' }}>
            <Database size={18} />
            Encoder / Decoder
          </div>
        </Link>
        <Link to="/bio" className={location.pathname === '/bio' ? 'active' : ''}>
          <div className="flex-center" style={{ gap: '0.5rem' }}>
            <Search size={18} />
            Bio Database
          </div>
        </Link>
        <Link to="/vault" className={location.pathname === '/vault' ? 'active' : ''}>
          <div className="flex-center" style={{ gap: '0.5rem' }}>
            <Database size={18} />
            Vault
          </div>
        </Link>
        {user && (
          <button 
            onClick={logout} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}
          >
            <LogOut size={18} /> Logout
          </button>
        )}
      </div>
    </nav>
  );
}

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function Footer() {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '2rem',
      borderTop: '1px solid var(--glass-border)',
      background: 'rgba(10, 15, 24, 0.7)',
      backdropFilter: 'blur(15px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      width: '100%'
    }}>
      <div className="flex-center" style={{ gap: '2rem', flexWrap: 'wrap' }}>
        <a href="mailto:nitishpattar7@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition-fast)' }} onMouseOver={e => e.currentTarget.style.color='var(--accent-cyan)'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>
          <Mail size={18} /> nitishpattar7@gmail.com
        </a>
        <a href="tel:+917483704050" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition-fast)' }} onMouseOver={e => e.currentTarget.style.color='var(--accent-purple)'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>
          <Phone size={18} /> +91-7483704050
        </a>
        <a href="https://www.instagram.com/nitishpattar07?igsh=MTZ0ZGY5OHBzNGZlZA==" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition-fast)' }} onMouseOver={e => e.currentTarget.style.color='var(--accent-pink)'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
          </svg>
          @nitishpattar07
        </a>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>© {new Date().getFullYear()} HelixVault. Developed by Nitish Pattar.</p>
    </footer>
  );
}

function App() {
  return (
    <AuthProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Router>
          <Navigation />
          <main className="container" style={{ marginTop: '2rem', flex: 1 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/encode" element={<ProtectedRoute><EncoderDecoder /></ProtectedRoute>} />
            <Route path="/bio" element={<ProtectedRoute><BioDatabase /></ProtectedRoute>} />
            <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
