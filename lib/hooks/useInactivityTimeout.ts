import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

const INACTIVITY_MS = 15 * 60 * 1000;
const WARNING_MS = 60 * 1000;

export interface InactivityState {
  showWarning: boolean;
  secondsRemaining: number;
  staySignedIn: () => void;
}

export function useInactivityTimeout(): InactivityState {
  const { signOut, isSignedIn } = useAuth();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;
  const isSignedInRef = useRef(isSignedIn);
  isSignedInRef.current = isSignedIn;

  const signOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (signOutTimerRef.current) clearTimeout(signOutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    signOutTimerRef.current = null;
    warningTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const startCountdown = useCallback(() => {
    setSecondsRemaining(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setSecondsRemaining((s) => {
        if (s <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const resetTimer = useCallback(() => {
    if (!isSignedInRef.current) return;

    clearAllTimers();
    setShowWarning(false);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, INACTIVITY_MS - WARNING_MS);

    signOutTimerRef.current = setTimeout(() => {
      setShowWarning(false);
      clearAllTimers();
      signOutRef.current();
    }, INACTIVITY_MS);
  }, [clearAllTimers, startCountdown]);

  const staySignedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!isSignedIn) return;

    const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => resetTimer();

    events.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    resetTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      clearAllTimers();
      setShowWarning(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  return { showWarning, secondsRemaining, staySignedIn };
}
