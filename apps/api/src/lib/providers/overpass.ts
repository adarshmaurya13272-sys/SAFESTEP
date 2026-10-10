import { env } from '../../config/env';
import { logger } from '../logger';
import { prisma } from '../prisma';

export interface HelpPlace {
  placeType: string;
  name: string;
  lat: number;
  lng: number;
  phone?: string;
}

export class OverpassProvider {
  async getNearbyPlaces(lat: number, lng: number, radiusM: number, types: string[]): Promise<HelpPlace[]> {
    if (env.DEMO_MODE === 'true') {
      try {
        const data = require('../fixtures/overpass-response.json');
        return data;
      } catch (e) {
        logger.warn('Demo mode overpass fixture not found');
      }
    }

    try {
      const typeQueries = types.map(t => {
        if (t === 'police') return `node["amenity"="police"](around:${radiusM},${lat},${lng});way["amenity"="police"](around:${radiusM},${lat},${lng});`;
        if (t === 'hospital') return `node["amenity"="hospital"](around:${radiusM},${lat},${lng});way["amenity"="hospital"](around:${radiusM},${lat},${lng});`;
        if (t === 'clinic') return `node["amenity"="clinic"](around:${radiusM},${lat},${lng});way["amenity"="clinic"](around:${radiusM},${lat},${lng});`;
        if (t === 'pharmacy') return `node["amenity"="pharmacy"](around:${radiusM},${lat},${lng});way["amenity"="pharmacy"](around:${radiusM},${lat},${lng});`;
        return '';
      }).join('');

      const query = `[out:json];(${typeQueries});out center;`;
      const baseUrl = env.OVERPASS_BASE_URL || 'https://overpass-api.de/api/interpreter';

      const response = await fetch(baseUrl, {
        method: 'POST',
        body: query
      });
      const data = (await response.json()) as {
        elements: Array<{
          lat?: number;
          lon?: number;
          center?: { lat: number; lon: number };
          tags?: { name?: string; phone?: string; amenity?: string };
        }>;
      };
      
      const places: HelpPlace[] = [];
      for (const element of data.elements) {
        const pLat = element.lat || element.center?.lat;
        const pLng = element.lon || element.center?.lon;
        if (!pLat || !pLng) continue;
        
        let pType = 'unknown';
        if (element.tags?.amenity === 'police') pType = 'police';
        else if (element.tags?.amenity === 'hospital') pType = 'hospital';
        else if (element.tags?.amenity === 'clinic') pType = 'clinic';
        else if (element.tags?.amenity === 'pharmacy') pType = 'pharmacy';
        
        places.push({
          placeType: pType,
          name: element.tags?.name || 'Unknown',
          lat: pLat,
          lng: pLng,
          phone: element.tags?.phone,
        });
      }
      return places;
    } catch (error) {
      logger.error({ error, lat, lng }, 'Overpass query failed');
      return [];
    }
  }
}
