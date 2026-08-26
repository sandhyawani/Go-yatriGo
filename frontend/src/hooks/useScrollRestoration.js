import { useLayoutEffect, useEffect } from 'react';

const SCROLL_KEY = 'home-feed-scroll-position';

/**
 * Hook to save and restore scroll position for the home feed.
 * @param {boolean} isReady - Whether the feed has rendered enough data to restore scroll.
 * @param {string} containerSelector - CSS selector for the scrollable container.
 */
export const useScrollRestoration = (isReady, containerSelector) => {
  // Save scroll position before unmount or when navigating away
  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector(containerSelector);
      if (container) {
        sessionStorage.setItem(SCROLL_KEY, container.scrollTop.toString());
      }
    };

    const container = document.querySelector(containerSelector);
    if (container) {
      // Use debounce or throttle if necessary, but simple event is okay for now
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
        sessionStorage.setItem(SCROLL_KEY, container.scrollTop.toString());
      }
    };
  }, [containerSelector]);

  // Restore scroll position when data is ready
  useLayoutEffect(() => {
    if (isReady) {
      const savedPosition = sessionStorage.getItem(SCROLL_KEY);
      const container = document.querySelector(containerSelector);
      
      if (savedPosition && container) {
        // Use requestAnimationFrame to ensure the DOM has painted the feed
        requestAnimationFrame(() => {
          container.scrollTop = parseInt(savedPosition, 10);
        });
      }
    }
  }, [isReady, containerSelector]);
};
