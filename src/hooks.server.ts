// Authentication hooks for SvelteKit
import { redirect, type Handle } from '@sveltejs/kit';
import { getSession, type AuthSession } from '$lib/auth';
import { initializeAutomaticActions } from '$lib/init-actions';

// Initialize automatic actions on server start
initializeAutomaticActions();

// Define which routes require authentication and specific roles
const protectedRoutes = {
  '/dashboard': ['INSEGNANTE', 'ISCRITTO'],
  '/admin': ['INSEGNANTE'],
  '/actions': ['INSEGNANTE'],
  '/lessons': ['INSEGNANTE'],
  '/users': ['INSEGNANTE'],
  '/profile': ['INSEGNANTE', 'ISCRITTO'],
  '/leaderboard': ['INSEGNANTE', 'ISCRITTO'],
};

// Authentication handle
export const handle: Handle = async ({ event, resolve }) => {
  // Get session cookie
  const sessionId = event.cookies.get('session');
  
  // Initialize locals
  event.locals.user = null;
  event.locals.session = null;
  
  // If there's a session cookie, try to get the session
  if (sessionId) {
    const session = await getSession(sessionId);
    if (session) {
      event.locals.user = session.user;
      event.locals.session = session;
    } else {
      // Invalid session, clear the cookie
      event.cookies.delete('session', { path: '/' });
    }
  }
  
  // Check if route requires authentication
  const pathname = event.url.pathname;
  const matchedRoute = Object.keys(protectedRoutes).find(route => 
    pathname.startsWith(route)
  );
  
  if (matchedRoute) {
    const requiredRoles = protectedRoutes[matchedRoute as keyof typeof protectedRoutes];
    
    // Check if user is authenticated
    if (!event.locals.user) {
      throw redirect(302, '/login');
    }
    
    // Check if user has required role
    if (!requiredRoles.includes(event.locals.user.role)) {
      throw redirect(302, '/unauthorized');
    }
  }
  
  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (event.locals.user && (pathname === '/login' || pathname === '/register')) {
    throw redirect(302, '/dashboard');
  }
  
  return resolve(event);
};

// Type definitions for locals
declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string;
        name: string;
        role: 'INSEGNANTE' | 'ISCRITTO';
      } | null;
      session: AuthSession | null;
    }
  }
}
