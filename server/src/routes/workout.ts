import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Get all workout logs for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const take = Number(limit) + 1;
    const logs = await prisma.workoutLog.findMany({
      where: { userId: req.params.userId as string },
      orderBy: { date: 'desc' },
      take,
      ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
    });
    const hasMore = logs.length > Number(limit);
    const data = hasMore ? logs.slice(0, Number(limit)) : logs;
    const nextCursor = hasMore ? data[data.length - 1].id : null;
    res.json({ data, nextCursor, hasMore });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workout logs' });
  }
});

// Log a new workout
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, exerciseName, sets, reps, weightKg, durationMin, notes } = req.body;
    const log = await prisma.workoutLog.create({
      data: { userId, exerciseName, sets, reps, weightKg, durationMin, notes },
    });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

export default router;
