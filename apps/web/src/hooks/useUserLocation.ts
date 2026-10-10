'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useJourneyStore } from '@/stores/journey-store';

export const DEMO_CENTER: [number, number] = [28.6139, 77.209]; // New Delhi (demo city)

export type LocationState = {
  coords: [number, number] | null;
  accuracy: number | null;
  source: 'gps' | 'fallback' | null;
  loading: boolean;
  error: string | null;
};

/**
 * Resolves the user's current location. Falls back to the demo city center
 * when GPS is unavailable or permission is denied so the demo flow always
 * works (the seeded demo incidents are centered there).
 */
export function useUserLocation(watch = false) {
  const [state, setState] = useState<LocationState>({
    coords: null,
    accuracy: null,
    source: null,
    loading: true,
    error: null,
  });
  const updateLocation = useJourneyStore((s) => s.updateLocation);
  const didFallback = useRef(false);

  const apply = useCallback(
    (lat: number, lng: number, accuracy: number | null, source: 'gps' | 'fallback') => {
      setState({ coords: [lat, lng], accuracy, source, loading: false, error: null });
      updateLocation({ lat, lng }, source);
    },
    [updateLocation]
  );

  useEffect(() => {
    let watchId: number | undefined;

    const handleError = (error: GeolocationPositionError) => {
      if (!didFallback.current) {
        didFallback.current = true;
        apply(DEMO_CENTER[0], DEMO_CENTER[1], null, 'fallback');
        setState((prev) => ({
          ...prev,
          error:
            error.code === error.PERMISSION_DENIED
              ? 'Location permission denied — using demo city center instead.'
              : 'Could not get your location — using demo city center instead.',
        }));
      }
    };

    const updatePosition = (position: GeolocationPosition) => {
      didFallback.current = true; // got a real fix, don't fall back later
      apply(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy,
        'gps'
      );
    };

    if (!('geolocation' in navigator)) {
      apply(DEMO_CENTER[0], DEMO_CENTER[1], null, 'fallback');
      return;
    }

    if (watch) {
      watchId = navigator.geolocation.watchPosition(updatePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5000,
      });
    } else {
      navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 12000,
      });
    }

    // Safety net: if no fix arrives at all, fall back after 14s
    const fallbackTimer = setTimeout(() => {
      if (!didFallback.current) {
        didFallback.current = true;
        apply(DEMO_CENTER[0], DEMO_CENTER[1], null, 'fallback');
        setState((prev) => ({
          ...prev,
          error: 'GPS timed out — using demo city center instead.',
        }));
      }
    }, 14000);

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      clearTimeout(fallbackTimer);
    };
  }, [watch, apply]);

  return state;
}
