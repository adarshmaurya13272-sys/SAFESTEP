'use client';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom ?? map.getZoom(), { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);

  return null;
}
