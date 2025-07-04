import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  if (locals.user.role !== 'INSEGNANTE') {
    throw error(403, 'Accesso negato. Solo gli insegnanti possono accedere a questa pagina.');
  }

  try {
    const [actions, courses] = await Promise.all([
      db.action.findMany({
        where: {
          course: {
            ownerId: locals.user.id
          }
        },
        include: {
          course: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.course.findMany({
        where: {
          ownerId: locals.user.id,
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    ]);

    return {
      actions: actions.map(action => ({
        id: action.id,
        name: action.name,
        points: action.points,
        type: action.type,
        courseName: action.course.name,
        createdAt: action.createdAt.toISOString()
      })),
      courses: courses.map(course => ({
        id: course.id,
        name: course.name
      }))
    };
  } catch (err) {
    console.error('Error loading actions:', err);
    throw error(500, 'Errore nel caricamento delle azioni');
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const name = data.get('name') as string;
    const points = parseInt(data.get('points') as string);
    const type = data.get('type') as 'BONUS' | 'MALUS';
    const courseId = data.get('courseId') as string;

    // Validation
    if (!name || name.trim().length === 0) {
      return fail(400, { message: 'Il nome è obbligatorio' });
    }

    if (isNaN(points)) {
      return fail(400, { message: 'I punti devono essere un numero valido' });
    }

    if (!type || (type !== 'BONUS' && type !== 'MALUS')) {
      return fail(400, { message: 'Il tipo deve essere BONUS o MALUS' });
    }

    if (!courseId) {
      return fail(400, { message: 'Il corso è obbligatorio' });
    }

    // Verify the course belongs to the teacher
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        ownerId: locals.user.id
      }
    });

    if (!course) {
      return fail(400, { message: 'Corso non valido' });
    }

    // For MALUS, ensure points are negative
    const finalPoints = type === 'MALUS' ? -Math.abs(points) : Math.abs(points);

    try {
      await db.action.create({
        data: {
          name: name.trim(),
          points: finalPoints,
          type,
          courseId
        }
      });

      return { success: true, message: 'Azione creata con successo' };
    } catch (err) {
      console.error('Error creating action:', err);
      return fail(500, { message: 'Errore nella creazione dell\'azione' });
    }
  },

  update: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const id = data.get('id') as string;
    const name = data.get('name') as string;
    const points = parseInt(data.get('points') as string);
    const type = data.get('type') as 'BONUS' | 'MALUS';

    // Validation
    if (!id) {
      return fail(400, { message: 'ID azione mancante' });
    }

    if (!name || name.trim().length === 0) {
      return fail(400, { message: 'Il nome è obbligatorio' });
    }

    if (isNaN(points)) {
      return fail(400, { message: 'I punti devono essere un numero valido' });
    }

    if (!type || (type !== 'BONUS' && type !== 'MALUS')) {
      return fail(400, { message: 'Il tipo deve essere BONUS o MALUS' });
    }

    // For MALUS, ensure points are negative
    const finalPoints = type === 'MALUS' ? -Math.abs(points) : Math.abs(points);

    try {
      await db.action.update({
        where: { id },
        data: {
          name: name.trim(),
          points: finalPoints,
          type
        }
      });

      return { success: true, message: 'Azione aggiornata con successo' };
    } catch (err) {
      console.error('Error updating action:', err);
      return fail(500, { message: 'Errore nell\'aggiornamento dell\'azione' });
    }
  },

  delete: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const id = data.get('id') as string;

    if (!id) {
      return fail(400, { message: 'ID azione mancante' });
    }

    try {
      // Check if action is used in any scores
      const scoresCount = await db.score.count({
        where: { actionId: id }
      });

      if (scoresCount > 0) {
        return fail(400, { 
          message: 'Impossibile eliminare l\'azione: è stata utilizzata in dei punteggi esistenti' 
        });
      }

      await db.action.delete({
        where: { id }
      });

      return { success: true, message: 'Azione eliminata con successo' };
    } catch (err) {
      console.error('Error deleting action:', err);
      return fail(500, { message: 'Errore nell\'eliminazione dell\'azione' });
    }
  }
};
