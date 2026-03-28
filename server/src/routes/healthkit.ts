import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/healthkit/sync
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { userId, steps, sleepHours, activeCalories, date } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const targetDate = date ? new Date(date) : new Date();

    // Log sleep
    if (sleepHours) {
      await prisma.sleepLog.create({
        data: {
          userId,
          sleepHours,
          quality: 3, // Default average quality
          date: targetDate
        }
      });
    }

    // Log active calories as a workout to influence Rings
    if (activeCalories) {
      await prisma.workoutLog.create({
        data: {
          userId,
          exerciseName: 'Apple Health Activity',
          sets: 1,
          reps: 1,
          durationMin: 0,
          weightKg: activeCalories, // Hack: store calories here temporarily so it surfaces
          notes: `Steps: ${steps || 0}`,
          date: targetDate
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('HealthKit sync error:', error);
    res.status(500).json({ error: 'Failed to sync HealthKit data' });
  }
});

export default router;
