import { z } from 'zod';

// ── Register ─────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).optional(),
  emergencyNote: z.string().max(500).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

// ── Login ────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ── Update profile ───────────────────────────────────────────
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  emergencyNote: z.string().max(500).optional().nullable(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ── Auth response ────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  emergencyNote: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  message: string;
}
