import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { hashPassword } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  if (locals.user.role !== 'INSEGNANTE') {
    throw error(403, 'Accesso negato. Solo gli insegnanti possono accedere a questa pagina.');
  }

  try {
    const users = await db.user.findMany({
      where: {
        role: 'ISCRITTO'
      },
      include: {
        _count: {
          select: {
            scores: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total points for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const totalPoints = await db.score.aggregate({
          where: { userId: user.id },
          _sum: { points: true }
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          totalScores: user._count.scores,
          totalPoints: totalPoints._sum.points || 0
        };
      })
    );

    return {
      users: usersWithStats
    };
  } catch (err) {
    console.error('Error loading users:', err);
    throw error(500, 'Errore nel caricamento degli utenti');
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const name = data.get('name') as string;
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    // Validation
    if (!name || name.trim().length === 0) {
      return fail(400, { message: 'Il nome è obbligatorio' });
    }

    if (!email || email.trim().length === 0) {
      return fail(400, { message: 'L\'email è obbligatoria' });
    }

    if (!password || password.length < 6) {
      return fail(400, { message: 'La password deve essere di almeno 6 caratteri' });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existingUser) {
      return fail(400, { message: 'Un utente con questa email esiste già' });
    }

    try {
      const hashedPassword = await hashPassword(password);

      await db.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          role: 'ISCRITTO'
        }
      });

      return { success: true, message: 'Utente creato con successo' };
    } catch (err) {
      console.error('Error creating user:', err);
      return fail(500, { message: 'Errore nella creazione dell\'utente' });
    }
  },

  update: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const id = data.get('id') as string;
    const name = data.get('name') as string;
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    // Validation
    if (!id) {
      return fail(400, { message: 'ID utente mancante' });
    }

    if (!name || name.trim().length === 0) {
      return fail(400, { message: 'Il nome è obbligatorio' });
    }

    if (!email || email.trim().length === 0) {
      return fail(400, { message: 'L\'email è obbligatoria' });
    }

    // Check if email already exists for another user
    const existingUser = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (existingUser && existingUser.id !== id) {
      return fail(400, { message: 'Un altro utente con questa email esiste già' });
    }

    try {
      const updateData: any = {
        name: name.trim(),
        email: email.trim().toLowerCase()
      };

      // If password is provided, hash it
      if (password && password.length >= 6) {
        updateData.password = await hashPassword(password);
      }

      await db.user.update({
        where: { id },
        data: updateData
      });

      return { success: true, message: 'Utente aggiornato con successo' };
    } catch (err) {
      console.error('Error updating user:', err);
      return fail(500, { message: 'Errore nell\'aggiornamento dell\'utente' });
    }
  },

  delete: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const id = data.get('id') as string;

    if (!id) {
      return fail(400, { message: 'ID utente mancante' });
    }

    try {
      // Check if user has scores
      const scoresCount = await db.score.count({
        where: { userId: id }
      });

      if (scoresCount > 0) {
        return fail(400, { 
          message: 'Impossibile eliminare l\'utente: ha punteggi associati. Rimuovi prima tutti i punteggi.' 
        });
      }

      // Delete sessions first
      await db.session.deleteMany({
        where: { userId: id }
      });

      // Delete user
      await db.user.delete({
        where: { id }
      });

      return { success: true, message: 'Utente eliminato con successo' };
    } catch (err) {
      console.error('Error deleting user:', err);
      return fail(500, { message: 'Errore nell\'eliminazione dell\'utente' });
    }
  }
};
