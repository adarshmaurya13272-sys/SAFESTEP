import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import { getNotificationProvider } from '../../lib/providers/notification';
import { OverpassProvider, HelpPlace } from '../../lib/providers/overpass';

export class SosService {
  private overpassProvider = new OverpassProvider();
  private notificationProvider = getNotificationProvider();

  async triggerSos(userId: string, input: any) {
    const sosEvent = await prisma.sosEvent.create({
      data: {
        userId,
        journeyId: input.journeyId,
        lat: input.lat,
        lng: input.lng,
        accuracy: input.accuracy,
      }
    });

    if (input.journeyId) {
      const journey = await prisma.journey.findUnique({ where: { id: input.journeyId } });
      if (journey && journey.userId === userId) {
        await prisma.journey.update({
          where: { id: input.journeyId },
          data: { status: 'SOS' }
        });
      }
    }

    const contacts = await prisma.trustedContact.findMany({
      where: { userId, status: 'ACCEPTED' }
    });

    for (const contact of contacts) {
      await this.notificationProvider.send({
        userId,
        type: 'SOS_TRIGGERED',
        channel: contact.phone ? 'SMS' : 'EMAIL',
        recipient: contact.phone || contact.email!,
        payload: {
          sosId: sosEvent.id,
          lat: input.lat,
          lng: input.lng,
        }
      });
    }

    // SOS responses must stay fast: cap the nearby-help lookup so a slow
    // Overpass API never delays alerting.
    const helpPoints = await Promise.race([
      this.overpassProvider.getNearbyPlaces(input.lat, input.lng, 2000, ['police', 'hospital']),
      new Promise<HelpPlace[]>((resolve) => setTimeout(() => resolve([]), 2500)),
    ]);

    return { sosEvent, nearestHelpPoints: helpPoints };
  }

  async resolveSos(userId: string, sosId: string) {
    const sosEvent = await prisma.sosEvent.findUnique({ where: { id: sosId } });
    if (!sosEvent || sosEvent.userId !== userId) {
      throw new AppError(404, 'SOS event not found', 'NOT_FOUND');
    }

    const updated = await prisma.sosEvent.update({
      where: { id: sosId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });

    // Restore the journey to ACTIVE so trackers no longer see the SOS banner
    if (sosEvent.journeyId) {
      await prisma.journey.updateMany({
        where: { id: sosEvent.journeyId, status: 'SOS' },
        data: { status: 'ACTIVE' }
      });
    }

    const contacts = await prisma.trustedContact.findMany({
      where: { userId, status: 'ACCEPTED' }
    });

    for (const contact of contacts) {
      await this.notificationProvider.send({
        userId,
        type: 'SOS_RESOLVED',
        channel: contact.phone ? 'SMS' : 'EMAIL',
        recipient: contact.phone || contact.email!,
        payload: { sosId }
      });
    }

    return updated;
  }

  async getSosHistory(userId: string) {
    return prisma.sosEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
