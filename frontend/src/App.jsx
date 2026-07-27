import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Dna, LogOut, Mail, Phone, ChevronDown, LayoutGrid, Database, Shield, Cpu, Disc, Binary } from 'lucide-react';

const InstagramIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
import Dashboard from './pages/Dashboard';
import EncodePage from './pages/EncodePage';
import DecodePage from './pages/DecodePage';
import BioDatabase from './pages/BioDatabase';
import Vault from './pages/Vault';
import BioCompute from './pages/BioCompute';
import PlasmidWorkbench from './pages/PlasmidWorkbench';
import AiCoPilot from './pages/AiCoPilot';
import AiCoPilotWidget from './components/AiCoPilotWidget';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CarrierProvider } from './context/CarrierContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Don't show nav on login/register/forgot-password pages
  if (['/login', '/register', '/forgot-password'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav>
      <div className="flex-center" style={{ gap: '1rem' }}>
        <Dna color="var(--text-primary)" size={28} />
        <span className="brand-text">H E L I X V A U L T</span>
      </div>
      <div className="nav-links">
        <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <LayoutGrid size={15} className="nav-icon" />
          <span>PRODUCTS</span>
          {location.pathname === '/' && <span className="nav-active-dot" />}
        </Link>
        <Link to="/encode" className={`nav-item ${location.pathname === '/encode' ? 'active' : ''}`}>
          <Dna size={15} className="nav-icon" />
          <span>ENCODER</span>
          {location.pathname === '/encode' && <span className="nav-active-dot" />}
        </Link>
        <Link to="/decode" className={`nav-item ${location.pathname === '/decode' ? 'active' : ''}`}>
          <Binary size={15} className="nav-icon" />
          <span>DECODER</span>
          {location.pathname === '/decode' && <span className="nav-active-dot" />}
        </Link>
        <Link to="/bio" className={`nav-item ${location.pathname === '/bio' ? 'active' : ''}`}>
          <Database size={15} className="nav-icon" />
          <span>DATABASE</span>
          {location.pathname === '/bio' && <span className="nav-active-dot" />}
        </Link>
        <Link to="/vault" className={`nav-item ${location.pathname === '/vault' ? 'active' : ''}`}>
          <Shield size={15} className="nav-icon" />
          <span>VAULT</span>
          {location.pathname === '/vault' && <span className="nav-active-dot" />}
        </Link>
        <Link to="/compute" className={`nav-item ${location.pathname === '/compute' ? 'active' : ''}`}>
          <Cpu size={15} className="nav-icon" />
          <span>BIO-COMPUTE</span>
          {location.pathname === '/compute' && <span className="nav-active-dot" />}
        </Link>
        <Link to="/plasmid" className={`nav-item ${location.pathname === '/plasmid' ? 'active' : ''}`}>
          <Disc size={15} className="nav-icon" />
          <span>PLASMID</span>
          {location.pathname === '/plasmid' && <span className="nav-active-dot" />}
        </Link>
      </div>
      <div className="flex-center" style={{ gap: '1.5rem' }}>
        {user ? (
          <button type="button" onClick={logout} className="nav-logout-btn">
            <LogOut size={16} /> LOGOUT
          </button>
        ) : (
          <Link to="/login" className="nav-logout-btn" style={{ textDecoration: 'none' }}>
            LOGIN
          </Link>
        )}
        <Link to="/encode" className="btn btn-outline-gold">
          GET STARTED
        </Link>
      </div>
    </nav>
  );
}

function Footer() {
  const location = useLocation();
  if (['/login', '/register', '/forgot-password'].includes(location.pathname)) {
    return null;
  }

  return (
    <footer style={{ borderTop: '1px solid var(--border-dark)', background: 'radial-gradient(circle at 50% 100%, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 60%), #0a0a0a', padding: '5rem 3rem 2rem 3rem', color: 'var(--text-secondary)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem', maxWidth: '1200px', margin: '0 auto 4rem auto' }}>

        <div style={{ paddingRight: '2rem' }}>
          <div className="flex-center" style={{ gap: '0.5rem', justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
            <Dna color="var(--text-primary)" size={24} />
            <span className="brand-text" style={{ fontSize: '0.9rem' }}>H E L I X V A U L T</span>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            The future of biological data storage. Secure, immutable, and timeless storage encoded in DNA.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="mailto:nitishpattar7@gmail.com" className="footer-icon-link" aria-label="Email"><Mail size={18} /></a>
            <a href="tel:+917483704050" className="footer-icon-link" aria-label="Phone"><Phone size={18} /></a>
            <a href="https://www.instagram.com/imnitishpattar" target="_blank" rel="noreferrer" className="footer-icon-link" aria-label="Instagram"><InstagramIcon size={18} /></a>
          </div>
        </div>

        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', letterSpacing: '0.1em', fontSize: '0.85rem' }}>PRODUCTS</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <li><Link to="/encode" className="footer-link">DNA Encoder</Link></li>
            <li><Link to="/decode" className="footer-link">Data Decoder</Link></li>
            <li><Link to="/vault" className="footer-link">Secure Vault</Link></li>
            <li><Link to="/plasmid" className="footer-link">Plasmid Workbench</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', letterSpacing: '0.1em', fontSize: '0.85rem' }}>RESOURCES</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <li><Link to="/bio" className="footer-link">Biological Database</Link></li>
          </ul>
        </div>

      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem', textAlign: 'center', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} HelixVault. Developed by Nitish Pattar.</p>
      </div>
    </footer>
  );
}

function App() {
  return (
    <CarrierProvider>
      <AuthProvider>
        <div className="app-wrapper">
          <Router>
            <div className="main-window">
              <Navigation />
              <AiCoPilotWidget />
              <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    <Route path="/" element={<Dashboard />} />
                    <Route path="/encode" element={<ProtectedRoute><EncodePage /></ProtectedRoute>} />
                    <Route path="/decode" element={<ProtectedRoute><DecodePage /></ProtectedRoute>} />
                    <Route path="/bio" element={<ProtectedRoute><BioDatabase /></ProtectedRoute>} />
                    <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
                    <Route path="/compute" element={<ProtectedRoute><BioCompute /></ProtectedRoute>} />
                    <Route path="/plasmid" element={<ProtectedRoute><PlasmidWorkbench /></ProtectedRoute>} />
                    <Route path="/copilot" element={<ProtectedRoute><AiCoPilot /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </main>
              <Footer />
            </div>
          </Router>
        </div>
      </AuthProvider>
    </CarrierProvider>
  );
}

export default App;
