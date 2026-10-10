import { z } from 'zod';

// Load .env from the api directory when present (Docker injects env vars instead)
try {
  process.loadEnvFile();
} catch {
  // .env file is optional
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.string().default('4000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  DEMO_MODE: z.string().optional().default('false'),
  DEMO_CENTER_LAT: z.string().optional().default('28.6139'),
  DEMO_CENTER_LNG: z.string().optional().default('77.2090'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  OSRM_BASE_URL: z.string().optional(),
  NOMINATIM_BASE_URL: z.string().optional(),
  OVERPASS_BASE_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
