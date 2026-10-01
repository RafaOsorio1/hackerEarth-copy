import express, { Express } from 'express';
import cors from 'cors';
import { apiRouter } from './routes';
import { errorHandler } from './shared/middleware/error-handler';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // API router mounted under /api
  app.use('/api', apiRouter);

  // Global Error handling conforming to Constitution Principle VII
  app.use(errorHandler);

  return app;
}
