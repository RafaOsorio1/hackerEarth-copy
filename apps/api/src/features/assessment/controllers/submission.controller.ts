import { Request, Response, NextFunction } from 'express';
import { EvaluationService } from '../../evaluation/services/evaluation.service';
import { SubmitAssessmentRequestSchema, SessionParamsSchema } from '../schemas/assessment.schema';

export class SubmissionController {
  constructor(private readonly evaluationService: EvaluationService) {}

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: sessionId } = SessionParamsSchema.parse(req.params);
      const { trigger, files } = SubmitAssessmentRequestSchema.parse(req.body);
      const result = await this.evaluationService.submitAssessment(sessionId, trigger, files);

      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  };

  getResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: sessionId } = SessionParamsSchema.parse(req.params);
      const result = await this.evaluationService.getEvaluationResult(sessionId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
