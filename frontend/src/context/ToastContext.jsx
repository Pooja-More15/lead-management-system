import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    info: (msg) => showToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Floating Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.2 } }}
              className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all ${
                t.type === 'success' ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-200' :
                t.type === 'error' ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200/50 dark:border-rose-800/30 text-rose-800 dark:text-rose-200' :
                'bg-indigo-50/95 dark:bg-indigo-950/90 border-indigo-200/50 dark:border-indigo-800/30 text-indigo-800 dark:text-indigo-200'
              }`}
            >
              {t.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />}
              {t.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 text-indigo-500 mt-0.5" />}
              
              <div className="flex-1 text-sm font-medium">{t.message}</div>
              
              <button 
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
export default ToastContext;
