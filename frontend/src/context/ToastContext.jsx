import { createContext, use, useState, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => use(ToastContext);

let _nextId = 0;
const DURATION = 4000;

const VARIANTS = {
  success: { icon: CheckCircle2,  color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.35)"  },
  error:   { icon: XCircle,       color: "#ef4444", bg: "rgba(239,68,68,0.12)",    border: "rgba(239,68,68,0.35)"   },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.12)",   border: "rgba(245,158,11,0.35)"  },
  info:    { icon: Info,          color: "#3b82f6", bg: "rgba(59,130,246,0.12)",   border: "rgba(59,130,246,0.35)"  },
};

function ToastItem({ toast, onDismiss }) {
  const v = VARIANTS[toast.type] || VARIANTS.info;
  const Icon = v.icon;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:"0.75rem", background:"rgba(10,10,10,0.95)", border:`1px solid ${v.border}`, borderLeft:`3px solid ${v.color}`, borderRadius:"12px", padding:"1rem 1.25rem", minWidth:"280px", maxWidth:"400px", backdropFilter:"blur(20px)", boxShadow:`0 8px 32px rgba(0,0,0,0.6)`, position:"relative", overflow:"hidden", animation:"toast-in 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
      <Icon size={18} color={v.color} style={{ marginTop:"1px", flexShrink:0 }} />
      <div style={{ flex:1, minWidth:0 }}>
        {toast.title   && <p style={{ margin:0, fontWeight:700, fontSize:"0.875rem", color:"#fff", marginBottom: toast.message ? "0.2rem" : 0 }}>{toast.title}</p>}
        {toast.message && <p style={{ margin:0, fontSize:"0.82rem", color:"rgba(255,255,255,0.7)", lineHeight:1.4 }}>{toast.message}</p>}
      </div>
      <button type="button" onClick={() => onDismiss(toast.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", padding:"0", flexShrink:0, display:"flex" }} aria-label="Dismiss">
        <X size={14} />
      </button>
      <div style={{ position:"absolute", bottom:0, left:0, height:"2px", background:v.color, opacity:0.5, animation:`toast-bar ${DURATION}ms linear forwards` }} />
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(({ type = "info", title, message, duration = DURATION }) => {
    const id = ++_nextId;
    setToasts(prev => [...prev.slice(-3), { id, type, title, message }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const showToast = {
    success: (title, message) => toast({ type: "success", title, message }),
    error:   (title, message) => toast({ type: "error",   title, message }),
    warning: (title, message) => toast({ type: "warning", title, message }),
    info:    (title, message) => toast({ type: "info",    title, message }),
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{ position:"fixed", bottom:"1.5rem", right:"1.5rem", zIndex:99999, display:"flex", flexDirection:"column", gap:"0.75rem", pointerEvents:"none" }} aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents:"auto" }}>
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in { from { opacity:0; transform:translateX(100%) scale(0.95); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes toast-bar { from { width:100%; } to { width:0%; } }
      `}</style>
    </ToastContext.Provider>
  );
}
