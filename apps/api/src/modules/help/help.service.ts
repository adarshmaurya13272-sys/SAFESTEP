import { prisma } from '../../lib/prisma';
import { OverpassProvider } from '../../lib/providers/overpass';

export class HelpService {
  private overpassProvider = new OverpassProvider();

  async getNearbyHelp(lat: number, lng: number, radius: number, types: string[]) {
    // Basic caching layer with HelpPlaceCache (could be optimized)
    const activeCache = await prisma.helpPlaceCache.findMany({
      where: {
        lat: { gte: lat - 0.05, lte: lat + 0.05 },
        lng: { gte: lng - 0.05, lte: lng + 0.05 },
        expiresAt: { gt: new Date() },
        placeType: { in: types }
      }
    });

    if (activeCache.length > 0) {
      return activeCache;
    }

    const places = await this.overpassProvider.getNearbyPlaces(lat, lng, radius, types);

    // Save to cache
    if (places.length > 0) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      const cacheData = places.map(p => ({
        placeType: p.placeType,
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        phone: p.phone,
        expiresAt
      }));

      // In real-world, we'd use createMany and handle duplicates better
      await prisma.helpPlaceCache.createMany({
        data: cacheData,
        skipDuplicates: true
      });
    }

    return places;
  }
}
