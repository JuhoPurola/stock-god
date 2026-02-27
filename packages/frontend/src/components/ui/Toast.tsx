import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[toast.variant];

  const variantClasses = {
    success: 'bg-success-50 text-success-900 border-success-200',
    error: 'bg-danger-50 text-danger-900 border-danger-200',
    warning: 'bg-warning-50 text-warning-900 border-warning-200',
    info: 'bg-primary-50 text-primary-900 border-primary-200',
  };

  const iconClasses = {
    success: 'text-success-600',
    error: 'text-danger-600',
    warning: 'text-warning-600',
    info: 'text-primary-600',
  };

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md animate-slide-in',
        variantClasses[toast.variant]
      )}
      role="alert"
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0', iconClasses[toast.variant])} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}
