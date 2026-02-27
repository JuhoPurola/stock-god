/**
 * Toast Provider
 * Connects useToast store to ToastContainer for global toast notifications
 */

import { ToastContainer } from './Toast';
import { useToast } from '../../hooks/useToast';

export function ToastProvider() {
  const { toasts, removeToast } = useToast();

  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}
