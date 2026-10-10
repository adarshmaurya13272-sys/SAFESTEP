import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Demo@1234', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@safestep.app' },
    update: {},
    create: {
      email: 'demo@safestep.app',
      name: 'Demo User',
      phone: '1234567890',
      passwordHash,
    },
  });

  const contact1 = await prisma.trustedContact.create({
    data: {
      userId: user.id,
      name: 'Alice Contact',
      phone: '9876543210',
      status: 'ACCEPTED',
      inviteToken: crypto.randomBytes(32).toString('hex'),
      consentedAt: new Date(),
    }
  });

  const contact2 = await prisma.trustedContact.create({
    data: {
      userId: user.id,
      name: 'Bob Contact',
      email: 'bob@example.com',
      status: 'ACCEPTED',
      inviteToken: crypto.randomBytes(32).toString('hex'),
      consentedAt: new Date(),
    }
  });

  const centerLat = parseFloat(process.env.DEMO_CENTER_LAT || '28.6139');
  const centerLng = parseFloat(process.env.DEMO_CENTER_LNG || '77.2090');

  const categories = ['HARASSMENT', 'SUSPICIOUS_ACTIVITY', 'POOR_LIGHTING', 'OTHER'];
  const severities = ['LOW', 'MEDIUM', 'HIGH'];

  const incidentsData = [];
  for (let i = 0; i < 50; i++) {
    const latOffset = (Math.random() - 0.5) * 0.1;
    const lngOffset = (Math.random() - 0.5) * 0.1;
    incidentsData.push({
      category: categories[Math.floor(Math.random() * categories.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset,
      isDemo: true,
      reporterId: user.id,
      description: 'Sample incident description ' + i,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.incident.createMany({ data: incidentsData });
    
    const journey = await tx.journey.create({
      data: {
        userId: user.id,
        status: 'COMPLETED',
        originLat: centerLat,
        originLng: centerLng,
        destLat: centerLat + 0.05,
        destLng: centerLng + 0.05,
        routeGeometry: [[centerLat, centerLng], [centerLat + 0.02, centerLng + 0.02], [centerLat + 0.05, centerLng + 0.05]],
        distance: 5000,
        duration: 1800,
        shareToken: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(),
        startedAt: new Date(Date.now() - 3600 * 1000),
        endedAt: new Date(),
      }
    });

    await tx.locationPing.createMany({
      data: [
        { journeyId: journey.id, lat: centerLat, lng: centerLng },
        { journeyId: journey.id, lat: centerLat + 0.02, lng: centerLng + 0.02 },
        { journeyId: journey.id, lat: centerLat + 0.05, lng: centerLng + 0.05 },
      ]
    });
  });

  console.log('Seed completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
