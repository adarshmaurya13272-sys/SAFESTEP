import { z } from 'zod';

// ── Contact status ───────────────────────────────────────────
export const contactStatusEnum = z.enum(['PENDING', 'ACCEPTED', 'REVOKED']);
export type ContactStatus = z.infer<typeof contactStatusEnum>;

// ── Create contact ───────────────────────────────────────────
export const createContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

// ── Contact response ─────────────────────────────────────────
export interface ContactResponse {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: ContactStatus;
  inviteToken: string;
  consentedAt: string | null;
  createdAt: string;
}
