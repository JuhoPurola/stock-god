import { create } from 'zustand';
import type { Toast } from '../components/ui/Toast';

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

let toastIdCounter = 0;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },

  showSuccess: (message, duration = 5000) => {
    get().addToast({ message, variant: 'success', duration });
  },

  showError: (message, duration = 5000) => {
    get().addToast({ message, variant: 'error', duration });
  },

  showWarning: (message, duration = 5000) => {
    get().addToast({ message, variant: 'warning', duration });
  },

  showInfo: (message, duration = 5000) => {
    get().addToast({ message, variant: 'info', duration });
  },
}));
