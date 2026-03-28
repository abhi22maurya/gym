import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Save a posture score
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, score, feedback } = req.body;
    const log = await prisma.postureLog.create({ data: { userId, score, feedback } });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save posture log' });
  }
});

// Get posture logs for user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.postureLog.findMany({
      where: { userId: req.params.userId as string },
      orderBy: { date: 'desc' },
      take: 14,
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posture logs' });
  }
});

export default router;
