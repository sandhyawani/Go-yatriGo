import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

const LazyImage = ({ src, alt, className, fallbackIcon: Fallback = ImageIcon, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    if (!src) {
      setHasError(true);
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`} {...props}>
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 skeleton-pulse bg-slate-200 z-10"
          />
        )}
      </AnimatePresence>
      
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-300 z-10">
          <Fallback className="w-1/3 h-1/3 mb-2" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Image Unavailable</span>
        </div>
      ) : (
        <motion.img
          src={src || ''}
          alt={alt}
          initial={{ filter: 'blur(20px)', opacity: 0 }}
          animate={
            isLoaded 
              ? { filter: 'blur(0px)', opacity: 1 } 
              : { filter: 'blur(20px)', opacity: 0 }
          }
          transition={{ duration: 0.5, ease: 'easeOut' }}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default LazyImage;

