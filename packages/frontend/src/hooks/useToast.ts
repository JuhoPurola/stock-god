/**
 * Toast Hook
 * Global toast notification management
 */

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastStore {
  toasts: ToastState[];
  addToast: (message: string, variant: ToastVariant, duration?: number) => void;
  removeToast: (id: string) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, variant, duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, variant, duration }],
    }));
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  showSuccess: (message, duration) => {
    useToast.getState().addToast(message, 'success', duration);
  },

  showError: (message, duration) => {
    useToast.getState().addToast(message, 'error', duration);
  },

  showWarning: (message, duration) => {
    useToast.getState().addToast(message, 'warning', duration);
  },

  showInfo: (message, duration) => {
    useToast.getState().addToast(message, 'info', duration);
  },
}));
