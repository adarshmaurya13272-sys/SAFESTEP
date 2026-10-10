'use client';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, PlusCircle, Hospital, Phone, Loader2, MapPin, Navigation, Pill, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useUserLocation } from '@/hooks/useUserLocation';
import { haversineM, cn } from '@/lib/utils';

interface HelpPlace {
  placeType: string;
  name: string;
  lat: number;
  lng: number;
  phone?: string | null;
  id?: string;
}

const TYPES = [
  { value: 'police', label: 'Police', icon: Shield },
  { value: 'hospital', label: 'Hospital', icon: Hospital },
  { value: 'clinic', label: 'Clinic', icon: PlusCircle },
  { value: 'pharmacy', label: 'Pharmacy', icon: Pill },
];

const typeIcon: Record<string, typeof Shield> = {
  police: Shield,
  hospital: Building2,
  clinic: PlusCircle,
  pharmacy: Pill,
};

export default function HelpPage() {
  const { coords, error: locationError } = useUserLocation();
  const [activeType, setActiveType] = useState<string>('police');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['help-nearby', coords?.[0].toFixed(3), coords?.[1].toFixed(3), activeType],
    queryFn: async () => {
      const res = await api.get(
        `/help/nearby?lat=${coords![0]}&lng=${coords![1]}&radius=5000&types=${activeType}`
      );
      return res.data as HelpPlace[];
    },
    enabled: !!coords,
  });

  const places = useMemo(() => {
    const list = (data ?? []).map((p) => ({
      ...p,
      distM: coords ? haversineM({ lat: coords[0], lng: coords[1] }, p) : 0,
    }));
    return list.sort((a, b) => a.distM - b.distM);
  }, [data, coords]);

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] lg:min-h-screen">
      <div className="p-4 md:p-6 bg-card border-b z-10 shadow-sm">
        <h1 className="text-2xl font-heading font-bold mb-1">Find Help</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Verified safe places near you, sorted by distance.
        </p>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
          {TYPES.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={activeType === value ? 'secondary' : 'outline'}
              size="sm"
              className={cn(
                'rounded-full flex-shrink-0',
                activeType === value && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
              onClick={() => setActiveType(value)}
            >
              <Icon size={14} className="mr-1.5" /> {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {locationError && (
          <p className="text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">{locationError}</p>
        )}

        {!coords || isLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            {coords ? 'Searching nearby places…' : 'Finding your location…'}
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="mx-auto mb-3 opacity-30" size={32} />
            <p>Could not load nearby places. The places service (Overpass API) may be unavailable — try again shortly.</p>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="mx-auto mb-3 opacity-30" size={32} />
            <p>No {TYPES.find((t) => t.value === activeType)?.label.toLowerCase()} places found within 5 km.</p>
          </div>
        ) : (
          places.map((place, i) => {
            const Icon = typeIcon[place.placeType] ?? Building2;
            const distanceKm = place.distM / 1000;
            return (
              <Card key={`${place.lat}-${place.lng}-${i}`} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{place.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {distanceKm < 1 ? `${Math.round(place.distM)} m` : `${distanceKm.toFixed(1)} km`} away
                      {place.phone ? ' · Tap to call' : ' · No phone listed'}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {place.phone ? (
                      <a
                        href={`tel:${place.phone}`}
                        className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-input bg-background text-primary hover:bg-accent transition-colors min-h-[44px] min-w-[44px]"
                        title={`Call ${place.name}`}
                      >
                        <Phone size={18} />
                      </a>
                    ) : null}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-input bg-background text-muted-foreground hover:bg-accent hover:text-primary transition-colors min-h-[44px] min-w-[44px]"
                      title="Get directions"
                    >
                      <Navigation size={18} />
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
