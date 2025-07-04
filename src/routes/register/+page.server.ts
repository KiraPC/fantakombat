// Register page server actions
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createUser, createSession } from '$lib/auth';
import { db } from '$lib/db';

export const actions: Actions = {
  register: async ({ request, cookies }) => {
    const formData = await request.formData();
    const name = formData.get('name')?.toString();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const confirmPassword = formData.get('confirmPassword')?.toString();
    const role = formData.get('role')?.toString() as 'INSEGNANTE' | 'ISCRITTO';
    const courseName = formData.get('courseName')?.toString(); // For teachers
    
    // Validate basic input
    if (!name || !email || !role) {
      return fail(400, {
        error: 'Nome, email e ruolo sono obbligatori.',
      });
    }
    
    // Validate password only for teachers
    if (role === 'INSEGNANTE') {
      if (!password || !confirmPassword) {
        return fail(400, {
          error: 'Password e conferma password sono obbligatori per gli insegnanti.',
        });
      }
      
      if (password.length < 6) {
        return fail(400, {
          error: 'La password deve essere di almeno 6 caratteri.',
        });
      }
      
      if (password !== confirmPassword) {
        return fail(400, {
          error: 'Le password non coincidono.',
        });
      }
    }
    
    // Validate course name for teachers
    if (role === 'INSEGNANTE' && (!courseName || courseName.trim().length === 0)) {
      return fail(400, {
        error: 'Il nome del corso è obbligatorio per gli insegnanti.',
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return fail(400, {
        error: 'Formato email non valido.',
      });
    }
    
    // Validate role
    if (!['INSEGNANTE', 'ISCRITTO'].includes(role)) {
      return fail(400, {
        error: 'Ruolo non valido.',
      });
    }
    
    try {
      // Create user - only teachers need password
      const user = await createUser(email, role === 'INSEGNANTE' ? (password || null) : null, name, role);
      
      // If the user is a teacher, create a course
      if (role === 'INSEGNANTE') {
        await db.course.create({
          data: {
            name: courseName!.trim(),
            description: `Corso di ${courseName!.trim()}`,
            ownerId: user.id,
            isActive: true
          }
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
      
    } catch (error: any) {
      // Se l'errore è una redirect (SvelteKit), rilanciala
      if (isRedirect(error)) {
        throw error;
      }
      
      console.error('Registration error:', error);
      
      // Handle unique constraint error (email already exists)
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return fail(400, {
          error: 'Email già in uso. Prova con un\'altra email.',
        });
      }
      
      return fail(500, {
        error: 'Errore interno del server. Riprova più tardi.',
      });
    }
  },
};
