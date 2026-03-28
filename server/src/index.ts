import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

import workoutRouter from './routes/workout';
import dietRouter from './routes/diet';
import metricsRouter from './routes/metrics';
import waterRouter from './routes/water';
import postureRouter from './routes/posture';
import coachRouter from './routes/coach';
import whatsappRouter from './routes/whatsapp';
import notificationsRouter from './routes/notifications';
import healthkitRouter from './routes/healthkit';
import userRouter from './routes/user';
import { requireAuth } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // 10mb for base64 images
app.use(express.urlencoded({ extended: true })); // For Twilio Webhooks
app.use(morgan('dev'));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Gym Tracker server is running', timestamp: new Date().toISOString() });
});

app.use('/api/workout', requireAuth, workoutRouter);
app.use('/api/diet', requireAuth, dietRouter);
app.use('/api/metrics', requireAuth, metricsRouter);
app.use('/api/water', requireAuth, waterRouter);
app.use('/api/posture', requireAuth, postureRouter);
app.use('/api/coach', requireAuth, coachRouter);
app.use('/api/whatsapp', whatsappRouter); // Exclude whatsapp from auth since it's a webhook
app.use('/api/notifications', requireAuth, notificationsRouter);
app.use('/api/healthkit', requireAuth, healthkitRouter);
app.use('/api/user', requireAuth, userRouter);

app.listen(PORT, () => {
  console.log(`🏋️  AI Gym Tracker server running on http://localhost:${PORT}`);
});

setInterval(() => {}, 1000 * 60 * 60);
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
