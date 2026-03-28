import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/user/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bodyMetrics: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found. Onboarding required.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/user/onboard
router.post('/onboard', async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, email, age, weight, height, goalType } = req.body;

    // Use default email if missing (Clerk handles real email, but we need unique value)
    const safeEmail = email || `${userId}@example.com`;

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { name, age: Number(age), weight: Number(weight), height: Number(height), goalType },
      create: {
        id: userId,
        name: name || 'User',
        email: safeEmail,
        age: Number(age),
        weight: Number(weight),
        height: Number(height),
        goalType
      }
    });

    // Log the initial weight
    if (weight) {
      // Check if we already logged weight today for this user to prevent duplicates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existing = await prisma.bodyMetric.findFirst({
        where: {
          userId,
          date: { gte: today }
        }
      });

      if (!existing) {
        await prisma.bodyMetric.create({
          data: {
            userId,
            weightKg: Number(weight),
            date: new Date()
          }
        });
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Error during onboarding:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
