'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Crosshair, Navigation, ShieldAlert, Route as RouteIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useDebounce } from '@/hooks/use-debounce';
import { useJourneyStore, JourneyData } from '@/stores/journey-store';
import { formatDistance, formatDuration } from '@/lib/utils';
import { SafeMap, TileLayer, CircleMarker, Polyline, Popup, Recenter } from '@/components/map/map-container';

const RouteCard = dynamic(() => import('@/components/route/route-card').then((m) => m.RouteCard), { ssr: false });

interface NamedPoint {
  name: string;
  lat: number;
  lng: number;
}

interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

interface SafetyFactor {
  name: string;
  score: number;
  weight: number;
  dataAvailable: boolean;
  description: string;
}

interface ComparedRoute {
  geometry: [number, number][];
  distance: number;
  duration: number;
  safetyScore: number;
  safetyConfidence: 'low' | 'medium' | 'high';
  safetyFactors: SafetyFactor[];
  isRecommended?: boolean;
}

/** Uniformly thin a polyline so long routes don't create huge payloads. */
function thinGeometry(geometry: [number, number][], maxPoints: number): [number, number][] {
  if (geometry.length <= maxPoints) return geometry;
  const step = Math.ceil(geometry.length / maxPoints);
  const thinned: [number, number][] = [];
  for (let i = 0; i < geometry.length; i += step) {
    thinned.push(geometry[i]!);
  }
  const last = geometry[geometry.length - 1]!;
  if (thinned[thinned.length - 1] !== last) thinned.push(last);
  return thinned;
}

export default function RoutePage() {
  const router = useRouter();
  const startJourney = useJourneyStore((s) => s.startJourney);
  const { coords: currentCoords, error: locationError, source: locationSource } = useUserLocation();

  const [origin, setOrigin] = useState<NamedPoint | null>(null);
  const [destination, setDestination] = useState<NamedPoint | null>(null);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [routes, setRoutes] = useState<ComparedRoute[] | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const searchToken = useRef(0);

  // Default the origin to the current location once GPS resolves
  useEffect(() => {
    if (currentCoords && !origin && !routes) {
      setOrigin({ name: 'My Location', lat: currentCoords[0], lng: currentCoords[1] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCoords]);

  // Live geocode suggestions
  useEffect(() => {
    if (!activeField || debouncedQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const token = ++searchToken.current;
    setIsSearching(true);
    api
      .get(`/routes/geocode?q=${encodeURIComponent(debouncedQuery.trim())}`)
      .then((res) => {
        if (token !== searchToken.current) return;
        setSuggestions(res.data ?? []);
      })
      .catch(() => {
        if (token === searchToken.current) setSuggestions([]);
      })
      .finally(() => {
        if (token === searchToken.current) setIsSearching(false);
      });
  }, [debouncedQuery, activeField]);

  const pickSuggestion = (result: GeocodeResult) => {
    const point: NamedPoint = { name: result.displayName, lat: result.lat, lng: result.lng };
    if (activeField === 'origin') setOrigin(point);
    if (activeField === 'destination') setDestination(point);
    setActiveField(null);
    setSuggestions([]);
    setQuery('');
  };

  const useCurrentLocation = () => {
    if (!currentCoords) {
      toast.error('Current location not available yet.');
      return;
    }
    setOrigin({
      name: locationSource === 'fallback' ? 'Demo city center' : 'My Location',
      lat: currentCoords[0],
      lng: currentCoords[1],
    });
    setActiveField(null);
  };

  const handleFindRoutes = async () => {
    if (!origin || !destination) {
      toast.error('Set both a starting point and a destination.');
      return;
    }
    setIsComparing(true);
    setRoutes(null);
    try {
      const res = await api.post('/routes/compare', {
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: destination.lat,
        destLng: destination.lng,
      });
      const data: ComparedRoute[] = res.data ?? [];
      if (data.length === 0) {
        toast.error('No routes found. The routing service may be unreachable — try again.');
      } else {
        setRoutes(data);
        setSelectedIdx(0);
        toast.success(`Found ${data.length} route option${data.length > 1 ? 's' : ''}`);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not compare routes. Is the API server running?';
      toast.error(message);
    } finally {
      setIsComparing(false);
    }
  };

  const handleStartJourney = async () => {
    if (!origin || !destination || !routes) return;
    const selected = routes[selectedIdx];
    setIsStarting(true);
    try {
      // Attach all accepted trusted contacts to the journey
      let contactIds: string[] = [];
      try {
        const contactsRes = await api.get('/contacts');
        contactIds = (contactsRes.data ?? [])
          .filter((c: any) => c.status === 'ACCEPTED')
          .map((c: any) => c.id);
      } catch {
        // Journey can still start without contacts
      }

      const res = await api.post('/journeys', {
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: destination.lat,
        destLng: destination.lng,
        routeGeometry: thinGeometry(selected.geometry, 1000),
        distance: selected.distance,
        duration: selected.duration,
        contactIds,
      });
      const journey: JourneyData = res.data;
      startJourney(journey);
      toast.success('Journey started. Stay safe!');
      router.push('/journey');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not start the journey.';
      toast.error(message);
      setIsStarting(false);
    }
  };

  const mapCenter = useMemo<[number, number]>(() => {
    if (origin && destination) return [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2];
    if (origin) return [origin.lat, origin.lng];
    if (currentCoords) return currentCoords;
    return [28.6139, 77.209];
  }, [origin, destination, currentCoords]);

  const selectedRoute = routes?.[selectedIdx] ?? null;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] lg:min-h-screen">
      {/* Search panel */}
      <div className="p-4 md:p-6 bg-card border-b z-10 shadow-sm relative">
        <h1 className="text-2xl font-heading font-bold mb-4">Plan Route</h1>
        <div className="space-y-3 relative max-w-2xl">
          <div className="flex items-center gap-3 relative">
            <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
            <input
              type="text"
              placeholder="Your current location"
              className="flex-1 bg-background border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              value={activeField === 'origin' ? query : origin?.name ?? ''}
              onFocus={() => setActiveField('origin')}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveField('origin');
              }}
            />
            <Button
              variant="outline"
              size="icon"
              className="rounded-full flex-shrink-0 border-primary/40 text-primary hover:bg-primary/10"
              title="Use my current location"
              onClick={useCurrentLocation}
            >
              <Crosshair size={18} />
            </Button>
          </div>
          <div className="absolute left-[5.5px] top-7 bottom-7 w-0.5 bg-border z-0" />
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm bg-destructive flex-shrink-0 z-10" />
            <input
              type="text"
              placeholder="Where to?"
              className="flex-1 bg-background border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
              value={activeField === 'destination' ? query : destination?.name ?? ''}
              onFocus={() => setActiveField('destination')}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveField('destination');
              }}
            />
          </div>

          {/* Geocode suggestions */}
          {activeField && (query.length >= 3 || activeField === 'origin') && (suggestions.length > 0 || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-30">
              {isSearching ? (
                <div className="flex items-center justify-center p-4 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Searching…
                </div>
              ) : (
                <ul className="max-h-60 overflow-auto py-1">
                  {activeField === 'origin' && (
                    <li
                      className="px-4 py-3 hover:bg-accent cursor-pointer flex items-center gap-3 border-b border-border"
                      onClick={useCurrentLocation}
                    >
                      <div className="bg-primary/20 p-2 rounded-full">
                        <Navigation className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">Your current location</span>
                    </li>
                  )}
                  {suggestions.map((result, i) => (
                    <li
                      key={`${result.lat}-${result.lng}-${i}`}
                      className="px-4 py-3 hover:bg-accent cursor-pointer flex items-center gap-3 border-b border-border last:border-0"
                      onClick={() => pickSuggestion(result)}
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{result.displayName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {locationError && (
          <p className="text-xs text-warning mt-3 max-w-2xl">{locationError}</p>
        )}

        <Button
          className="w-full mt-4 font-bold max-w-2xl"
          size="lg"
          onClick={handleFindRoutes}
          disabled={isComparing || !origin || !destination}
        >
          {isComparing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RouteIcon className="w-5 h-5 mr-2" />}
          {isComparing ? 'Finding safe routes…' : 'Find Safe Routes'}
        </Button>
      </div>

      {/* Map */}
      <div className="relative h-[38vh] md:h-[42vh] flex-shrink-0 bg-surface/5 border-b">
          <SafeMap center={mapCenter} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%', zIndex: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Recenter center={mapCenter} zoom={13} />
            {origin && (
              <CircleMarker
                center={[origin.lat, origin.lng]}
                radius={8}
                pathOptions={{ color: '#38BDF8', fillColor: '#38BDF8', fillOpacity: 1, weight: 3 }}
              >
                <Popup>Start: {origin.name}</Popup>
              </CircleMarker>
            )}
            {destination && (
              <CircleMarker
                center={[destination.lat, destination.lng]}
                radius={8}
                pathOptions={{ color: '#DC2626', fillColor: '#DC2626', fillOpacity: 1, weight: 3 }}
              >
                <Popup>Destination: {destination.name}</Popup>
              </CircleMarker>
            )}
            {routes?.map((route, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <Polyline
                  key={idx}
                  positions={route.geometry}
                  pathOptions={
                    isSelected
                      ? { color: '#38BDF8', weight: 6, opacity: 0.95 }
                      : { color: '#64748B', weight: 3, opacity: 0.55, dashArray: '6 8' }
                  }
                  eventHandlers={{ click: () => setSelectedIdx(idx) }}
                >
                  <Popup>
                    Route {idx + 1} · {formatDistance(route.distance)} · {formatDuration(route.duration / 60)} · Safety {route.safetyScore}/100
                  </Popup>
                </Polyline>
              );
            })}
          </SafeMap>

        {/* Disclaimer Overlay */}
        <div className="absolute bottom-3 left-3 right-3 md:left-auto md:max-w-md bg-warning/90 text-warning-foreground p-3 rounded-xl shadow-lg text-xs font-medium flex gap-2 items-start z-[500]">
          <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
          <p>Safety scores are estimates based on historical data. Always stay alert and trust your instincts.</p>
        </div>
      </div>

      {/* Route options */}
      {routes && routes.length > 0 && (
        <div className="flex-1 p-4 md:p-6">
          <div className="max-w-2xl mx-auto lg:mx-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-heading font-bold">Choose your route</h2>
              <span className="text-xs text-muted-foreground">Sorted by safety</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {routes.map((route, idx) => {
                const confidence =
                  route.safetyConfidence === 'high' ? 'High' : route.safetyConfidence === 'medium' ? 'Medium' : 'Low';
                const factorTexts = route.safetyFactors
                  .filter((f) => f.dataAvailable)
                  .map((f) => f.description);
                if (factorTexts.length === 0) {
                  factorTexts.push('Limited safety data available for this area');
                }
                return (
                  <RouteCard
                    key={idx}
                    id={String(idx)}
                    distance={formatDistance(route.distance)}
                    duration={formatDuration(route.duration / 60)}
                    safetyScore={route.safetyScore}
                    confidence={confidence as 'Low' | 'Medium' | 'High'}
                    factors={factorTexts}
                    isRecommended={route.isRecommended}
                    selected={idx === selectedIdx}
                    onClick={() => setSelectedIdx(idx)}
                  />
                );
              })}
            </div>
            <Button
              size="lg"
              className="w-full font-bold text-lg"
              onClick={handleStartJourney}
              disabled={isStarting}
            >
              {isStarting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Navigation className="w-5 h-5 mr-2" />}
              {isStarting ? 'Starting journey…' : `Start Safe Journey (Route ${selectedIdx + 1})`}
            </Button>
          </div>
        </div>
      )}

      {/* Empty hint */}
      {!routes && (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="text-muted-foreground max-w-sm">
            <MapPin size={44} className="mx-auto mb-4 opacity-20" />
            <p className="text-balance">
              {destination
                ? null
                : 'Enter a destination and tap “Find Safe Routes” to compare options by safety score.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
