// Login page server actions
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { authenticateUser, createSession } from '$lib/auth';
import { db } from '$lib/db';

export const actions: Actions = {
  // Login for teachers (email + password)
  teacherLogin: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    
    // Validate input
    if (!email || !password) {
      return fail(400, {
        error: 'Email e password sono obbligatori per gli insegnanti.',
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, {
        error: 'Formato email non valido.',
      });
    }
    
    try {
      // Authenticate user
      const user = await authenticateUser(email, password);
      
      if (!user) {
        return fail(400, {
          error: 'Email o password non corretti.',
        });
      }
      
      // Check if user is a teacher
      if (user.role !== 'INSEGNANTE') {
        return fail(400, {
          error: 'Accesso negato. Questo login è riservato agli insegnanti.',
        });
      }
      
      // Create session
      const sessionId = await createSession(user.id);
      
      // Set session cookie
      cookies.set('session', sessionId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      
      // Redirect to dashboard
      throw redirect(302, '/dashboard');
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }
      console.error('Login error:', error);
      return fail(500, {
        error: 'Si è verificato un errore durante il login. Riprova.',
      });
    }
  },

  // Simple login for students (email only)
  studentLogin: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    
    // Validate input
    if (!email) {
      return fail(400, {
        error: 'Email è obbligatoria.',
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, {
        error: 'Formato email non valido.',
      });
    }
    
    try {
      // Find user by email
      const user = await db.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return fail(400, {
          error: 'Email non trovata. Contatta il tuo insegnante.',
        });
      }
      
      // Check if user is a student
      if (user.role !== 'ISCRITTO') {
        return fail(400, {
          error: 'Accesso negato. Gli insegnanti devono usare il login completo.',
        });
      }
      
      // Create session
      const sessionId = await createSession(user.id);
      
      // Set session cookie
      cookies.set('session', sessionId, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      
      // Redirect to dashboard
      throw redirect(302, '/dashboard');
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }
      console.error('Student login error:', error);
      return fail(500, {
        error: 'Si è verificato un errore durante il login. Riprova.',
      });
    }
  }
};
