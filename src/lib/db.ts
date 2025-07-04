// Database utilities for Fantakombat
import { PrismaClient } from '@prisma/client';

// Global instance to avoid multiple connections
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a single instance of Prisma Client
export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Helper functions for common database operations

// Users
export async function getAllUsers() {
  return db.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getStudents() {
  return db.user.findMany({
    where: { role: 'ISCRITTO' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

// Actions
export async function getAllActions() {
  return db.action.findMany({
    where: { isActive: true },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getActionById(id: string) {
  return db.action.findUnique({
    where: { id },
  });
}

export async function createAction(data: {
  name: string;
  description?: string;
  points: number;
  type: 'BONUS' | 'MALUS';
  courseId: string;
}) {
  return db.action.create({
    data,
  });
}

export async function updateAction(id: string, data: {
  name?: string;
  description?: string;
  points?: number;
  type?: 'BONUS' | 'MALUS';
  isActive?: boolean;
}) {
  return db.action.update({
    where: { id },
    data,
  });
}

// Lessons
export async function getAllLessons() {
  return db.lesson.findMany({
    orderBy: {
      date: 'desc',
    },
  });
}

export async function getLessonById(id: string) {
  return db.lesson.findUnique({
    where: { id },
    include: {
      scores: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          action: {
            select: {
              id: true,
              name: true,
              points: true,
            },
          },
        },
      },
    },
  });
}

export async function createLesson(data: {
  date: Date;
  title?: string;
  description?: string;
  academicYear: string;
}) {
  return db.lesson.create({
    data: {
      date: data.date,
      title: data.title,
      description: data.description,
      academicYear: {
        connect: {
          id: data.academicYear,
        },
      },
    },
  });
}

// Scores
export async function getScoresByUser(userId: string) {
  return db.score.findMany({
    where: { userId },
    include: {
      action: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      lesson: {
        select: {
          id: true,
          date: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function createScore(data: {
  userId: string;
  actionId: string;
  lessonId: string;
  assignedBy: string;
  points: number;
  notes?: string;
}) {
  return db.score.create({
    data,
  });
}

// Leaderboard
export async function getLeaderboard() {
  const scores = await db.score.groupBy({
    by: ['userId'],
    _sum: {
      points: true,
    },
    orderBy: {
      _sum: {
        points: 'desc',
      },
    },
  });

  const leaderboard = [];
  for (const score of scores) {
    const user = await db.user.findUnique({
      where: { id: score.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    
    if (user) {
      leaderboard.push({
        user,
        totalPoints: score._sum.points || 0,
      });
    }
  }

  return leaderboard;
}

// Get user's total points
export async function getUserTotalPoints(userId: string) {
  const result = await db.score.aggregate({
    where: { userId },
    _sum: {
      points: true,
    },
  });

  return result._sum.points || 0;
}

// Get recent activity
export async function getRecentActivity(limit: number = 10) {
  const scores = await db.score.findMany({
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      action: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      lesson: {
        select: {
          id: true,
          date: true,
          title: true,
        },
      },
    },
  });
  
  return scores.map(score => ({
    ...score,
    createdAt: score.createdAt.toISOString(),
    lesson: {
      ...score.lesson,
      date: score.lesson.date.toISOString(),
    },
  }));
}
