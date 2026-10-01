import { Request, Response, NextFunction } from 'express';
import { AssessmentService } from '../services/assessment.service';
import {
  CreateAssessmentRequestSchema,
  SaveSnapshotRequestSchema,
  SessionParamsSchema,
} from '../schemas/assessment.schema';

export class AssessmentController {
  constructor(private readonly service: AssessmentService) {}

  createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedInput = CreateAssessmentRequestSchema.parse(req.body);
      const session = await this.service.createSession(validatedInput);
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  };

  getWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = SessionParamsSchema.parse(req.params);
      const workspace = await this.service.getWorkspace(id);
      res.status(200).json(workspace);
    } catch (err) {
      next(err);
    }
  };

  saveSnapshot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = SessionParamsSchema.parse(req.params);
      const { files } = SaveSnapshotRequestSchema.parse(req.body);
      const result = await this.service.saveSnapshot(id, files);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
