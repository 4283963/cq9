import { Router, type Request, type Response } from 'express';
import {
  createSession,
  submitOperation,
  finishSession,
  getSession,
  listSessions,
  getBoreholes,
} from '../controllers/drillController.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => createSession(req, res));
router.get('/', async (req: Request, res: Response) => listSessions(req, res));
router.get('/:id', async (req: Request, res: Response) => getSession(req, res));
router.get('/:id/boreholes', async (req: Request, res: Response) => getBoreholes(req, res));
router.post('/:id/operations', async (req: Request, res: Response) => submitOperation(req, res));
router.post('/:id/finish', async (req: Request, res: Response) => finishSession(req, res));

export default router;
