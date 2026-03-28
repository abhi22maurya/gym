import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Globally mutable user ID for simple auth injection
export let currentUserId = 'demo-user-001';

export const api = axios.create({ baseURL: BASE_URL });

export const setApiAuth = (userId: string, token: string | null) => {
  currentUserId = userId;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// User Profile & Onboarding
export const getUserProfile = () => api.get('/user/me');
export const onboardUser = (data: { name: string; age: number; weight: number; height: number; goalType: string }) =>
  api.post('/user/onboard', data);

// Coach
export const getCoachSuggestion = () =>
  api.post('/coach/suggest', { userId: currentUserId });

export const analyzeFoodImage = (imageBase64: string, mealContext?: string) =>
  api.post('/coach/analyze-food', { imageBase64, mealContext });

export const parseVoiceInput = (transcript: string) =>
  api.post('/coach/voice-parse', { transcript });

// Workout
export const logWorkout = (data: {
  exerciseName: string; sets: number; reps: number; weightKg?: number; durationMin?: number; notes?: string;
}) => api.post('/workout', { ...data, userId: currentUserId });

export const getWorkoutLogs = () => api.get(`/workout/${currentUserId}`);

// Diet
export const logMeal = (data: {
  mealName: string; calories?: number; proteinG?: number; carbsG?: number; fatG?: number; mealType?: string;
}) => api.post('/diet', { ...data, userId: currentUserId });

export const getDietLogs = (date?: string) =>
  api.get(`/diet/${currentUserId}`, { params: date ? { date } : {} });

// Water
export const logWater = (amountMl: number) =>
  api.post('/water', { userId: currentUserId, amountMl });

export const getTodayWater = () => api.get(`/water/${currentUserId}/today`);

// Body Metrics
export const logMetrics = (data: {
  weightKg?: number; bodyFatPct?: number; chestCm?: number; waistCm?: number; armCm?: number; thighCm?: number;
}) => api.post('/metrics', { ...data, userId: currentUserId });

export const getMetrics = () => api.get(`/metrics/${currentUserId}`);

// Posture
export const savePostureScore = (score: number, feedback: string) =>
  api.post('/posture', { userId: currentUserId, score, feedback });

export const getPostureLogs = () => api.get(`/posture/${currentUserId}`);

// HealthKit
export const syncHealthKit = (data: { steps?: number; sleepHours?: number; activeCalories?: number }) =>
  api.post('/healthkit/sync', { ...data, userId: currentUserId });
