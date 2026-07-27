import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Cpu, X, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getSafeApiErrorMessage } from '../utils/errorMessages';
import { useAuth } from '../context/AuthContext';

export default function AiCoPilotWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "### 🧬 HelixVault Co-Pilot\n\nI am your conversational biological data assistant. Ask me anything about your encoded DNA archives, motif stability, or physical oligo weights!",
      tool: 'init'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const promptChips = [
    "How much physical weight in fg is my vault?",
    "Search my vault for motif GATTACA",
    "Find confidential backups with AI vector search",
    "How does circular plasmid cloning work?",
    "Explain Fountain Codes defense",
    "Analyze GC content and synthesis cost"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  // Hide widget on auth pages or when user is not logged in
  if (!user || ['/login', '/register', '/forgot-password'].includes(location.pathname)) {
    return null;
  }

  // If user is already on the dedicated /copilot page, don't show the floating widget button
  if (location.pathname === '/copilot') {
    return null;
  }

  const handleSend = async (val) => {
    const questionText = typeof val === 'string' ? val : input;
    if (!questionText || !questionText.trim() || loading) return;
    
    const userMsg = { sender: 'user', text: questionText };
    setMessages(prev => [...prev, userMsg]);
    if (questionText === input) setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/compute/chat`, {
        question: questionText
      }, {
        withCredentials: true,
        timeout: 15000
      });
      
      const aiData = res.data.data;
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: aiData.response,
          tool: aiData.tool_used,
          metrics: aiData.vault_metrics
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `### ⚠️ Computation Error\n\n${getSafeApiErrorMessage(err, 'Failed to communicate with AI Co-Pilot service.')}`,
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (content) => {
    const lines = content.split('\n');
    let inTable = false;
    let tableRows = [];

    return lines.map((line, idx) => {
      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        if (line.includes('---')) return null;
        const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
        const isHeader = tableRows.length === 0;
        tableRows.push(cells);
        if (idx < lines.length - 1 && lines[idx+1].startsWith('|')) {
          return null;
        }
        const currentTable = [...tableRows];
        tableRows = [];
        inTable = false;
        return (
          <div key={idx} style={{ overflowX: 'auto', margin: '0.75rem 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'rgba(255,215,0,0.15)', borderBottom: '1px solid var(--border-dark)', textAlign: 'left' }}>
                  {currentTable[0]?.map((h, i) => (
                    <th key={i} style={{ padding: '0.5rem 0.6rem', color: 'var(--gold-primary)', fontWeight: '700' }}>{h.replace(/\*\*/g, '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTable.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: '0.5rem 0.6rem', color: '#e2e8f0' }}>{cell.replace(/`/g, '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      if (inTable) return null;

      if (line.startsWith('### ')) {
        return <h3 key={idx} style={{ color: '#fff', fontSize: '1rem', marginTop: '0.75rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} style={{ color: 'var(--gold-primary)', fontSize: '0.9rem', marginTop: '0.75rem', marginBottom: '0.3rem' }}>{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('> ')) {
        const isTip = line.includes('[!TIP]');
        const isImportant = line.includes('[!IMPORTANT]');
        const isWarning = line.includes('[!WARNING]');
        if (isTip || isImportant || isWarning) return null;
        
        let title = "Insight";
        if (idx > 0 && lines[idx-1].includes('[!TIP]')) title = "💡 Biological Tip";
        if (idx > 0 && lines[idx-1].includes('[!IMPORTANT]')) title = "🔥 Biophysical Highlight";
        if (idx > 0 && lines[idx-1].includes('[!WARNING]')) title = "⚠️ Warning";

        return (
          <div key={idx} style={{ background: 'rgba(255,215,0,0.08)', borderLeft: '3px solid var(--gold-primary)', padding: '0.75rem 1rem', borderRadius: '6px', margin: '0.75rem 0', color: '#fff', fontSize: '0.85rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--gold-primary)' }}>{title}</strong>
            {line.replace('> ', '')}
          </div>
        );
      }
      if (line.startsWith('- ')) {
        return <li key={idx} style={{ marginLeft: '1rem', marginBottom: '0.25rem', color: '#cbd5e1', fontSize: '0.85rem' }}>{line.replace('- ', '')}</li>;
      }
      if (line.trim() === '') return <div key={idx} style={{ height: '0.4rem' }} />;
      return <p key={idx} style={{ margin: '0.3rem 0', color: '#cbd5e1', lineHeight: '1.4', fontSize: '0.85rem' }}>{line}</p>;
    });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-gold"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          borderRadius: '50px',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          cursor: 'pointer',
          fontWeight: '700',
          fontSize: '0.95rem',
          boxShadow: '0 8px 30px rgba(212, 175, 55, 0.5)',
          animation: 'copilot-pulse 2.5s infinite, float-bounce 3.5s ease-in-out infinite',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ background: '#000', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bot size={18} color="var(--gold-primary)" />
        </div>
        <span>HELIXVAULT CO-PILOT</span>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#000', display: 'inline-block', boxShadow: '0 0 5px #000' }} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 10000,
        width: isExpanded ? '600px' : '410px',
        maxWidth: '92vw',
        height: isExpanded ? '80vh' : '580px',
        maxHeight: '85vh',
        background: 'rgba(13, 13, 13, 0.96)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        borderRadius: '24px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(212, 175, 55, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease, height 0.3s ease'
      }}
    >
      {/* Widget Header */}
      <div
        style={{
          background: 'rgba(0,0,0,0.7)',
          padding: '0.9rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#000" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>HelixVault Co-Pilot</span>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff66', display: 'inline-block', boxShadow: '0 0 8px #00ff66' }} title="Online" />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Autonomous DNA-RAG</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cbd5e1', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title={isExpanded ? "Restore size" : "Expand window"}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            type="button"
            onClick={() => { setIsOpen(false); navigate('/copilot'); }}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--gold-primary)', padding: '0.4rem 0.6rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
            title="Open in Full Page"
          >
            Full Page
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#cbd5e1', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Close widget"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Message Scroll Area */}
      <div style={{ flex: '1', overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%'
            }}
          >
            {msg.sender === 'ai' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={18} color="#000" />
              </div>
            )}

            <div
              style={{
                background: msg.sender === 'user' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.04)',
                color: msg.sender === 'user' ? '#000' : '#fff',
                padding: '0.85rem 1.15rem',
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                border: msg.sender === 'ai' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(212,175,55,0.2)' : '0 4px 15px rgba(0,0,0,0.3)',
                fontWeight: msg.sender === 'user' ? '600' : '400',
                fontSize: '0.9rem'
              }}
            >
              {msg.sender === 'user' ? (
                <p style={{ margin: 0, lineHeight: '1.4' }}>{msg.text}</p>
              ) : (
                <div>
                  {renderFormattedText(msg.text)}
                  {msg.tool && msg.tool !== 'init' && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Cpu size={12} /> Tool: <strong>{msg.tool}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} color="#fff" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#000" />
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem 1.15rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>
              <div className="spinner-sm" style={{ width: '14px', height: '14px' }} />
              <span>Analyzing vault sequences...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips Footer */}
      <div style={{ padding: '0.6rem 1rem', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.4rem', overflowX: 'auto', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          <Sparkles size={12} color="var(--gold-primary)" />
        </span>
        {promptChips.map((chip, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(chip)}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              padding: '0.3rem 0.65rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.8)', borderTop: '1px solid var(--border-dark)', display: 'flex', gap: '0.6rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI Co-Pilot..."
          disabled={loading}
          style={{
            flex: '1',
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-dark)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-gold"
          style={{ padding: '0 1.25rem', height: 'auto', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
