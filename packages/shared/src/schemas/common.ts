import { z } from 'zod';

// ── Coordinate schema ────────────────────────────────────────
export const coordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Coordinate = z.infer<typeof coordinateSchema>;

// ── Pagination ───────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

// ── Bounding box ─────────────────────────────────────────────
export const bboxSchema = z.object({
  south: z.coerce.number().min(-90).max(90),
  west: z.coerce.number().min(-180).max(180),
  north: z.coerce.number().min(-90).max(90),
  east: z.coerce.number().min(-180).max(180),
});
export type BBox = z.infer<typeof bboxSchema>;

// ── API error format ─────────────────────────────────────────
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ── API success wrapper ──────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
}

// ── Disclaimer text (used across the app) ────────────────────
export const SAFETY_DISCLAIMER =
  'SAFESTEP assists but does not replace emergency services. In danger, call your local emergency number.';

export const DEMO_DATA_DISCLAIMER =
  'Demo data is illustrative; real deployment would need verified data sources, moderation and privacy safeguards.';

export const SCORE_DISCLAIMER =
  'Score is an indicator based on available data, not a guarantee of safety.';
