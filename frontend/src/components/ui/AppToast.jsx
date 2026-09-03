import React from 'react';
import { Toaster } from 'sonner';

const AppToast = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'app-toast',
        style: {
          zIndex: 99999,
          borderRadius: '16px',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          background: 'rgba(255, 255, 255, 0.95)',
          color: '#0f172a',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 16px 36px -8px rgba(15, 23, 42, 0.14), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
          padding: '14px 16px',
        },
        classNames: {
          toast: 'group-[.toaster]:shadow-card-md group-[.toaster]:border-slate-200/80',
          title: 'text-sm font-bold text-slate-900 font-heading',
          description: 'text-xs text-slate-600 font-medium mt-0.5',
          icon: 'text-brand-600 shrink-0',
          success: 'border-emerald-200/80 text-emerald-950',
          error: 'border-rose-200/80 text-rose-950',
          info: 'border-sky-200/80 text-sky-950',
          warning: 'border-amber-200/80 text-amber-950',
        },
        duration: 3500,
      }}
    />
  );
};

export default AppToast;