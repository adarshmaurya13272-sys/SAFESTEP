import { prisma } from '../../lib/prisma';
import { roundCoords } from '../../lib/geo/geo';
import { AppError } from '../../middleware/errorHandler';
import Filter from 'bad-words';

const filter = new Filter();

export class IncidentsService {
  async createIncident(reporterId: string, input: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.incident.count({
      where: {
        reporterId,
        createdAt: { gte: today }
      }
    });

    if (count >= 5) {
      throw new AppError(429, 'Rate limit exceeded: Max 5 incidents per day', 'RATE_LIMIT_EXCEEDED');
    }

    const { lat, lng } = roundCoords(input.lat, input.lng, 50);

    let cleanDescription = null;
    if (input.description) {
      cleanDescription = filter.clean(input.description);
    }

    const incident = await prisma.incident.create({
      data: {
        reporterId,
        category: input.category,
        description: cleanDescription,
        lat,
        lng,
        severity: input.severity,
      },
      select: {
        id: true,
        category: true,
        description: true,
        lat: true,
        lng: true,
        severity: true,
        isDemo: true,
        createdAt: true,
      }
    });

    return incident;
  }

  async getIncidents(query: any) {
    const where: any = { hidden: false };
    
    if (query.bbox) {
      const [minLng, minLat, maxLng, maxLat] = query.bbox.split(',').map(Number);
      where.lat = { gte: minLat, lte: maxLat };
      where.lng = { gte: minLng, lte: maxLng };
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.since) {
      where.createdAt = { gte: new Date(query.since) };
    }

    const incidents = await prisma.incident.findMany({
      where,
      select: {
        id: true,
        category: true,
        description: true,
        lat: true,
        lng: true,
        severity: true,
        isDemo: true,
        createdAt: true,
      }
    });

    return incidents;
  }

  async flagIncident(incidentId: string) {
    const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) {
      throw new AppError(404, 'Incident not found', 'NOT_FOUND');
    }

    const flagsCount = incident.flagsCount + 1;
    const hidden = flagsCount >= 3;

    await prisma.incident.update({
      where: { id: incidentId },
      data: { flagsCount, hidden }
    });
  }
}
