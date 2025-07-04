import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  if (locals.user.role !== 'INSEGNANTE') {
    throw error(403, 'Accesso negato. Solo gli insegnanti possono accedere a questa pagina.');
  }

  const lessonId = params.id;

  try {
    const [lesson, actions, users] = await Promise.all([
      db.lesson.findUnique({
        where: { id: lessonId },
        include: {
          scores: {
            include: {
              user: true,
              action: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      }),
      db.action.findMany({
        orderBy: {
          name: 'asc'
        }
      }),
      db.user.findMany({
        where: {
          role: 'ISCRITTO'
        },
        orderBy: {
          name: 'asc'
        }
      })
    ]);

    if (!lesson) {
      throw error(404, 'Lezione non trovata');
    }

    return {
      lesson: {
        id: lesson.id,
        date: lesson.date.toISOString(),
        createdAt: lesson.createdAt.toISOString(),
        scores: lesson.scores.map(score => ({
          id: score.id,
          points: score.points,
          createdAt: score.createdAt.toISOString(),
          user: {
            id: score.user.id,
            name: score.user.name
          },
          action: {
            id: score.action.id,
            name: score.action.name,
            type: score.action.type
          }
        }))
      },
      actions: actions.map(action => ({
        id: action.id,
        name: action.name,
        points: action.points,
        type: action.type
      })),
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      }))
    };
  } catch (err) {
    console.error('Error loading lesson:', err);
    throw error(500, 'Errore nel caricamento della lezione');
  }
};

export const actions: Actions = {
  assignMultiplePoints: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const lessonId = params.id;
    const userId = data.get('userId') as string;
    const actionIds = data.getAll('actionIds') as string[];

    // Debug logging
    console.log('Form data received:', {
      lessonId,
      userId,
      actionIds,
      allFormData: Object.fromEntries(data.entries())
    });

    // Validation
    if (!lessonId || !userId || !actionIds || actionIds.length === 0) {
      return fail(400, { message: 'Dati mancanti per l\'assegnazione punti' });
    }

    // Filter out empty strings
    const validActionIds = actionIds.filter(id => id && id.trim() !== '');
    
    if (validActionIds.length === 0) {
      return fail(400, { message: 'Nessuna azione valida selezionata' });
    }

    try {
      // Get all actions to get points values
      const actions = await db.action.findMany({
        where: { id: { in: validActionIds } }
      });

      console.log('Found actions:', actions.length, 'Expected:', validActionIds.length);

      if (actions.length !== validActionIds.length) {
        const foundIds = actions.map(a => a.id);
        const missingIds = validActionIds.filter(id => !foundIds.includes(id));
        console.log('Missing action IDs:', missingIds);
        return fail(400, { message: `Alcune azioni non sono state trovate: ${missingIds.join(', ')}` });
      }

      // Check if user already has any of these actions for this lesson
      const existingScores = await db.score.findMany({
        where: {
          lessonId,
          userId,
          actionId: { in: validActionIds }
        },
        include: {
          action: true
        }
      });

      if (existingScores.length > 0) {
        const existingActionNames = existingScores.map(score => score.action.name).join(', ');
        return fail(400, { 
          message: `L'utente ha già questi punteggi per questa lezione: ${existingActionNames}` 
        });
      }

      // Create all scores in a transaction
      const scores = actions.map(action => ({
        lessonId,
        userId,
        actionId: action.id,
        points: action.points,
        assignedBy: locals.user!.id
      }));

      await db.score.createMany({
        data: scores
      });

      const totalPoints = actions.reduce((sum, action) => sum + action.points, 0);
      const actionNames = actions.map(action => action.name).join(', ');

      return { 
        success: true, 
        message: `${actions.length} azioni assegnate con successo (${actionNames}) per un totale di ${totalPoints > 0 ? '+' : ''}${totalPoints} punti` 
      };
    } catch (err) {
      console.error('Error assigning multiple points:', err);
      return fail(500, { message: 'Errore nell\'assegnazione dei punti multipli' });
    }
  },

  removeScore: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const scoreId = data.get('scoreId') as string;

    if (!scoreId) {
      return fail(400, { message: 'ID punteggio mancante' });
    }

    try {
      await db.score.delete({
        where: { id: scoreId }
      });

      return { success: true, message: 'Punteggio rimosso con successo' };
    } catch (err) {
      console.error('Error removing score:', err);
      return fail(500, { message: 'Errore nella rimozione del punteggio' });
    }
  }
};
