import { useToastStore } from '../store/toast-store';

export const handleApiError = (error: any): string => {
  if (!navigator.onLine) {
    return 'No internet connection';
  }
  
  if (error.response) {
    const status = error.response.status;
    switch (status) {
      case 400: return 'Invalid request';
      case 401: return 'Authentication required';
      case 403: return 'Permission denied';
      case 404: return 'Resource not found';
      case 500: return 'Server error';
      default: return error.response.data?.message || 'An error occurred';
    }
  }
  
  return error.message || 'An unexpected error occurred';
};

export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  showToast = true
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error: any) {
    const message = handleApiError(error);
    if (showToast) {
      useToastStore.getState().showError(message);
    }
    return null;
  }
};
