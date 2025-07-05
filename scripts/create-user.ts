#!/usr/bin/env tsx
/**
 * Create User Script
 * 
 * Creates a new user (teacher or student) in the Fantakombat system
 * 
 * Usage:
 *   npm run create-user -- --email="test@example.com" --name="Test User" --role="INSEGNANTE" --password="password123"
 *   npm run create-user -- --email="student@example.com" --name="Student User" --role="ISCRITTO"
 *   npm run create-user -- --help
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth.js';
import { parseArgs } from 'util';

const prisma = new PrismaClient();

interface CreateUserArgs {
  email: string;
  name: string;
  role: 'INSEGNANTE' | 'ISCRITTO';
  password?: string;
  courseName?: string;
  help?: boolean;
}

function showHelp() {
  console.log(`
🎯 Fantakombat - Create User Script

Usage:
  npm run create-user -- [options]

Options:
  --email <email>       Email address (required)
  --name <name>         Full name (required)
  --role <role>         Role: INSEGNANTE or ISCRITTO (required)
  --password <password> Password (required for INSEGNANTE only)
  --course <course>     Course name (optional for INSEGNANTE)
  --help               Show this help message

Examples:
  # Create a teacher with course
  npm run create-user -- --email="teacher@example.com" --name="Mario Rossi" --role="INSEGNANTE" --password="securepass123" --course="Boxe Avanzata"

  # Create a teacher without course
  npm run create-user -- --email="teacher@example.com" --name="Mario Rossi" --role="INSEGNANTE" --password="securepass123"

  # Create a student (passwordless)
  npm run create-user -- --email="student@example.com" --name="Luigi Verdi" --role="ISCRITTO"

Notes:
  - Students don't need passwords (passwordless login)
  - Teachers require passwords for login
  - Course creation is optional for teachers
  - All emails must be unique
`);
}

function validateArgs(args: CreateUserArgs): string[] {
  const errors: string[] = [];

  if (!args.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
    errors.push('Invalid email format');
  }

  if (!args.name) {
    errors.push('Name is required');
  }

  if (!args.role) {
    errors.push('Role is required');
  } else if (!['INSEGNANTE', 'ISCRITTO'].includes(args.role)) {
    errors.push('Role must be INSEGNANTE or ISCRITTO');
  }

  if (args.role === 'INSEGNANTE' && !args.password) {
    errors.push('Password is required for teachers (INSEGNANTE)');
  }

  if (args.role === 'INSEGNANTE' && args.password && args.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return errors;
}

async function createUser(args: CreateUserArgs) {
  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: args.email }
    });

    if (existingUser) {
      console.error('❌ Error: Email already exists');
      process.exit(1);
    }

    // Prepare user data
    const userData: any = {
      email: args.email,
      name: args.name,
      role: args.role,
      password: null
    };

    // Set password for teachers
    if (args.role === 'INSEGNANTE' && args.password) {
      userData.password = await hashPassword(args.password);
    }

    // Create user
    const user = await prisma.user.create({
      data: userData
    });

    console.log('✅ User created successfully:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);

    // Create course if specified and user is a teacher
    if (args.role === 'INSEGNANTE' && args.courseName) {
      const course = await prisma.course.create({
        data: {
          name: args.courseName.trim(),
          description: `Corso di ${args.courseName.trim()}`,
          ownerId: user.id,
          isActive: true
        }
      });

      console.log('✅ Course created successfully:');
      console.log(`   Course: ${course.name}`);
      console.log(`   ID: ${course.id}`);
    }

    console.log('\n🔐 Login Info:');
    if (args.role === 'INSEGNANTE') {
      console.log(`   Teacher login: ${args.email} / ${args.password}`);
    } else {
      console.log(`   Student login: ${args.email} (passwordless)`);
    }

  } catch (error: any) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    const { values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        email: { type: 'string' },
        name: { type: 'string' },
        role: { type: 'string' },
        password: { type: 'string' },
        course: { type: 'string' },
        help: { type: 'boolean' }
      },
      allowPositionals: false
    });

    const args: CreateUserArgs = {
      email: values.email || '',
      name: values.name || '',
      role: values.role as 'INSEGNANTE' | 'ISCRITTO',
      password: values.password,
      courseName: values.course,
      help: values.help
    };

    if (args.help) {
      showHelp();
      process.exit(0);
    }

    console.log('🎯 Fantakombat - Create User Script\n');

    const errors = validateArgs(args);
    if (errors.length > 0) {
      console.error('❌ Validation errors:');
      errors.forEach(error => console.error(`   - ${error}`));
      console.log('\nUse --help for usage information');
      process.exit(1);
    }

    await createUser(args);

  } catch (error: any) {
    console.error('❌ Script error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
