'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapIcon, Copy, Check, Loader2, ShieldAlert, Siren, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useJourneyStore } from '@/stores/journey-store';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useWakeLock } from '@/hooks/useWakeLock';
import { socketService } from '@/lib/socket';
import { formatDuration, haversineM } from '@/lib/utils';
import { SafeMap, TileLayer, CircleMarker, Circle, Polyline, Recenter } from '@/components/map/map-container';
import { SOSButton } from '@/components/journey/sos-button';
import { DeviationAlert } from '@/components/journey/deviation-alert';

const JourneyPanel = dynamic(() => import('@/components/journey/journey-panel').then((m) => m.JourneyPanel), { ssr: false });

interface HelpPlace {
  placeType: string;
  name: string;
  lat: number;
  lng: number;
  phone?: string;
}

export default function JourneyPage() {
  const router = useRouter();
  const {
    journey,
    setJourney,
    currentLocation,
    lastPingAt,
    setLastPingAt,
    isSosActive,
    activeSos,
    triggerSos,
    cancelSos,
    endJourney,
    deviationAlert,
    setDeviationAlert,
  } = useJourneyStore();

  const { coords, accuracy, error: locationError } = useUserLocation(true);
  const [isRestoring, setIsRestoring] = useState(journey === null);
  const [isEnding, setIsEnding] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [helpPlaces, setHelpPlaces] = useState<HelpPlace[]>([]);
  const lastPingSent = useRef(0);

  useWakeLock(!!journey);

  // Restore an active journey after a page reload (journey state is in-memory)
  useEffect(() => {
    if (journey) {
      setIsRestoring(false);
      return;
    }
    let cancelled = false;
    api
      .get('/journeys')
      .then((res) => {
        if (cancelled) return;
        const active = (res.data ?? []).find(
          (j: any) => j.status === 'ACTIVE' || j.status === 'SOS'
        );
        if (active) {
          setJourney(active);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsRestoring(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ticking clock for elapsed time
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Send location pings: throttled REST (auth) + socket (realtime broadcast)
  useEffect(() => {
    if (!journey || !coords) return;
    const now = Date.now();
    if (now - lastPingSent.current < 8000) return;
    lastPingSent.current = now;

    api
      .post(`/journeys/${journey.id}/ping`, { lat: coords[0], lng: coords[1], accuracy: accuracy ?? undefined })
      .then(() => setLastPingAt(now))
      .catch(() => {});
    socketService.emit('journey:location', {
      journeyId: journey.id,
      lat: coords[0],
      lng: coords[1],
      accuracy: accuracy ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, journey]);

  // Realtime: join the journey room and listen for deviation alerts
  useEffect(() => {
    if (!journey) return;
    socketService.emit('journey:join', { shareToken: journey.shareToken });

    const offDeviation = socketService.on('journey:deviation_alert', () => {
      if (!isSosActive) setDeviationAlert(true);
    });
    const offLocation = socketService.on('journey:location_update', () => {
      setLastPingAt(Date.now());
    });
    const offSos = socketService.on('sos:alert', () => {
      // A watcher view confirms SOS state on our own journey too
      if (!isSosActive) {
        setDeviationAlert(false);
      }
    });

    return () => {
      offDeviation();
      offLocation();
      offSos();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey?.id]);

  // Nearest help points (police + hospital) around the current location
  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    api
      .get(`/help/nearby?lat=${coords[0]}&lng=${coords[1]}&radius=2000&types=police,hospital`)
      .then((res) => {
        if (!cancelled) setHelpPlaces(res.data ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [coords?.[0], coords?.[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const nearest = useMemo(() => {
    const withDist = helpPlaces
      .filter((p) => p.placeType === 'police' || p.placeType === 'hospital')
      .map((p) => ({ ...p, distM: haversineM(currentLocation ?? { lat: 0, lng: 0 }, p) }));
    const police = withDist.filter((p) => p.placeType === 'police').sort((a, b) => a.distM - b.distM)[0];
    const hospital = withDist.filter((p) => p.placeType === 'hospital').sort((a, b) => a.distM - b.distM)[0];
    return { police, hospital };
  }, [helpPlaces, currentLocation]);

  const progress = useMemo(() => {
    if (!journey || !currentLocation) return 0;
    const remaining = haversineM(currentLocation, { lat: journey.destLat, lng: journey.destLng });
    return Math.min(100, Math.max(0, (1 - remaining / Math.max(journey.distance, 1)) * 100));
  }, [journey, currentLocation]);

  const elapsedText = useMemo(() => {
    if (!journey) return '00:00';
    const secs = Math.max(0, Math.floor((now - new Date(journey.startedAt).getTime()) / 1000));
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [journey, now]);

  const etaText = useMemo(() => {
    if (!journey) return '—';
    const remainingSecs = Math.max(0, journey.duration * (1 - progress / 100));
    return formatDuration(remainingSecs / 60);
  }, [journey, progress]);

  const handleTriggerSos = async (auto = false) => {
    if (!journey) return;
    const lat = coords?.[0] ?? journey.originLat;
    const lng = coords?.[1] ?? journey.originLng;
    try {
      const res = await api.post('/sos', { journeyId: journey.id, lat, lng, accuracy: accuracy ?? undefined });
      triggerSos(res.data.sosEvent);
      socketService.emit('sos:triggered', { journeyId: journey.id, lat, lng });
      setDeviationAlert(false);
      toast.error(
        auto
          ? 'SOS sent automatically — no response to the deviation check.'
          : 'SOS activated. Your trusted contacts have been alerted.',
        { duration: 8000 }
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not activate SOS. Try again.';
      toast.error(message);
    }
  };

  const handleResolveSos = async () => {
    if (!activeSos) return;
    setIsResolving(true);
    try {
      await api.post(`/sos/${activeSos.id}/resolve`);
      cancelSos();
      socketService.emit('sos:resolved', { journeyId: journey?.id });
      toast.success('Marked as safe. Your contacts have been notified.');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not resolve the SOS.';
      toast.error(message);
    } finally {
      setIsResolving(false);
    }
  };

  const handleArrived = async () => {
    if (!journey) return;
    setIsEnding(true);
    try {
      await api.post(`/journeys/${journey.id}/end`);
      endJourney();
      toast.success('Journey completed — you have arrived safely!');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not end the journey.';
      toast.error(message);
      setIsEnding(false);
    }
  };

  const shareUrl =
    journey && typeof window !== 'undefined' ? `${window.location.origin}/track/${journey.shareToken}` : '';

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Share link copied — send it to your trusted contacts.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  // ── Loading / empty states ────────────────────────────────────
  if (isRestoring) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-4rem)] lg:h-screen gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <p className="text-sm text-muted-foreground">Checking for an active journey…</p>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-4rem)] lg:h-screen p-6 text-center">
        <MapIcon size={64} className="text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-heading font-bold mb-2">No Active Journey</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          You aren&apos;t currently tracking a journey. Plan a route to start a safe journey with live tracking.
        </p>
        <Link href="/route">
          <Button size="lg" className="font-bold">Plan a Route Now</Button>
        </Link>
      </div>
    );
  }

  // ── Active journey ────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] lg:min-h-screen">
      {/* SOS active banner */}
      {isSosActive && (
        <div className="bg-destructive text-destructive-foreground px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-30">
          <div className="flex items-center gap-3">
            <Siren className="w-6 h-6 animate-pulse flex-shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-wide">SOS Active</p>
              <p className="text-sm opacity-90">Your trusted contacts are being alerted with your live location.</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-white/60 text-white hover:bg-white/10 flex-shrink-0"
            onClick={handleResolveSos}
            disabled={isResolving}
          >
            {isResolving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            I&apos;m Safe — Resolve SOS
          </Button>
        </div>
      )}

      {/* Live map */}
      <div className="relative h-[36vh] md:h-[42vh] flex-shrink-0 bg-surface/5 border-b">
        <SafeMap center={[journey.originLat, journey.originLng]} zoom={14} scrollWheelZoom style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {currentLocation && <Recenter center={[currentLocation.lat, currentLocation.lng]} />}
          <Polyline positions={journey.routeGeometry ?? []} pathOptions={{ color: '#38BDF8', weight: 5, opacity: 0.85 }} />
          <CircleMarker
            center={[journey.originLat, journey.originLng]}
            radius={7}
            pathOptions={{ color: '#38BDF8', fillColor: '#38BDF8', fillOpacity: 0.9, weight: 2 }}
          />
          <CircleMarker
            center={[journey.destLat, journey.destLng]}
            radius={7}
            pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 0.9, weight: 2 }}
          />
          {currentLocation && (
            <>
              <Circle
                center={[currentLocation.lat, currentLocation.lng]}
                radius={accuracy ?? 25}
                pathOptions={{ color: '#38BDF8', fillColor: '#38BDF8', fillOpacity: 0.15, weight: 1 }}
              />
              <CircleMarker
                center={[currentLocation.lat, currentLocation.lng]}
                radius={8}
                pathOptions={{ color: '#ffffff', fillColor: '#38BDF8', fillOpacity: 1, weight: 3 }}
              />
            </>
          )}
        </SafeMap>

        {locationError && (
          <div className="absolute top-3 left-3 right-3 bg-warning/90 text-warning-foreground text-xs font-medium px-3 py-2 rounded-lg z-[500]">
            {locationError}
          </div>
        )}
      </div>

      {/* Panel */}
      <div className="flex-1 p-4 md:p-6 pb-8 lg:pb-6">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-6 items-center md:items-stretch">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <SOSButton onActivate={() => handleTriggerSos(false)} />
            <p className="text-[11px] text-muted-foreground text-center max-w-[130px]">
              Hold 2 seconds to alert your trusted contacts
            </p>
          </div>

          <div className="flex-1 w-full">
            <JourneyPanel
              elapsedTime={elapsedText}
              eta={etaText}
              progress={progress}
              nearestPolice={
                nearest.police
                  ? { name: nearest.police.name, distance: `${Math.round(nearest.police.distM / 100) / 10} km` }
                  : undefined
              }
              nearestHospital={
                nearest.hospital
                  ? { name: nearest.hospital.name, distance: `${Math.round(nearest.hospital.distM / 100) / 10} km` }
                  : undefined
              }
              onArrived={handleArrived}
              className={isEnding ? 'pointer-events-none opacity-60' : ''}
            />
          </div>
        </div>

        {/* Share link */}
        <div className="max-w-3xl mx-auto mt-4 bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-sm flex items-center gap-2">
                <Share2 size={15} className="text-primary" /> Live location sharing
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {lastPingAt
                  ? `Location shared · last update ${Math.max(0, Math.round((now - lastPingAt) / 1000))}s ago`
                  : 'Waiting for the first location update…'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 flex-shrink-0 border-primary/40 text-primary hover:bg-primary/10" onClick={copyShareLink}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        </div>
      </div>

      {/* Deviation check-in modal */}
      <DeviationAlert
        isOpen={deviationAlert && !isSosActive}
        onDismiss={() => setDeviationAlert(false)}
        onTimeout={() => handleTriggerSos(true)}
      />
    </div>
  );
}
