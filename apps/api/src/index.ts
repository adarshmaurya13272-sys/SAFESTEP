import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { initSocket } from './modules/realtime/socketHandler';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import contactsRoutes from './modules/contacts/contacts.routes';
import routesRoutes from './modules/routes/routes.routes';
import journeysRoutes from './modules/journeys/journeys.routes';
import sosRoutes from './modules/sos/sos.routes';
import incidentsRoutes from './modules/incidents/incidents.routes';
import helpRoutes from './modules/help/help.routes';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Init Socket.IO
initSocket(io);

// Middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/me', usersRoutes);
apiRouter.use('/contacts', contactsRoutes);
apiRouter.use('/routes', routesRoutes);
apiRouter.use('/journeys', journeysRoutes);
apiRouter.use('/sos', sosRoutes);
apiRouter.use('/incidents', incidentsRoutes);
apiRouter.use('/help', helpRoutes);

app.use('/api/v1', apiRouter);

// Swagger Docs (assuming src/docs/swagger.ts exists)
import { setupSwagger } from './docs/swagger';
setupSwagger(app);

// Error Handler
app.use(errorHandler);

const PORT = env.API_PORT || 4000;

httpServer.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
