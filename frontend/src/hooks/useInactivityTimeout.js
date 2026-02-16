import { useEffect, useRef } from 'react';

/**
 * Hook to automatically logout user after specified minutes of inactivity
 * @param {Function} onInactive - Callback to execute when user is inactive (null to disable)
 * @param {number} timeoutMinutes - Minutes of inactivity before logout (default: 10)
 */
const useInactivityTimeout = (onInactive, timeoutMinutes = 10) => {
  const timeoutRef = useRef(null);
  const TIMEOUT_MS = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds

  const resetTimer = () => {
    // Clear existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set timer if callback is provided
    if (onInactive && typeof onInactive === 'function') {
      // Set new timer
      timeoutRef.current = setTimeout(() => {
        console.log('User inactive for', timeoutMinutes, 'minutes. Logging out...');
        onInactive();
      }, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    // Skip if no callback provided
    if (!onInactive) {
      return;
    }

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Reset timer on any activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [onInactive, timeoutMinutes]);

  return null;
};

export default useInactivityTimeout;
