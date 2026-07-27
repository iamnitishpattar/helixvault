import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Dna, Activity, ShieldAlert, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import SpotlightCard from '../components/SpotlightCard';
import { getSafeApiErrorMessage } from '../utils/errorMessages';

export default function AiCoPilot() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "### 🧬 HelixVault Autonomous AI Co-Pilot Online\n\nWelcome! I am your conversational biological data assistant. I continuously monitor your sequence archives, execute in-memory genetic searches, and model physical oligonucleotide properties.\n\n**Try asking me a question or click one of the quick-action prompts below!**",
      tool: 'init'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const promptChips = [
    "How much physical weight in femtograms is my vault?",
    "Search my vault for motif GATTACA and check stability",
    "Find confidential backups using AI vector search",
    "How does circular plasmid cloning into pUC19 work?",
    "Explain how Fountain Codes protect my archives",
    "Analyze GC content and synthesis cost of my files"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
    // Simple robust formatter for headings, tables, bold, and code blocks
    const lines = content.split('\n');
    let inTable = false;
    let tableRows = [];

    return lines.map((line, idx) => {
      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        if (line.includes('---')) return null; // delimiter
        const cells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
        const isHeader = tableRows.length === 0;
        tableRows.push(cells);
        if (idx < lines.length - 1 && lines[idx+1].startsWith('|')) {
          return null;
        }
        // Render completed table
        const currentTable = [...tableRows];
        tableRows = [];
        inTable = false;
        return (
          <div key={idx} style={{ overflowX: 'auto', margin: '1.25rem 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: 'rgba(255,215,0,0.1)', borderBottom: '1px solid var(--border-dark)', textAlign: 'left' }}>
                  {currentTable[0]?.map((h, i) => (
                    <th key={i} style={{ padding: '0.75rem 1rem', color: 'var(--gold-primary)', fontWeight: '700' }}>{h.replace(/\*\*/g, '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTable.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: '0.75rem 1rem', color: '#e2e8f0' }}>
                        {cell.replace(/`([^`]+)`/g, '$1').replace(/\*\*/g, '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      if (line.startsWith('### ')) {
        return <h3 key={idx} style={{ color: '#fff', fontSize: '1.3rem', marginTop: '1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} style={{ color: 'var(--gold-primary)', fontSize: '1.05rem', marginTop: '1rem', marginBottom: '0.5rem' }}>{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('> [!')) {
        const title = line.match(/> \[(.*?)\]/)?.[1] || 'NOTE';
        return (
          <div key={idx} style={{ background: 'rgba(255,215,0,0.08)', borderLeft: '4px solid var(--gold-primary)', padding: '1rem 1.25rem', borderRadius: '8px', margin: '1rem 0', color: '#fff' }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--gold-primary)' }}>{title}</strong>
          </div>
        );
      }
      if (line.startsWith('> ')) {
        return <p key={idx} style={{ margin: '0.5rem 0 0.5rem 1rem', color: '#cbd5e1', fontStyle: 'italic' }}>{line.replace('> ', '')}</p>;
      }
      if (line.startsWith('- ')) {
        return <li key={idx} style={{ marginLeft: '1.5rem', marginBottom: '0.4rem', color: '#e2e8f0' }}>{line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '$1')}</li>;
      }
      if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
        return <div key={idx} style={{ marginLeft: '1rem', marginBottom: '0.5rem', color: '#e2e8f0', fontWeight: '500' }}>{line}</div>;
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '0.5rem' }} />;
      }

      return <p key={idx} style={{ margin: '0.5rem 0', color: '#e2e8f0', lineHeight: '1.6' }}>{line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')}</p>;
    });
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: '750px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div className="flex-center" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ background: 'var(--gradient-gold)', padding: '0.5rem', borderRadius: '12px', display: 'flex' }}>
            <Bot size={26} color="#000" />
          </div>
          <span style={{ color: 'var(--gold-primary)', fontWeight: '600', letterSpacing: '0.15em', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            Autonomous RAG Intelligence
          </span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #fff 0%, #a5a5a5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          DNA-RAG AI Co-Pilot
        </h1>
      </div>

      {/* Main Chat Box */}
      <SpotlightCard className="glass-panel" style={{ flex: '1', display: 'flex', flexDirection: 'column', borderRadius: '24px', border: '1px solid rgba(255,215,0,0.15)', overflow: 'hidden', background: 'rgba(10,10,10,0.7)' }}>
        {/* Messages Scroll Area */}
        <div style={{ flex: '1', overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '1rem',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: msg.sender === 'user' ? '75%' : '90%',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              {msg.sender === 'ai' && (
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={22} color="#000" />
                </div>
              )}
              
              <div
                style={{
                  background: msg.sender === 'user' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.04)',
                  color: msg.sender === 'user' ? '#000' : '#fff',
                  padding: '1.25rem 1.75rem',
                  borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  border: msg.sender === 'ai' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(255,215,0,0.2)' : '0 4px 20px rgba(0,0,0,0.3)',
                  fontWeight: msg.sender === 'user' ? '600' : '400'
                }}
              >
                {msg.sender === 'user' ? (
                  <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>{msg.text}</p>
                ) : (
                  <div>
                    {renderFormattedText(msg.text)}
                    {msg.tool && msg.tool !== 'init' && (
                      <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Cpu size={14} /> Executed Tool: <strong>{msg.tool}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={20} color="#fff" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start', alignItems: 'center', padding: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={22} color="#000" />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem 1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--gold-primary)' }}>
                <div className="spinner-sm" />
                <span>AI Co-Pilot is analyzing vault sequences & computing metrics...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div style={{ padding: '0.75rem 2rem', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.5rem', overflowX: 'auto', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={14} color="var(--gold-primary)" /> Suggested:
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
                color: '#e2e8f0',
                padding: '0.4rem 0.85rem',
                borderRadius: '16px',
                fontSize: '0.8rem',
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

        {/* Input Footer */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ padding: '1.25rem 2rem', background: 'rgba(0,0,0,0.6)', borderTop: '1px solid var(--border-dark)', display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Co-Pilot anything about your DNA archives, physical synthesis weight, or sequence motifs..."
            disabled={loading}
            style={{
              flex: '1',
              padding: '1.1rem 1.5rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-dark)',
              borderRadius: '16px',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-gold"
            style={{ padding: '0 2rem', height: 'auto', borderRadius: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Send size={18} /> SEND
          </button>
        </form>
      </SpotlightCard>
    </div>
  );
}
