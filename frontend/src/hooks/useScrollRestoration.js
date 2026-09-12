import { useLayoutEffect, useEffect } from 'react';

const SCROLL_KEY_PREFIX = 'feed-scroll-pos-';

export const useScrollRestoration = (isReady, containerSelector) => {
  const scrollKey = containerSelector
    ? `${SCROLL_KEY_PREFIX}${containerSelector.replace(/[^a-zA-Z0-9]/g, '_')}`
    : 'home-feed-scroll-position';

  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector(containerSelector);
      if (container) {
        sessionStorage.setItem(scrollKey, container.scrollTop.toString());
      }
    };

    const container = document.querySelector(containerSelector);
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
        sessionStorage.setItem(scrollKey, container.scrollTop.toString());
      }
    };
  }, [containerSelector, scrollKey]);

  useLayoutEffect(() => {
    if (isReady) {
      if (containerSelector === '#main-scroll-container' && typeof window !== 'undefined' && window.innerWidth >= 1024) {
        return;
      }

      const savedPosition = sessionStorage.getItem(scrollKey);
      const container = document.querySelector(containerSelector);
      
      if (savedPosition && container) {
        const pos = parseInt(savedPosition, 10);
        if (pos > 60) {
          requestAnimationFrame(() => {
            container.scrollTop = pos;
          });
        }
      }
    }
  }, [isReady, containerSelector, scrollKey]);
};
