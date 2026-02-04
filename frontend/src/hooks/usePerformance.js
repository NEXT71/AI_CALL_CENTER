import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing values
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} - Debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for throttling function calls
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Throttled function
 */
export function useThrottle(callback, delay = 500) {
  const lastRan = useRef(Date.now());

  return useCallback(
    (...args) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      }
    },
    [callback, delay]
  );
}

/**
 * Custom hook for optimized window resize handling
 * @param {Function} callback - Callback function
 * @param {number} delay - Debounce delay
 */
export function useWindowResize(callback, delay = 250) {
  const debouncedCallback = useDebounce(callback, delay);

  useEffect(() => {
    const handleResize = () => {
      if (typeof debouncedCallback === 'function') {
        debouncedCallback();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [debouncedCallback]);
}

/**
 * Custom hook for intersection observer (lazy loading)
 * @param {Object} options - IntersectionObserver options
 * @returns {Array} - [ref, isIntersecting]
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, {
      threshold: 0.1,
      ...options,
    });

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Custom hook for previous value tracking
 * @param {any} value - Value to track
 * @returns {any} - Previous value
 */
export function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Custom hook for async data fetching with caching
 * @param {Function} fetchFn - Async function to fetch data
 * @param {Array} deps - Dependencies array
 * @returns {Object} - { data, loading, error, refetch }
 */
export function useAsync(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      if (isMountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Custom hook for optimized scroll handling
 * @param {Function} callback - Callback function
 * @param {number} delay - Throttle delay
 */
export function useScrollThrottle(callback, delay = 100) {
  const throttledCallback = useThrottle(callback, delay);

  useEffect(() => {
    window.addEventListener('scroll', throttledCallback, { passive: true });
    return () => window.removeEventListener('scroll', throttledCallback);
  }, [throttledCallback]);
}
