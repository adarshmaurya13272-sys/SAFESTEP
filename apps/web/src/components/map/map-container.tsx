'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2 } from 'lucide-react';

/**
 * Central map module. All react-leaflet pieces are dynamically imported so
 * Leaflet (which touches `window` at import time) is never evaluated on the
 * server. Pages import SafeMap + the piece components from here only.
 */

const loadingPlaceholder = (
  <div className="w-full h-full flex items-center justify-center bg-surface/5 text-muted-foreground">
    <div className="flex flex-col items-center gap-3">
      <Loader2 size={28} className="animate-spin text-primary/60" />
      <MapPin size={40} className="opacity-30" />
      <p className="text-sm">Loading map…</p>
    </div>
  </div>
);

export const SafeMap = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => loadingPlaceholder }
);

export const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

export const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

export const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

export const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

export const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

export const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
);

export const Recenter = dynamic(() => import('./recenter'), { ssr: false });

/** Guard so leaflet-dependent children only render in the browser. */
export function ClientOnlyMap({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{loadingPlaceholder}</>;
  return <>{children}</>;
}
