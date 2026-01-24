import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Toast variants using CVA.
 */
const toastVariants = cva(
  'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto max-w-sm',
  {
    variants: {
      intent: {
        success: 'bg-success-50 border border-success-500/20 text-success-700',
        danger: 'bg-danger-50 border border-danger-200 text-danger-700',
        warning: 'bg-warning-50 border border-warning-500/20 text-warning-700',
        info: 'bg-primary-50 border border-primary-200 text-primary-800',
      },
    },
    defaultVariants: {
      intent: 'info',
    },
  }
);

export type ToastIntent = 'success' | 'danger' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  intent: ToastIntent;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, intent?: ToastIntent) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access toast functionality.
 *
 * @example
 * const { addToast } = useToast();
 * addToast('Product created successfully!', 'success');
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Toast provider component that wraps the app.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, intent: ToastIntent = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, intent }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Individual toast item with auto-dismiss.
 */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const iconMap: Record<ToastIntent, ReactNode> = {
    success: (
      <svg className="w-5 h-5 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    danger: (
      <svg className="w-5 h-5 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      className={cn(
        toastVariants({ intent: toast.intent }),
        'animate-in fade-in slide-in-from-top-2 duration-200'
      )}
      role="alert"
    >
      {iconMap[toast.intent]}
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded hover:bg-black/5 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Toast container that positions toasts at the top-right.
 */
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export { toastVariants };
