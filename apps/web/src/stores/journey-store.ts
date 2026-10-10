import { create } from 'zustand';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface JourneyData {
  id: string;
  shareToken: string;
  status: string; // ACTIVE | COMPLETED | SOS
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  routeGeometry: [number, number][]; // [lat, lng][]
  distance: number; // meters
  duration: number; // seconds
  startedAt: string;
}

export interface SosEvent {
  id: string;
  lat: number;
  lng: number;
  status: string;
  createdAt: string;
}

interface JourneyState {
  journey: JourneyData | null;
  currentLocation: RoutePoint | null;
  locationSource: 'gps' | 'fallback' | null;
  lastPingAt: number | null;
  isTracking: boolean;
  isSosActive: boolean;
  activeSos: SosEvent | null;
  deviationAlert: boolean;
  setJourney: (journey: JourneyData | null) => void;
  updateLocation: (location: RoutePoint, source?: 'gps' | 'fallback') => void;
  setLastPingAt: (at: number) => void;
  startJourney: (journey: JourneyData) => void;
  endJourney: () => void;
  triggerSos: (sos: SosEvent) => void;
  cancelSos: () => void;
  setDeviationAlert: (active: boolean) => void;
}

export const useJourneyStore = create<JourneyState>((set) => ({
  journey: null,
  currentLocation: null,
  locationSource: null,
  lastPingAt: null,
  isTracking: false,
  isSosActive: false,
  activeSos: null,
  deviationAlert: false,
  setJourney: (journey) =>
    set({ journey, isTracking: journey ? journey.status === 'ACTIVE' || journey.status === 'SOS' : false }),
  updateLocation: (location, source) =>
    set((state) => ({
      currentLocation: location,
      locationSource: source ?? state.locationSource,
    })),
  setLastPingAt: (at) => set({ lastPingAt: at }),
  startJourney: (journey) => set({ journey, isTracking: true }),
  endJourney: () =>
    set({
      journey: null,
      isTracking: false,
      isSosActive: false,
      activeSos: null,
      deviationAlert: false,
    }),
  triggerSos: (sos) => set({ isSosActive: true, activeSos: sos }),
  cancelSos: () => set({ isSosActive: false, activeSos: null }),
  setDeviationAlert: (active) => set({ deviationAlert: active }),
}));
