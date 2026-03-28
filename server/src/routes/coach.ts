import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import prisma from '../lib/prisma';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

import { getCache, setCache } from '../lib/redis';

const systemPrompt = `You are an elite AI personal fitness coach specializing in Indian athletes. 
You analyze fitness tracking data and provide extremely specific, actionable recommendations.
Your tone is direct, motivating and data-driven. Keep responses under 3 sentences.
Focus on the most critical insight that will have the highest impact right now.`;

async function getUserDataContext(userId: string) {
  const [recentWorkouts, recentDiet, latestMetric, recentSleep, recentPosture] = await Promise.all([
    prisma.workoutLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 10 }),
    prisma.dietLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 7 }),
    prisma.bodyMetric.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.sleepLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 3 }),
    prisma.postureLog.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
  ]);
  return JSON.stringify({
    recentWorkouts,
    recentDiet,
    latestBodyMetric: latestMetric,
    recentSleep,
    latestPostureScore: recentPosture?.score,
  }, null, 2);
}

// POST /api/coach/suggest — generate smart AI coaching tips (Standard JSON)
router.post('/suggest', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const cacheKey = `coach:${userId}:${new Date().toISOString().split('T')[0]}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ suggestion: cached });

    const dataContext = await getUserDataContext(userId);
    const userPrompt = `Based on this athlete's recent data:\n${dataContext}\n\nProvide ONE critical coaching insight covering either: nutrition gaps, workout progression, recovery, or posture. Be specific with numbers.`;

    const stream = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 300,
      stream: true,
    });

    let suggestion = '';
    for await (const chunk of stream) {
      suggestion += chunk.choices[0]?.delta?.content || '';
    }
    if (!suggestion.trim()) suggestion = 'Stay consistent! Track your workouts and diet daily for progress.';
    
    await setCache(cacheKey, suggestion, 3600); // 1-hour cache
    res.json({ suggestion });
  } catch (error) {
    console.error('Coach AI error:', error);
    res.status(500).json({ error: 'Coach engine failed', suggestion: 'Stay consistent and track your progress daily!' });
  }
});

// GET /api/coach/suggest-stream — SSE Streaming endpoint
router.get('/suggest-stream', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const cacheKey = `coach:${userId}:${new Date().toISOString().split('T')[0]}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      res.write(`data: ${JSON.stringify({ token: cached })}\n\n`);
      res.end();
      return;
    }

    const dataContext = await getUserDataContext(userId);
    const userPrompt = `Based on this athlete's recent data:\n${dataContext}\n\nProvide ONE critical coaching insight covering either: nutrition gaps, workout progression, recovery, or posture. Be specific with numbers.`;

    const stream = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 300,
      stream: true,
    });

    let fullSuggestion = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullSuggestion += text;
        res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
      }
    }
    
    if (fullSuggestion.trim()) await setCache(cacheKey, fullSuggestion.trim(), 3600);
    res.end();
  } catch (error) {
    console.error('Coach SSE error:', error);
    res.write(`data: ${JSON.stringify({ token: "Stay consistent and track your progress daily!" })}\n\n`);
    res.end();
  }
});

// POST /api/coach/analyze-food — analyze food from image (base64)
router.post('/analyze-food', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mealContext } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
            {
              type: 'text',
              text: `Analyze this food image and estimate nutritional values. ${mealContext || ''}
              
              Return ONLY a JSON object with:
              {
                "mealName": "name of the dish",
                "calories": number,
                "proteinG": number,
                "carbsG": number,
                "fatG": number,
                "confidence": "low|medium|high",
                "notes": "brief notes on estimation"
              }`,
            },
          ] as any,
        },
      ],
      temperature: 0.3,
      max_completion_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const foodData = jsonMatch ? JSON.parse(jsonMatch[0]) : { mealName: 'Unknown', calories: 0 };
    res.json(foodData);
  } catch (error) {
    console.error('Food analysis error:', error);
    res.status(500).json({ error: 'Food analysis failed', mealName: 'Unknown', calories: 0 });
  }
});

// POST /api/coach/voice-parse — parse voice input to log action
router.post('/voice-parse', async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'transcript required' });

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `Parse fitness-related voice commands into structured data. 
          Return a JSON with: { "action": "log_workout|log_meal|log_water|unknown", "data": { ...relevant fields } }`,
        },
        { role: 'user', content: `Voice input: "${transcript}"` },
      ],
      temperature: 0.2,
      max_completion_tokens: 200,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { action: 'unknown', data: {} };
    res.json(parsed);
  } catch (error) {
    console.error('Voice parse error:', error);
    res.status(500).json({ action: 'unknown', data: {} });
  }
});

export default router;
