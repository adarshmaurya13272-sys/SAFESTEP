import { z } from 'zod';
import { coordinateSchema } from './common';

// ── Route compare request ────────────────────────────────────
export const routeCompareSchema = z.object({
  origin: coordinateSchema,
  destination: coordinateSchema,
  departureTime: z.string().datetime().optional(),
});
export type RouteCompareInput = z.infer<typeof routeCompareSchema>;

// ── Safety score confidence ──────────────────────────────────
export const confidenceEnum = z.enum(['low', 'medium', 'high']);
export type Confidence = z.infer<typeof confidenceEnum>;

// ── Safety factor ────────────────────────────────────────────
export interface SafetyFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  dataAvailable: boolean;
}

// ── Safety score result ──────────────────────────────────────
export interface SafetyScore {
  score: number;
  confidence: Confidence;
  factors: SafetyFactor[];
}

// ── Route response ───────────────────────────────────────────
export interface RouteResponse {
  id: string;
  geometry: [number, number][]; // [lat, lng][]
  distance: number; // meters
  duration: number; // seconds
  safetyScore: SafetyScore;
  isRecommended: boolean;
}

// ── Geocode query ────────────────────────────────────────────
export const geocodeQuerySchema = z.object({
  q: z.string().min(2).max(200),
});
export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;

// ── Geocode result ───────────────────────────────────────────
export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}
