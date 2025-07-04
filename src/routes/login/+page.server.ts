// Login page server actions
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { authenticateUser, createSession } from '$lib/auth';

export const actions: Actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    
    // Validate input
    if (!email || !password) {
      return fail(400, {
        error: 'Email e password sono obbligatori.',
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
      // Se l'errore è una redirect (SvelteKit), rilanciala
      if (isRedirect(error)) {
        throw error;
      }
      
      console.error('Login error:', error);
      return fail(500, {
        error: 'Errore interno del server. Riprova più tardi.',
      });
    }
  },
};
