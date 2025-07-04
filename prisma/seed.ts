import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.score.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.action.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Data cleaned');

  // Create teacher user
  const teacherPassword = await hashPassword('password123');
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@fantakombat.com' },
    update: {},
    create: {
      email: 'teacher@fantakombat.com',
      name: 'Marco Insegnante',
      password: teacherPassword,
      role: 'INSEGNANTE',
    },
  });

  console.log('✅ Teacher created:', teacher.email);

  // Create student users
  const students = [
    { name: 'Alice Boxer', email: 'alice@student.com' },
    { name: 'Bob Fighter', email: 'bob@student.com' },
    { name: 'Charlie Puncher', email: 'charlie@student.com' },
    { name: 'Diana Warrior', email: 'diana@student.com' },
    { name: 'Eva Champion', email: 'eva@student.com' },
  ];

  const studentPassword = await hashPassword('password123');
  
  for (const student of students) {
    await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        email: student.email,
        name: student.name,
        password: studentPassword,
        role: 'ISCRITTO',
      },
    });
    console.log('✅ Student created:', student.email);
  }

  // Create a course
  const course = await prisma.course.create({
    data: {
      name: 'Fit&Box Advanced',
      description: 'Corso avanzato di Fit&Box per atleti esperti',
      ownerId: teacher.id,
    },
  });

  console.log('✅ Course created:', course.name);

  // Create actions for the course
  const actions = [
    { name: 'Presenza puntuale', points: 10, type: 'BONUS' },
    { name: 'Ottima performance', points: 15, type: 'BONUS' },
    { name: 'Aiuto a compagno', points: 5, type: 'BONUS' },
    { name: 'Miglioramento tecnico', points: 20, type: 'BONUS' },
    { name: 'Partecipazione attiva', points: 8, type: 'BONUS' },
    { name: 'Ritardo', points: -5, type: 'MALUS' },
    { name: 'Assenza non giustificata', points: -10, type: 'MALUS' },
    { name: 'Comportamento scorretto', points: -15, type: 'MALUS' },
  ];

  for (const action of actions) {
    await prisma.action.upsert({
      where: { 
        courseId_name: {
          courseId: course.id,
          name: action.name
        }
      },
      update: {},
      create: {
        name: action.name,
        points: action.points,
        type: action.type as 'BONUS' | 'MALUS',
        courseId: course.id,
      },
    });
    console.log('✅ Action created:', action.name);
  }

  // Create academic year
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2024/2025',
      courseId: course.id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isActive: true,
    },
  });

  console.log('✅ Academic year created:', academicYear.name);

  // Get all students to enroll them
  const allStudents = await prisma.user.findMany({
    where: { role: 'ISCRITTO' }
  });

  // Enroll only first 3 students in the academic year (leaving 2 available for enrollment)
  for (let i = 0; i < Math.min(3, allStudents.length); i++) {
    await prisma.academicYearEnrollment.create({
      data: {
        userId: allStudents[i].id,
        academicYearId: academicYear.id,
      },
    });
  }

  console.log('✅ First 3 students enrolled in academic year (2 students left available for enrollment)');

  // Create lessons
  const lessonsData = [
    new Date('2024-01-15'),
    new Date('2024-01-17'),
    new Date('2024-01-22'),
    new Date('2024-01-24'),
    new Date('2024-01-29'),
  ];

  const lessons = [];
  for (const date of lessonsData) {
    const lesson = await prisma.lesson.create({
      data: { 
        date,
        academicYearId: academicYear.id,
        title: `Lezione ${lessons.length + 1}`,
        description: `Descrizione della lezione ${lessons.length + 1}`
      },
    });
    lessons.push(lesson);
    console.log('✅ Lesson created:', lesson.date.toISOString().split('T')[0]);
  }

  // Get enrolled students and actions for scoring
  const enrolledStudents = allStudents.slice(0, 3); // Only first 3 students are enrolled
  const allActions = await prisma.action.findMany();

  // Create some scores (only for enrolled students)
  const scores = [
    // Lesson 1
    { userId: enrolledStudents[0].id, actionId: allActions[0].id, lessonId: lessons[0].id, points: 10 },
    { userId: enrolledStudents[0].id, actionId: allActions[1].id, lessonId: lessons[0].id, points: 15 },
    { userId: enrolledStudents[1].id, actionId: allActions[0].id, lessonId: lessons[0].id, points: 10 },
    { userId: enrolledStudents[1].id, actionId: allActions[5].id, lessonId: lessons[0].id, points: -5 },
    { userId: enrolledStudents[2].id, actionId: allActions[0].id, lessonId: lessons[0].id, points: 10 },
    { userId: enrolledStudents[2].id, actionId: allActions[2].id, lessonId: lessons[0].id, points: 5 },
    
    // Lesson 2
    { userId: enrolledStudents[0].id, actionId: allActions[0].id, lessonId: lessons[1].id, points: 10 },
    { userId: enrolledStudents[0].id, actionId: allActions[3].id, lessonId: lessons[1].id, points: 20 },
    { userId: enrolledStudents[1].id, actionId: allActions[0].id, lessonId: lessons[1].id, points: 10 },
    { userId: enrolledStudents[1].id, actionId: allActions[4].id, lessonId: lessons[1].id, points: 8 },
    { userId: enrolledStudents[2].id, actionId: allActions[0].id, lessonId: lessons[1].id, points: 10 },
    
    // Lesson 3
    { userId: enrolledStudents[0].id, actionId: allActions[0].id, lessonId: lessons[2].id, points: 10 },
    { userId: enrolledStudents[1].id, actionId: allActions[0].id, lessonId: lessons[2].id, points: 10 },
    { userId: enrolledStudents[1].id, actionId: allActions[2].id, lessonId: lessons[2].id, points: 5 },
    { userId: enrolledStudents[2].id, actionId: allActions[5].id, lessonId: lessons[2].id, points: -5 },
  ];

  for (const score of scores) {
    await prisma.score.create({
      data: {
        userId: score.userId,
        actionId: score.actionId,
        lessonId: score.lessonId,
        points: score.points,
        assignedBy: teacher.id,
      },
    });
  }

  console.log('✅ Scores created:', scores.length);
  
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('🔐 Login credentials:');
  console.log('Teacher: teacher@fantakombat.com / password123');
  console.log('Student: alice@student.com / password123');
  console.log('Student: bob@student.com / password123');
  console.log('Student: charlie@student.com / password123');
  console.log('Student: diana@student.com / password123');
  console.log('Student: eva@student.com / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
