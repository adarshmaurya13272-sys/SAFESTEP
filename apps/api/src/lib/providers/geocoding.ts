import { env } from '../../config/env';
import { logger } from '../logger';

export interface GeocodingResult {
  displayName: string;
  lat: number;
  lng: number;
  type: string;
}

export interface GeocodingProvider {
  search(query: string): Promise<GeocodingResult[]>;
}

export class NominatimProvider implements GeocodingProvider {
  private cache = new Map<string, { data: GeocodingResult[], expires: number }>();

  async search(query: string): Promise<GeocodingResult[]> {
    if (env.DEMO_MODE === 'true') {
      try {
        const data = require('../fixtures/nominatim-response.json');
        return data;
      } catch (e) {
        logger.warn('Demo mode nominatim fixture not found');
      }
    }

    const cached = this.cache.get(query);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const baseUrl = env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';
      const url = `${baseUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=5`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SafeStepApp/1.0',
        }
      });
      const data = (await response.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
        type: string;
      }>;
      
      const results = data.map((item: any) => ({
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
      }));

      this.cache.set(query, {
        data: results,
        expires: Date.now() + 5 * 60 * 1000 // 5 min TTL
      });

      return results;
    } catch (error) {
      logger.error({ error, query }, 'Geocoding failed');
      return [];
    }
  }
}
