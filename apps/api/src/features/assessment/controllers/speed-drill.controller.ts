import { Request, Response, NextFunction } from 'express';
import { SpeedDrillService } from '../services/speed-drill.service';
import { SessionParamsSchema } from '../schemas/assessment.schema';

export class SpeedDrillController {
  constructor(private readonly speedDrillService: SpeedDrillService) {}

  createSpeedDrill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: parentSessionId } = SessionParamsSchema.parse(req.params);
      const result = await this.speedDrillService.createSpeedDrill(parentSessionId);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };
}
