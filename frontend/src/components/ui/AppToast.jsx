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
          borderRadius: '1rem', // rounded-2xl
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(79, 70, 229, 0.9) 100%)', // Purple gradient
          color: 'white',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 25px -5px rgba(109, 40, 217, 0.4), 0 8px 10px -6px rgba(109, 40, 217, 0.2)', // soft purple shadow
          padding: '16px',
        },
        classNames: {
          toast: 'group-[.toaster]:backdrop-blur-xl group-[.toaster]:bg-white/10 group-[.toaster]:border-white/20',
          title: 'text-base font-semibold text-white',
          description: 'text-sm text-brand-100',
          icon: 'text-white',
          success: 'app-toast-success',
          error: 'app-toast-error',
          info: 'app-toast-info',
          warning: 'app-toast-warning',
        },
        duration: 3000,
      }}
    />
  );
};

export default AppToast;

