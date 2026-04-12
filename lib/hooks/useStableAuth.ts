import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';

const DEBOUNCE_MS = 800;

/**
 * Wraps Clerk's useAuth() with stabilisation for isSignedIn.
 *
 * Problem: Clerk's isSignedIn flickers true->false->true during session
 * refresh after setActive(). This causes AuthRedirect to bounce users
 * to /landing mid-login.
 *
 * Solution: When isSignedIn transitions from true to false, suppress the
 * change for DEBOUNCE_MS. If it bounces back to true within that window,
 * the false is never propagated. If it stays false (real sign-out), the
 * false propagates after the debounce.
 */
export function useStableAuth() {
  const { isSignedIn, isLoaded, ...rest } = useAuth();
  const [stableSignedIn, setStableSignedIn] = useState(isSignedIn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKnownRef = useRef(isSignedIn);

  useEffect(() => {
    if (!isLoaded) return;

    const prev = lastKnownRef.current;
    lastKnownRef.current = isSignedIn;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isSignedIn === true) {
      setStableSignedIn(true);
    } else if (isSignedIn === false && prev === true) {
      // true -> false: debounce — might be a flicker
      timerRef.current = setTimeout(() => {
        setStableSignedIn(false);
        timerRef.current = null;
      }, DEBOUNCE_MS);
    } else {
      // false -> false, or undefined -> false: propagate immediately
      setStableSignedIn(isSignedIn);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isSignedIn, isLoaded]);

  return { isSignedIn: stableSignedIn, isLoaded, ...rest };
}
