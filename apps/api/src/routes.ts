import { Router } from 'express';
import { healthRouter } from './routes/health';
import { createAssessmentRouter } from './features/assessment/routes';

export const apiRouter = Router();

// Health check
apiRouter.use(healthRouter);

// Assessment sessions feature router mounted at /assessments
apiRouter.use('/assessments', createAssessmentRouter());
