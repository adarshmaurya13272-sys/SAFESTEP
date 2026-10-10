import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SAFESTEP API',
    version: '1.0.0',
    description: 'API documentation for SAFESTEP backend',
  },
  servers: [
    {
      url: '/api/v1',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        responses: {
          '200': {
            description: 'OK'
          }
        }
      }
    }
  }
};

export const setupSwagger = (app: Express) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
