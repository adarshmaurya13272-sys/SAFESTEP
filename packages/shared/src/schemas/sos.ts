import { z } from 'zod';
import { coordinateSchema } from './common';

// ── SOS status ───────────────────────────────────────────────
export const sosStatusEnum = z.enum(['ACTIVE', 'RESOLVED']);
export type SosStatus = z.infer<typeof sosStatusEnum>;

// ── Create SOS ───────────────────────────────────────────────
export const createSosSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  journeyId: z.string().uuid().optional(),
});
export type CreateSosInput = z.infer<typeof createSosSchema>;

// ── SOS response ─────────────────────────────────────────────
export interface SosEventResponse {
  id: string;
  status: SosStatus;
  lat: number;
  lng: number;
  accuracy: number | null;
  journeyId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
