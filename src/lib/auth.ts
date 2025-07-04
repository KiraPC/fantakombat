// Authentication utilities for Fantakombat
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Session configuration
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'INSEGNANTE' | 'ISCRITTO';
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  user: AuthUser;
}

// Generate a secure session ID
function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

// Create a new session
export async function createSession(userId: string): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt,
    },
  });
  
  return sessionId;
}

// Get session by ID
export async function getSession(sessionId: string): Promise<AuthSession | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });
  
  if (!session) return null;
  
  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: { id: sessionId },
    });
    return null;
  }
  
  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt,
    user: session.user as AuthUser,
  };
}

// Delete a session
export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: { id: sessionId },
  });
}

// Delete all sessions for a user
export async function deleteUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create user
export async function createUser(email: string, password: string, name: string, role: 'INSEGNANTE' | 'ISCRITTO' = 'ISCRITTO') {
  const hashedPassword = await hashPassword(password);
  
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
}

// Get user by email
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
    },
  });
}

// Authenticate user
export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) return null;
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
