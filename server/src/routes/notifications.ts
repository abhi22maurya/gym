import { Router, Request, Response } from 'express';
import webpush from 'web-push';
import prisma from '../lib/prisma';

const router = Router();

// Note: In production, generate real VAPID keys via `npx web-push generate-vapid-keys` and inject via .env
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BM_aixC839y2U5JXXvM2aVbO0E3T3RzXb3I2-i--7NqfUv7A9hU8w2Y_b8w6R1R5y0W8A6Y5a3A6V5D4Q6S5E4a';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'dummy_private_key_replace_me_in_prod';

// Ignore setup error if building locally without proper keys
try {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    vapidPublicKey,
    vapidPrivateKey
  );
} catch (e) {
  console.warn('[Web-Push] VAPID keys missing or invalid. Push notifications will fail.');
}

// Subscribe to push notifications
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { userId, subscription } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // Basic logic to prevent duplicate subscriptions for the exact same endpoint
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint: subscription.endpoint, userId }
    });

    if (!existing) {
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      });
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Demo endpoint to trigger a water reminder
router.post('/send-water-reminder', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    const subs = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    const payload = JSON.stringify({
      title: 'Water Reminder 💧',
      body: 'You are lagging behind your daily water goal. Drink a glass of water now!'
    });

    for (const sub of subs) {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      }, payload).catch(async (err: any) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired/invalid, remove from DB
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      });
    }

    res.json({ success: true, sentTo: subs.length });
  } catch (error) {
    console.error('Push send error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export default router;
