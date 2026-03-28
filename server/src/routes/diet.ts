import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Get diet logs for a user on a specific date
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { date, cursor, limit = 20 } = req.query;
    const where: any = { userId: req.params.userId as string };
    if (date) {
      const day = new Date(date as string);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      where.date = { gte: day, lt: next };
    }
    const take = Number(limit) + 1;
    const logs = await prisma.dietLog.findMany({
      where,
      orderBy: { date: 'desc' },
      take,
      ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {}),
    });
    const hasMore = logs.length > Number(limit);
    const data = hasMore ? logs.slice(0, Number(limit)) : logs;
    const nextCursor = hasMore ? data[data.length - 1].id : null;
    res.json({ data, nextCursor, hasMore });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diet logs' });
  }
});

// Log a meal
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, mealName, calories, proteinG, carbsG, fatG, mealType, imageUrl, aiParsed } = req.body;
    const log = await prisma.dietLog.create({
      data: { userId, mealName, calories, proteinG, carbsG, fatG, mealType, imageUrl, aiParsed },
    });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log meal' });
  }
});

export default router;
