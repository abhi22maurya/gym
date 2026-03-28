import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import prisma from '../lib/prisma';
import twilio from 'twilio';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MessagingResponse = twilio.twiml.MessagingResponse;

// POST /api/whatsapp/webhook — Receives messages from Twilio WhatsApp
router.post('/webhook', async (req: Request, res: Response) => {
  const twiml = new MessagingResponse();
  const { Body, From } = req.body;
  
  if (!Body) {
    twiml.message("I didn't quite catch that. Try 'I ate dal chawal' or 'Drank 500ml of water'.");
    res.type('text/xml').send(twiml.toString());
    return;
  }

  try {
    // For MVP, map to demo user.
    // In production, look up user by 'From' phone number.
    const userId = 'demo-user-001'; 

    const systemPrompt = `You are an AI fitness assistant syncing WhatsApp messages to a DB.
Return ONLY valid JSON in this format:
{
  "action": "log_meal" | "log_workout" | "log_water" | "unknown",
  "data": { ... fields ... },
  "reply": "Friendly short confirmation message to send back to user on WhatsApp"
}
For meals: { "mealName": string, "calories": number, "proteinG": number, "carbsG": number, "fatG": number }
For workouts: { "exerciseName": string, "sets": number, "reps": number, "weightKg": number }
For water: { "amountMl": number }`;

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Message: "${Body}"` },
      ],
      temperature: 0.1,
      max_completion_tokens: 300,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"action":"unknown"}');
    let reply = parsed.reply || "Got it, logged!";

    if (parsed.action === 'log_meal' && parsed.data?.mealName) {
      await prisma.dietLog.create({
        data: {
          userId,
          mealName: parsed.data.mealName,
          calories: parsed.data.calories,
          proteinG: parsed.data.proteinG,
          carbsG: parsed.data.carbsG,
          fatG: parsed.data.fatG,
          aiParsed: true
        }
      });
    } else if (parsed.action === 'log_workout' && parsed.data?.exerciseName) {
      await prisma.workoutLog.create({
        data: {
          userId,
          exerciseName: parsed.data.exerciseName,
          sets: parsed.data.sets || 1,
          reps: parsed.data.reps || 1,
          weightKg: parsed.data.weightKg
        }
      });
    } else if (parsed.action === 'log_water' && parsed.data?.amountMl) {
      await prisma.waterLog.create({
        data: {
          userId,
          amountMl: parsed.data.amountMl
        }
      });
    } else {
      reply = "Sorry, I couldn't understand what to log. Try 'I drank 2 glasses of water' or 'I ate roti and sabji'.";
    }

    twiml.message(reply);
    res.type('text/xml').send(twiml.toString());
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    twiml.message("Oops, something went wrong on my end. Try again later!");
    res.type('text/xml').send(twiml.toString());
  }
});

export default router;
