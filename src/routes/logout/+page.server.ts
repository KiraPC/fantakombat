// Logout endpoint
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { deleteSession } from '$lib/auth';

export const actions: Actions = {
  default: async ({ request, cookies, locals }) => {
    const sessionId = cookies.get('session');
    
    if (sessionId) {
      // Delete session from database
      await deleteSession(sessionId);
      
      // Clear session cookie
      cookies.delete('session', { path: '/' });
    }
    
    // Redirect to home page
    throw redirect(302, '/');
  },
};
