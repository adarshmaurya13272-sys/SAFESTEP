'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, AlertCircle, Loader2, Siren, CheckCircle2, Clock, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { formatDistance, formatDuration, formatDate } from '@/lib/utils';

const SafeMap = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-background text-muted-foreground">
      <Loader2 className="animate-spin text-primary/60 mr-3" />
      <p className="text-sm">Loading map…</p>
    </div>
  ) }
);
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((mod) => mod.CircleMarker), { ssr: false });

interface TrackingData {
  id: string;
  userName: string;
  status: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  routeGeometry: [number, number][];
  startedAt: string;
  endedAt: string | null;
  lastPing: { lat: number; lng: number; accuracy: number | null; timestamp: string } | null;
}

export default function TrackPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = () => {
    return api
      .get(`/journeys/track/${params.token}`)
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Could not load tracking data.');
      });
  };

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));

    // Live updates through the journey room
    socketService.emit('journey:join', { shareToken: params.token });
    const offLocation = socketService.on('journey:location_update', () => {
      load();
    });
    const offSos = socketService.on('sos:alert', () => {
      load();
      toast.error('⚠️ SOS was activated on this journey!', { duration: 10000 });
    });
    const offResolved = socketService.on('sos:resolved', () => {
      load();
      toast.success('The SOS was resolved — they marked themselves safe.');
    });

    // Poll as a safety net in case sockets are blocked
    const poll = setInterval(() => load(), 30000);

    return () => {
      offLocation();
      offSos();
      offResolved();
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  const isSos = data?.status === 'SOS';
  const isCompleted = data?.status === 'COMPLETED';

  const lastUpdated = useMemo(() => {
    if (!data?.lastPing) return null;
    const secs = Math.max(0, Math.round((Date.now() - new Date(data.lastPing.timestamp).getTime()) / 1000));
    return secs < 60 ? `${secs}s ago` : `${Math.round(secs / 60)} min ago`;
  }, [data?.lastPing?.timestamp, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <p className="text-sm text-muted-foreground">Loading live journey…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-destructive mb-4" />
        <h1 className="text-xl font-heading font-bold mb-2">Tracking link unavailable</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          {error ?? 'This journey could not be found.'} The link may have expired (links last 24 hours) or was revoked.
        </p>
        <a href="/" className="text-primary font-medium hover:underline">Go to SAFESTEP</a>
      </div>
    );
  }

  const position = data.lastPing
    ? ([data.lastPing.lat, data.lastPing.lng] as [number, number])
    : ([data.originLat, data.originLng] as [number, number]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-navy text-white p-4 flex justify-between items-center z-10 shadow-md gap-3">
        <div className="font-heading font-bold text-primary tracking-wider text-xl">SAFESTEP</div>
        {isSos ? (
          <div className="flex items-center gap-2 text-sm bg-destructive px-3 py-1 rounded-full font-bold animate-pulse">
            <Siren size={15} /> SOS ACTIVE
          </div>
        ) : isCompleted ? (
          <div className="flex items-center gap-2 text-sm bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
            <CheckCircle2 size={15} /> Arrived safely
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Tracking Active
          </div>
        )}
      </header>

      <div className="flex-1 relative min-h-[45vh]">
        <SafeMap
          center={position}
          zoom={14}
          scrollWheelZoom
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={data.routeGeometry ?? []} pathOptions={{ color: '#38BDF8', weight: 5, opacity: 0.85 }} />
          <CircleMarker
            center={[data.originLat, data.originLng]}
            radius={7}
            pathOptions={{ color: '#38BDF8', fillColor: '#38BDF8', fillOpacity: 0.9, weight: 2 }}
          />
          <CircleMarker
            center={[data.destLat, data.destLng]}
            radius={7}
            pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.9, weight: 2 }}
          />
          <CircleMarker
            center={position}
            radius={9}
            pathOptions={{
              color: isSos ? '#DC2626' : '#ffffff',
              fillColor: isSos ? '#DC2626' : '#38BDF8',
              fillOpacity: 1,
              weight: 3,
            }}
          />
        </SafeMap>
      </div>

      {/* Status panel */}
      <div className="p-4 pb-8 max-w-2xl w-full mx-auto">
        <div className="bg-card rounded-2xl shadow-xl p-5 border border-border">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <h2 className="font-bold text-lg">
                {isCompleted ? `${data.userName} has arrived` : `${data.userName} is en route`}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Clock size={13} />
                {data.lastPing && lastUpdated !== null
                  ? `Last update: ${lastUpdated}`
                  : 'Waiting for the first location update…'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Journey started</p>
              <p className="font-bold">{formatDate(data.startedAt)}</p>
            </div>
          </div>

          {isSos && (
            <div className="mt-4 bg-destructive/15 border border-destructive/30 text-destructive rounded-xl p-3 text-sm font-medium">
              ⚠️ An SOS was triggered on this journey. Try calling {data.userName.split(' ')[0]} immediately, or contact emergency services.
            </div>
          )}

          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 border-primary/50 text-primary hover:bg-primary/10"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`,
                  '_blank'
                )
              }
            >
              <Navigation size={16} /> Get Directions
            </Button>
            <a href="tel:112" className="flex-1">
              <Button variant="destructive" className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white">
                <AlertCircle size={16} /> Call Emergency 112
              </Button>
            </a>
            <Button variant="ghost" size="icon" className="text-muted-foreground" title="Copy tracking link" onClick={copyLink}>
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
          <MapPin size={12} /> Location shared via SAFESTEP · links expire 24 hours after the journey starts
        </p>
      </div>
    </div>
  );
}
