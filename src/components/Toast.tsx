// Toast Notification Component
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export function ToastContainer() {
  const { state, dispatch } = useApp();

  const iconMap = {
    success: <CheckCircle size={18} color="#16a34a" />,
    error:   <AlertCircle size={18} color="#dc2626" />,
    info:    <Info size={18} color="#1e40af" />,
    warning: <AlertTriangle size={18} color="#ca8a04" />,
  };

  return (
    <div className="toast-container">
      {state.toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {iconMap[toast.type]}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{toast.title}</div>
            {toast.message && (
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{toast.message}</div>
            )}
          </div>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
