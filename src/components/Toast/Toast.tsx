import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useUIStore();

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} className="toast-icon toast-icon--success" />;
      case 'error':
        return <AlertCircle size={18} className="toast-icon toast-icon--error" />;
      case 'warning':
        return <AlertTriangle size={18} className="toast-icon toast-icon--warning" />;
      default:
        return <Info size={18} className="toast-icon toast-icon--info" />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
        >
          {getIcon(toast.type)}
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-dismiss"
            onClick={() => dismissToast(toast.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
