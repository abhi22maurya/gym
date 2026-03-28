import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Get body metrics for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { cursor, limit = 30 } = req.query;
    const take = Number(limit) + 1;
    const metrics = await prisma.bodyMetric.findMany({
      where: { userId: req.params.userId as string },
      orderBy: { date: 'desc' },
      take,
      ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
    });
    const hasMore = metrics.length > Number(limit);
    const data = hasMore ? metrics.slice(0, Number(limit)) : metrics;
    const nextCursor = hasMore ? data[data.length - 1].id : null;
    res.json({ data, nextCursor, hasMore });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch body metrics' });
  }
});

// Log body metrics
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, weightKg, bodyFatPct, chestCm, waistCm, armCm, thighCm } = req.body;
    const metric = await prisma.bodyMetric.create({
      data: { userId, weightKg, bodyFatPct, chestCm, waistCm, armCm, thighCm },
    });
    res.json(metric);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log body metrics' });
  }
});

export default router;
