/**
 * Toast Notification Service
 * Provides user feedback for errors, success, and warnings
 */

import toast from 'react-hot-toast';

export const toastService = {
  success(message: string) {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
      },
    });
  },

  error(message: string, duration = 5000) {
    toast.error(message, {
      duration,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
      },
    });
  },

  warning(message: string) {
    toast(message, {
      icon: '⚠️',
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#f59e0b',
        color: '#fff',
      },
    });
  },

  info(message: string) {
    toast(message, {
      icon: 'ℹ️',
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#3b82f6',
        color: '#fff',
      },
    });
  },

  loading(message: string) {
    return toast.loading(message, {
      position: 'top-right',
    });
  },

  dismiss(toastId: string) {
    toast.dismiss(toastId);
  },

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        position: 'top-right',
      }
    );
  },
};
