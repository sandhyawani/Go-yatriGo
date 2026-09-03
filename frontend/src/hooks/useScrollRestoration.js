import { useLayoutEffect, useEffect } from 'react';

const SCROLL_KEY_PREFIX = 'feed-scroll-pos-';

/**
 * Hook to save and restore scroll position for the home feed.
 * @param {boolean} isReady - Whether the feed has rendered enough data to restore scroll.
 * @param {string} containerSelector - CSS selector for the scrollable container.
 */
export const useScrollRestoration = (isReady, containerSelector) => {
  const scrollKey = containerSelector
    ? `${SCROLL_KEY_PREFIX}${containerSelector.replace(/[^a-zA-Z0-9]/g, '_')}`
    : 'home-feed-scroll-position';

  // Save scroll position before unmount or when navigating away
  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector(containerSelector);
      if (container) {
        sessionStorage.setItem(scrollKey, container.scrollTop.toString());
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
        sessionStorage.setItem(scrollKey, container.scrollTop.toString());
      }
    };
  }, [containerSelector, scrollKey]);

  // Restore scroll position when data is ready
  useLayoutEffect(() => {
    if (isReady) {
      // On desktop, main-scroll-container must always stay at 0
      if (containerSelector === '#main-scroll-container' && typeof window !== 'undefined' && window.innerWidth >= 1024) {
        return;
      }

      const savedPosition = sessionStorage.getItem(scrollKey);
      const container = document.querySelector(containerSelector);
      
      // Only restore if user had scrolled substantially (> 60px) down the feed
      // This prevents minor scroll offsets from hiding the greeting/dashboard header
      if (savedPosition && container) {
        const pos = parseInt(savedPosition, 10);
        if (pos > 60) {
          // Use requestAnimationFrame to ensure the DOM has painted the feed
          requestAnimationFrame(() => {
            container.scrollTop = pos;
          });
        }
      }
    }
  }, [isReady, containerSelector, scrollKey]);
};
