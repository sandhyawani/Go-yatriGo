import { toast } from 'sonner';

export const showToast = {
  success: (title, descOrOpts = '', opts = {}) => {
    const description = typeof descOrOpts === 'string' ? descOrOpts : undefined;
    const options = typeof descOrOpts === 'object' && descOrOpts !== null ? descOrOpts : opts;
    toast.success(title, {
      ...(description && { description }),
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      ...options
    });
  },
  error: (title, descOrOpts = '', opts = {}) => {
    const description = typeof descOrOpts === 'string' ? descOrOpts : undefined;
    const options = typeof descOrOpts === 'object' && descOrOpts !== null ? descOrOpts : opts;
    toast.error(title, {
      ...(description && { description }),
      duration: 3000,
      style: {
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(185, 28, 28, 0.95) 100%)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        animation: 'shake 0.5s',
      },
      ...options
    });
  },

  info: (title, descOrOpts = '', opts = {}) => {
    const description = typeof descOrOpts === 'string' ? descOrOpts : undefined;
    const options = typeof descOrOpts === 'object' && descOrOpts !== null ? descOrOpts : opts;
    toast.info(title, {
      ...(description && { description }),
      duration: 4000,
      style: {
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      ...options
    });
  },

  warning: (title, descOrOpts = '', opts = {}) => {
    const description = typeof descOrOpts === 'string' ? descOrOpts : undefined;
    const options = typeof descOrOpts === 'object' && descOrOpts !== null ? descOrOpts : opts;
    toast.warning(title, {
      ...(description && { description }),
      duration: 4000,
      style: {
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      ...options
    });
  },

  // Generic custom toast for icons and avatars
  custom: (title, description, icon, options = {}) => {
    toast(title, {
      description,
      icon,
      duration: 4000,
      ...options
    });
  }
};
