import { toast } from 'sonner';

const parseArgs = (descOrOpts, opts) => {
  const description = typeof descOrOpts === 'string' ? descOrOpts : undefined;
  const options = typeof descOrOpts === 'object' && descOrOpts !== null ? descOrOpts : opts;
  return { description, options };
};

export const showToast = {
  success: (title, descOrOpts = '', opts = {}) => {
    const { description, options } = parseArgs(descOrOpts, opts);
    toast.success(title, {
      ...(description && { description }),
      duration: 3500,
      style: {
        background: '#ffffff',
        border: '1px solid #a7f3d0',
        color: '#065f46',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.15), 0 4px 10px -2px rgba(16, 185, 129, 0.08)',
      },
      ...options
    });
  },
  error: (title, descOrOpts = '', opts = {}) => {
    const { description, options } = parseArgs(descOrOpts, opts);
    toast.error(title, {
      ...(description && { description }),
      duration: 4000,
      style: {
        background: '#ffffff',
        border: '1px solid #fecdd3',
        color: '#9f1239',
        boxShadow: '0 10px 25px -5px rgba(244, 63, 94, 0.15), 0 4px 10px -2px rgba(244, 63, 94, 0.08)',
      },
      ...options
    });
  },

  info: (title, descOrOpts = '', opts = {}) => {
    const { description, options } = parseArgs(descOrOpts, opts);
    toast.info(title, {
      ...(description && { description }),
      duration: 3500,
      style: {
        background: '#ffffff',
        border: '1px solid #bae6fd',
        color: '#075985',
        boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.15), 0 4px 10px -2px rgba(14, 165, 233, 0.08)',
      },
      ...options
    });
  },

  warning: (title, descOrOpts = '', opts = {}) => {
    const { description, options } = parseArgs(descOrOpts, opts);
    toast.warning(title, {
      ...(description && { description }),
      duration: 3500,
      style: {
        background: '#ffffff',
        border: '1px solid #fde68a',
        color: '#92400e',
        boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.15), 0 4px 10px -2px rgba(245, 158, 11, 0.08)',
      },
      ...options
    });
  },

  custom: (title, description, icon, options = {}) => {
    toast(title, {
      description,
      icon,
      duration: 3500,
      style: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        color: '#0f172a',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 4px 10px -2px rgba(15, 23, 42, 0.05)',
      },
      ...options
    });
  }
};