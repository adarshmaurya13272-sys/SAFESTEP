import { prisma } from '../../lib/prisma';
import crypto from 'crypto';
import { AppError } from '../../middleware/errorHandler';
import { isPointNearPolyline } from '../../lib/geo/geo';

export class JourneysService {
  async createJourney(userId: string, input: any) {
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const journey = await prisma.journey.create({
      data: {
        userId,
        originLat: input.originLat,
        originLng: input.originLng,
        destLat: input.destLat,
        destLng: input.destLng,
        routeGeometry: input.routeGeometry,
        distance: input.distance,
        duration: input.duration,
        shareToken,
        expiresAt,
        status: 'ACTIVE',
      }
    });

    if (input.contactIds && input.contactIds.length > 0) {
      await prisma.journeyContact.createMany({
        data: input.contactIds.map((contactId: string) => ({
          journeyId: journey.id,
          contactId,
        }))
      });
    }

    return journey;
  }

  async getJourneys(userId: string) {
    return prisma.journey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getJourney(userId: string, journeyId: string) {
    const journey = await prisma.journey.findUnique({
      where: { id: journeyId },
      include: {
        locationPings: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    if (!journey || journey.userId !== userId) {
      throw new AppError(404, 'Journey not found', 'NOT_FOUND');
    }

    return journey;
  }

  async endJourney(userId: string, journeyId: string) {
    const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
    if (!journey || journey.userId !== userId) {
      throw new AppError(404, 'Journey not found', 'NOT_FOUND');
    }

    return prisma.journey.update({
      where: { id: journeyId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date()
      }
    });
  }

  async addPing(userId: string | null, journeyId: string, ping: any) {
    const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
    if (!journey) {
      throw new AppError(404, 'Journey not found', 'NOT_FOUND');
    }
    if (userId && journey.userId !== userId) {
      throw new AppError(404, 'Journey not found', 'NOT_FOUND');
    }
    return prisma.locationPing.create({
      data: {
        journeyId,
        lat: ping.lat,
        lng: ping.lng,
        accuracy: ping.accuracy,
      }
    });
  }

  async getTrackingData(shareToken: string) {
    const journey = await prisma.journey.findUnique({
      where: { shareToken },
      include: {
        user: { select: { name: true } },
        locationPings: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    if (!journey || journey.expiresAt < new Date()) {
      throw new AppError(404, 'Tracking link invalid or expired', 'NOT_FOUND');
    }

    return {
      id: journey.id,
      userName: journey.user.name,
      status: journey.status,
      originLat: journey.originLat,
      originLng: journey.originLng,
      destLat: journey.destLat,
      destLng: journey.destLng,
      routeGeometry: journey.routeGeometry,
      startedAt: journey.startedAt,
      endedAt: journey.endedAt,
      lastPing: journey.locationPings[0] || null,
    };
  }

  async checkDeviation(journeyId: string, lat: number, lng: number) {
    const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
    if (!journey || !journey.routeGeometry) return false;

    const route = journey.routeGeometry as [number, number][];
    return !isPointNearPolyline({ lat, lng }, route, 200);
  }
}
