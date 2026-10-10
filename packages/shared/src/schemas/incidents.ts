import { z } from 'zod';

// ── Incident category ────────────────────────────────────────
export const incidentCategoryEnum = z.enum([
  'HARASSMENT',
  'SUSPICIOUS_ACTIVITY',
  'POOR_LIGHTING',
  'OTHER',
]);
export type IncidentCategory = z.infer<typeof incidentCategoryEnum>;

// ── Incident severity (internal scoring) ─────────────────────
export const incidentSeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type IncidentSeverity = z.infer<typeof incidentSeverityEnum>;

// ── Create incident ──────────────────────────────────────────
export const createIncidentSchema = z.object({
  category: incidentCategoryEnum,
  description: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  severity: incidentSeverityEnum.optional().default('MEDIUM'),
});
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

// ── Query incidents ──────────────────────────────────────────
export const queryIncidentsSchema = z.object({
  south: z.coerce.number().min(-90).max(90).optional(),
  west: z.coerce.number().min(-180).max(180).optional(),
  north: z.coerce.number().min(-90).max(90).optional(),
  east: z.coerce.number().min(-180).max(180).optional(),
  category: incidentCategoryEnum.optional(),
  since: z.string().datetime().optional(),
});
export type QueryIncidentsInput = z.infer<typeof queryIncidentsSchema>;

// ── Incident response (reporter never exposed) ──────────────
export interface IncidentResponse {
  id: string;
  category: IncidentCategory;
  description: string | null;
  lat: number;
  lng: number;
  severity: IncidentSeverity;
  isDemo: boolean;
  createdAt: string;
}

// ── Help place types ─────────────────────────────────────────
export const helpPlaceTypeEnum = z.enum([
  'police',
  'hospital',
  'clinic',
  'pharmacy',
  'active_place',
]);
export type HelpPlaceType = z.infer<typeof helpPlaceTypeEnum>;

// ── Help place response ──────────────────────────────────────
export interface HelpPlaceResponse {
  id: string;
  name: string;
  type: HelpPlaceType;
  lat: number;
  lng: number;
  phone: string | null;
  distance: number; // meters from query point
  openNow: boolean | null;
}

// ── Help nearby query ────────────────────────────────────────
export const helpNearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(5000).default(2000),
  types: z.string().optional(), // comma-separated
});
export type HelpNearbyQuery = z.infer<typeof helpNearbySchema>;
