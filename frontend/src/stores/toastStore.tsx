import React, { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface ToastContextType {
  toast: Toast;
  displaySuccess: (message: string) => void;
  displayError: (message: string) => void;
  displayInfo: (message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<Toast>({ message: '', type: 'info', visible: false });

  const show = useCallback((message: string, type: Toast['type'], duration: number) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), duration);
  }, []);

  const displaySuccess = useCallback((m: string) => show(m, 'success', 4000), [show]);
  const displayError = useCallback((m: string) => show(m, 'error', 8000), [show]);
  const displayInfo = useCallback((m: string) => show(m, 'info', 4000), [show]);
  const hideToast = useCallback(() => setToast(prev => ({ ...prev, visible: false })), []);

  return (
    <ToastContext.Provider value={{ toast, displaySuccess, displayError, displayInfo, hideToast }}>
      {children}
      {toast.visible && (
        <div
          className={`alert alert-${toast.type === 'error' ? 'danger' : toast.type} alert-dismissible position-fixed bottom-0 end-0 m-3`}
          style={{ zIndex: 9999, minWidth: 300 }}
        >
          {toast.message}
          <button type="button" className="btn-close" onClick={hideToast} />
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
