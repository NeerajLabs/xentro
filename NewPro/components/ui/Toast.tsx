'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}

interface ToastContextType {
  showToast: (
    messageOrOptions: string | { message?: string; title?: string; description?: string; type?: 'success' | 'info' | 'error' },
    type?: 'success' | 'info' | 'error'
  ) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (
      messageOrOptions: string | { message?: string; title?: string; description?: string; type?: 'success' | 'info' | 'error' },
      defaultType: 'success' | 'info' | 'error' = 'success'
    ) => {
      let finalMessage = '';
      let finalType: 'success' | 'info' | 'error' = defaultType;

      if (typeof messageOrOptions === 'string') {
        finalMessage = messageOrOptions;
      } else if (messageOrOptions && typeof messageOrOptions === 'object') {
        finalType = messageOrOptions.type || defaultType;
        if (messageOrOptions.title && messageOrOptions.description) {
          finalMessage = `${messageOrOptions.title}: ${messageOrOptions.description}`;
        } else {
          finalMessage = messageOrOptions.message || messageOrOptions.title || messageOrOptions.description || '';
        }
      }

      if (!finalMessage) return;

      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type: finalType, message: finalMessage }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-dropdown border text-sm font-medium transition-all duration-300 transform translate-y-0 opacity-100 ${
              toast.type === 'success'
                ? 'bg-white text-[#101212] border-gray-200 dark:bg-[#181B1A] dark:text-white dark:border-[#262A29]'
                : toast.type === 'error'
                ? 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50'
                : 'bg-[#D9FF3F]/15 text-[#101212] dark:text-white border-[#D9FF3F]/40 dark:bg-[#181B1A]'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#9EBE12]" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#101212] dark:text-[#D9FF3F]" />}
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
