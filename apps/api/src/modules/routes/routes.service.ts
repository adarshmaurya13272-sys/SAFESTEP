import { OsrmProvider } from '../../lib/providers/routing';
import { NominatimProvider } from '../../lib/providers/geocoding';
import { calculateSafetyScore } from '../../lib/safetyScore/safetyScore';
import { prisma } from '../../lib/prisma';
import { OverpassProvider } from '../../lib/providers/overpass';

export class RoutesService {
  private routingProvider = new OsrmProvider();
  private geocodingProvider = new NominatimProvider();
  private overpassProvider = new OverpassProvider();

  async compareRoutes(input: any) {
    const { originLat, originLng, destLat, destLng, departureTime } = input;
    const time = departureTime ? new Date(departureTime) : new Date();

    const osrmRoutes = await this.routingProvider.getRoutes(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng }
    );

    // Fetch context data roughly bounded by origin/dest (simplified logic)
    const latMin = Math.min(originLat, destLat) - 0.05;
    const latMax = Math.max(originLat, destLat) + 0.05;
    const lngMin = Math.min(originLng, destLng) - 0.05;
    const lngMax = Math.max(originLng, destLng) + 0.05;

    const incidents = await prisma.incident.findMany({
      where: {
        hidden: false,
        lat: { gte: latMin, lte: latMax },
        lng: { gte: lngMin, lte: lngMax },
      }
    });

    const midLat = (originLat + destLat) / 2;
    const midLng = (originLng + destLng) / 2;
    const helpPoints = await this.overpassProvider.getNearbyPlaces(midLat, midLng, 5000, ['police', 'hospital', 'clinic']);

    const enrichedRoutes = osrmRoutes.map(route => {
      const scoreResult = calculateSafetyScore({
        routeGeometry: route.geometry,
        departureTime: time,
        incidents,
        helpPoints: helpPoints.map(hp => ({ lat: hp.lat, lng: hp.lng, type: hp.placeType })),
        activityPoints: [], // Would fetch from somewhere
        environmentData: [], // Would fetch from somewhere
      });

      return {
        ...route,
        safetyScore: scoreResult.score,
        safetyConfidence: scoreResult.confidence,
        safetyFactors: scoreResult.factors,
      };
    });

    enrichedRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

    if (enrichedRoutes.length > 0) {
      (enrichedRoutes[0] as any).isRecommended = true;
    }

    return enrichedRoutes;
  }

  async geocode(query: string) {
    return this.geocodingProvider.search(query);
  }
}
