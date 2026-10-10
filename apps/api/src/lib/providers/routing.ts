import { env } from '../../config/env';
import { logger } from '../logger';
import { decodePoly } from '../geo/geo';

export interface RouteOption {
  geometry: [number, number][]; // decoded polyline
  distance: number;
  duration: number;
}

export interface RoutingProvider {
  getRoutes(origin: { lat: number, lng: number }, dest: { lat: number, lng: number }): Promise<RouteOption[]>;
}

export class OsrmProvider implements RoutingProvider {
  async getRoutes(origin: { lat: number, lng: number }, dest: { lat: number, lng: number }): Promise<RouteOption[]> {
    if (env.DEMO_MODE === 'true') {
      try {
        const data = require('../fixtures/osrm-response.json');
        return data.routes.map((r: any) => ({
          geometry: decodePoly(r.geometry),
          distance: r.distance,
          duration: r.duration
        })).slice(0, 3);
      } catch (e) {
        logger.warn('Demo mode osrm fixture not found');
      }
    }

    try {
      const baseUrl = env.OSRM_BASE_URL || 'http://router.project-osrm.org';
      const url = `${baseUrl}/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?alternatives=true&overview=full&geometries=polyline`;
      const response = await fetch(url);
      const data = (await response.json()) as {
        code: string;
        message?: string;
        routes: Array<{ geometry: string; distance: number; duration: number }>;
      };

      if (data.code !== 'Ok') {
        throw new Error(data.message || 'OSRM Error');
      }

      return data.routes.slice(0, 3).map((r: any) => ({
        geometry: decodePoly(r.geometry),
        distance: r.distance,
        duration: r.duration
      }));
    } catch (error) {
      logger.error({ error, origin, dest }, 'Routing failed');
      return [];
    }
  }
}
