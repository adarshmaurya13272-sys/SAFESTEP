import { Server, Socket } from 'socket.io';
import { prisma } from '../../lib/prisma';
import { JourneysService } from '../journeys/journeys.service';

const journeysService = new JourneysService();
const lastUpdateMap = new Map<string, number>();

export const initSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('journey:join', async (data: { shareToken: string }) => {
      try {
        const journey = await prisma.journey.findUnique({
          where: { shareToken: data.shareToken }
        });
        if (journey) {
          socket.join(`journey:${journey.id}`);
          socket.emit('journey:joined', { journeyId: journey.id });
        } else {
          socket.emit('error', { message: 'Journey not found' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join journey' });
      }
    });

    socket.on('journey:location', async (data: { journeyId: string, lat: number, lng: number, accuracy?: number }) => {
      const now = Date.now();
      const lastUpdate = lastUpdateMap.get(data.journeyId) || 0;
      
      // Throttle: Max 1 per 5 seconds
      if (now - lastUpdate < 5000) {
        return;
      }
      lastUpdateMap.set(data.journeyId, now);

      try {
        await journeysService.addPing(null, data.journeyId, data);
        
        io.to(`journey:${data.journeyId}`).emit('journey:location_update', data);

        const isDeviating = await journeysService.checkDeviation(data.journeyId, data.lat, data.lng);
        if (isDeviating) {
          io.to(`journey:${data.journeyId}`).emit('journey:deviation_alert', { 
            message: 'User has deviated from the planned route',
            lat: data.lat,
            lng: data.lng
          });
        }

      } catch (error) {
        console.error('Failed to process location update', error);
      }
    });

    socket.on('journey:status', (data: { journeyId: string, status: string }) => {
      io.to(`journey:${data.journeyId}`).emit('journey:status_update', data);
    });

    socket.on('sos:triggered', (data: { journeyId: string, lat: number, lng: number }) => {
      if (data.journeyId) {
        io.to(`journey:${data.journeyId}`).emit('sos:alert', data);
      }
    });

    socket.on('sos:resolved', (data: { journeyId: string }) => {
      if (data.journeyId) {
        io.to(`journey:${data.journeyId}`).emit('sos:resolved', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
