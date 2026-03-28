import prisma from '../src/lib/prisma';

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user (upsert to avoid duplicates)
  const user = await prisma.user.upsert({
    where: { id: 'demo-user-001' },
    update: {},
    create: {
      id: 'demo-user-001',
      name: 'Abhishek',
      email: 'abhishek@antigravity.ai',
      goalType: 'gain_muscle',
      weight: 81.0,
      height: 175,
      age: 24,
    },
  });
  console.log('✓ User:', user.name);

  // Seed body metrics (past 7 days)
  const weights = [82.5, 82.2, 81.9, 82.0, 81.5, 81.3, 81.0];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    await prisma.bodyMetric.create({
      data: { userId: user.id, weightKg: weights[6 - i], date },
    });
  }
  console.log('✓ Body metrics seeded');

  // Seed this week's workouts
  const exercises = [
    { exerciseName: 'Bench Press', sets: 4, reps: 8, weightKg: 75 },
    { exerciseName: 'Squat', sets: 4, reps: 6, weightKg: 95 },
    { exerciseName: 'Deadlift', sets: 3, reps: 5, weightKg: 115 },
    { exerciseName: 'Pull-up', sets: 3, reps: 10, weightKg: 0 },
  ];
  for (const ex of exercises) {
    await prisma.workoutLog.create({ data: { userId: user.id, ...ex } });
  }
  console.log('✓ Workout logs seeded');

  // Seed today's diet
  const meals = [
    { mealName: 'Omelette (3 eggs)', calories: 210, proteinG: 18, carbsG: 1, fatG: 15, mealType: 'breakfast' },
    { mealName: 'Dal Chawal', calories: 350, proteinG: 12, carbsG: 60, fatG: 5, mealType: 'lunch' },
    { mealName: 'Whey Protein Shake', calories: 130, proteinG: 25, carbsG: 5, fatG: 1.5, mealType: 'snack' },
  ];
  for (const meal of meals) {
    await prisma.dietLog.create({ data: { userId: user.id, ...meal } });
  }
  console.log('✓ Diet logs seeded');

  // Seed water intake
  await prisma.waterLog.create({ data: { userId: user.id, amountMl: 1500 } });
  console.log('✓ Water log seeded');

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
