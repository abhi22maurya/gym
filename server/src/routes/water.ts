import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Add water intake
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, amountMl } = req.body;
    const log = await prisma.waterLog.create({ data: { userId, amountMl } });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log water' });
  }
});

// Get today's total water intake
router.get('/:userId/today', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const logs = await prisma.waterLog.findMany({
      where: { userId: req.params.userId as string, date: { gte: today, lt: tomorrow } },
    });
    const totalMl = logs.reduce((sum: number, l: { amountMl: number }) => sum + l.amountMl, 0);
    res.json({ totalMl, logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch water logs' });
  }
});

export default router;
