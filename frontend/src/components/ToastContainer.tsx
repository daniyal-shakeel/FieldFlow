'use client';

import React from 'react';
import { usePdfStore } from '@/store/usePdfStore';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = usePdfStore(state => state.toasts);
  const removeToast = usePdfStore(state => state.removeToast);
  const isDarkMode = usePdfStore(state => state.isDarkMode);

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const getBorderColor = (type: string) => {
    if (isDarkMode) {
      switch (type) {
        case 'success': return 'border-emerald-500/30 bg-emerald-950/20';
        case 'error': return 'border-red-500/30 bg-red-950/20';
        case 'warning': return 'border-amber-500/30 bg-amber-950/20';
        default: return 'border-blue-500/30 bg-blue-950/20';
      }
    } else {
      switch (type) {
        case 'success': return 'border-emerald-200 bg-emerald-50';
        case 'error': return 'border-red-200 bg-red-50';
        case 'warning': return 'border-amber-200 bg-amber-50';
        default: return 'border-blue-200 bg-blue-50';
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start justify-between p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            getBorderColor(toast.type)
          } ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}
        >
          <div className="flex items-start space-x-3">
            {getIcon(toast.type)}
            <p className="text-sm font-semibold leading-5">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className={`p-0.5 rounded-lg shrink-0 ml-4 transition-colors ${
              isDarkMode 
                ? 'hover:bg-white/10 text-slate-400 hover:text-white' 
                : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
