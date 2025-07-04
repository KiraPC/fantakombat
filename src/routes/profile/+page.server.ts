// Profile server load function
import type { PageServerLoad, Actions } from './$types';
import { getScoresByUser, getLeaderboard, getUserTotalPoints } from '$lib/db';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { hashPassword, verifyPassword } from '$lib/auth';

export const load: PageServerLoad = async ({ locals }) => {
  const user = locals.user;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  try {
    // Get user's scores
    const userScores = await getScoresByUser(user.id);
    
    // Get user's total points
    const totalPoints = await getUserTotalPoints(user.id);
    
    // Get user's position (only for students)
    let position = null;
    if (user.role === 'ISCRITTO') {
      const leaderboard = await getLeaderboard();
      position = leaderboard.findIndex(entry => entry.user.id === user.id) + 1;
      if (position === 0) position = null;
    }
    
    return {
      user,
      userScores,
      userStats: {
        totalPoints,
        position,
      },
    };
  } catch (error) {
    console.error('Profile load error:', error);
    
    // Return fallback data
    return {
      user,
      userScores: [],
      userStats: {
        totalPoints: 0,
        position: null,
      },
    };
  }
};

export const actions: Actions = {
  changePassword: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const data = await request.formData();
    const currentPassword = data.get('currentPassword') as string;
    const newPassword = data.get('newPassword') as string;
    const confirmPassword = data.get('confirmPassword') as string;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return fail(400, {
        error: 'Tutti i campi sono obbligatori',
        currentPassword,
        newPassword,
        confirmPassword
      });
    }

    if (newPassword !== confirmPassword) {
      return fail(400, {
        error: 'Le nuove password non coincidono',
        currentPassword,
        newPassword,
        confirmPassword
      });
    }

    if (newPassword.length < 6) {
      return fail(400, {
        error: 'La nuova password deve avere almeno 6 caratteri',
        currentPassword,
        newPassword,
        confirmPassword
      });
    }

    try {
      // Get current user with password
      const user = await db.user.findUnique({
        where: { id: locals.user.id },
        select: { id: true, password: true }
      });

      if (!user) {
        return fail(404, { error: 'Utente non trovato' });
      }

      // Check if user has no password (students)
      if (!user.password) {
        return fail(400, {
          error: 'Gli studenti non hanno password. Contatta il tuo insegnante se devi modificare i tuoi dati.',
          currentPassword,
          newPassword,
          confirmPassword
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return fail(400, {
          error: 'Password attuale non corretta',
          currentPassword,
          newPassword,
          confirmPassword
        });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      await db.user.update({
        where: { id: locals.user.id },
        data: { password: hashedNewPassword }
      });

      return {
        success: true,
        message: 'Password cambiata con successo'
      };
    } catch (error) {
      console.error('Error changing password:', error);
      return fail(500, {
        error: 'Errore interno del server. Riprova più tardi.',
        currentPassword,
        newPassword,
        confirmPassword
      });
    }
  }
};
