import { z } from 'zod';
import { coordinateSchema } from './common';

// ── Journey status ───────────────────────────────────────────
export const journeyStatusEnum = z.enum(['ACTIVE', 'COMPLETED', 'SOS']);
export type JourneyStatus = z.infer<typeof journeyStatusEnum>;

// ── Create journey ───────────────────────────────────────────
export const createJourneySchema = z.object({
  origin: coordinateSchema,
  destination: coordinateSchema,
  routeGeometry: z.array(z.tuple([z.number(), z.number()])),
  distance: z.number().positive(),
  duration: z.number().positive(),
  contactIds: z.array(z.string().uuid()).max(5).optional(),
  checkInBy: z.string().datetime().optional(),
});
export type CreateJourneyInput = z.infer<typeof createJourneySchema>;

// ── Location ping ────────────────────────────────────────────
export const locationPingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  timestamp: z.string().datetime().optional(),
});
export type LocationPing = z.infer<typeof locationPingSchema>;

// ── Journey response ─────────────────────────────────────────
export interface JourneyResponse {
  id: string;
  status: JourneyStatus;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  routeGeometry: [number, number][];
  distance: number;
  duration: number;
  shareToken: string;
  startedAt: string;
  endedAt: string | null;
  checkInBy: string | null;
  eta: string | null;
}

// ── Tracking page response (public, limited fields) ──────────
export interface TrackingResponse {
  journeyId: string;
  status: JourneyStatus;
  routeGeometry: [number, number][];
  currentLocation: { lat: number; lng: number; accuracy?: number } | null;
  lastUpdated: string | null;
  eta: string | null;
  userName: string; // first name only for privacy
}
