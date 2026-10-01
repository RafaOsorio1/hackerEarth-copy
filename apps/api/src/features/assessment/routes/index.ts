import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { SubmissionController } from '../controllers/submission.controller';
import { SpeedDrillController } from '../controllers/speed-drill.controller';
import { AssessmentService } from '../services/assessment.service';
import { SpeedDrillService } from '../services/speed-drill.service';
import { EvaluationService } from '../../evaluation/services/evaluation.service';
import { AssessmentRepository } from '../repositories/assessment.repository';
import { EvaluationRepository } from '../../evaluation/repositories/evaluation.repository';
import { SandboxRunnerService } from '../../evaluation/services/sandbox-runner.service';
import { ChallengeGeneratorService } from '../../challenge/services/challenge-generator.service';
import { TechnologyLeakDetector } from '../../challenge/services/technology-leak-detector.service';
import { PreValidationService } from '../../challenge/services/pre-validation.service';

export function createAssessmentRouter(
  serviceOverride?: AssessmentService,
  evaluationServiceOverride?: EvaluationService,
  speedDrillServiceOverride?: SpeedDrillService,
): Router {
  const router = Router();

  const repository = new AssessmentRepository();
  const evaluationRepository = new EvaluationRepository();
  const sandboxRunner = new SandboxRunnerService();
  const leakDetector = new TechnologyLeakDetector();
  const preValidator = new PreValidationService(leakDetector, sandboxRunner);
  const challengeGenerator = new ChallengeGeneratorService(preValidator);

  const service = serviceOverride ?? new AssessmentService(repository, challengeGenerator);
  const evaluationService =
    evaluationServiceOverride ??
    new EvaluationService(repository, evaluationRepository, sandboxRunner);
  const speedDrillService = speedDrillServiceOverride ?? new SpeedDrillService(repository);

  const assessmentController = new AssessmentController(service);
  const submissionController = new SubmissionController(evaluationService);
  const speedDrillController = new SpeedDrillController(speedDrillService);

  // POST /api/assessments -> Start new session
  router.post('/', assessmentController.createSession);

  // GET /api/assessments/:id -> Retrieve workspace & instructions
  router.get('/:id', assessmentController.getWorkspace);

  // PUT /api/assessments/:id/snapshot -> Save auto-save snapshot
  router.put('/:id/snapshot', assessmentController.saveSnapshot);

  // POST /api/assessments/:id/submit -> Submit solution
  router.post('/:id/submit', submissionController.submit);

  // GET /api/assessments/:id/results -> Retrieve evaluation scorecard
  router.get('/:id/results', submissionController.getResults);

  // POST /api/assessments/:id/speed-drill -> Speed drill retry
  router.post('/:id/speed-drill', speedDrillController.createSpeedDrill);

  return router;
}
