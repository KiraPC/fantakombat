import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  if (locals.user.role !== 'INSEGNANTE') {
    throw error(403, 'Accesso negato. Solo gli insegnanti possono accedere a questa pagina.');
  }

  const page = parseInt(url.searchParams.get('page') || '1');
  const yearId = url.searchParams.get('year');
  const limit = 10; // Lessons per page
  const offset = (page - 1) * limit;

  try {
    // Get teacher's courses and academic years
    const courses = await db.course.findMany({
      where: {
        ownerId: locals.user.id
      },
      include: {
        academicYears: {
          where: {
            isActive: true
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      }
    });

    // Build lessons query
    const lessonsWhere: any = {};
    
    if (yearId) {
      // Filter by specific academic year
      lessonsWhere.academicYearId = yearId;
    } else {
      // Get all lessons from teacher's courses
      const teacherAcademicYearIds = courses.flatMap(course => 
        course.academicYears.map(year => year.id)
      );
      
      if (teacherAcademicYearIds.length > 0) {
        lessonsWhere.academicYearId = {
          in: teacherAcademicYearIds
        };
      } else {
        // No academic years available, return empty results
        return {
          lessons: [],
          totalPages: 0,
          currentPage: page,
          actions: [],
          users: [],
          courses: [],
          selectedYearId: yearId
        };
      }
    }

    const [lessons, totalLessons, actions, users] = await Promise.all([
      db.lesson.findMany({
        where: lessonsWhere,
        include: {
          academicYear: {
            include: {
              course: true
            }
          },
          _count: {
            select: {
              scores: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: limit,
        skip: offset
      }),
      db.lesson.count({
        where: lessonsWhere
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

    const totalPages = Math.ceil(totalLessons / limit);

    return {
      lessons: lessons.map(lesson => ({
        id: lesson.id,
        date: lesson.date.toISOString(),
        title: lesson.title,
        description: lesson.description,
        createdAt: lesson.createdAt.toISOString(),
        scoresCount: lesson._count.scores,
        academicYear: {
          id: lesson.academicYear.id,
          name: lesson.academicYear.name,
          courseName: lesson.academicYear.course.name
        }
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalLessons,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      actions: actions.map(action => ({
        id: action.id,
        name: action.name,
        description: action.description,
        points: action.points,
        type: action.type,
        isActive: action.isActive
      })),
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      })),
      courses: courses.map(course => ({
        id: course.id,
        name: course.name,
        academicYears: course.academicYears.map(year => ({
          id: year.id,
          name: year.name,
          isActive: year.isActive
        }))
      })),
      selectedYearId: yearId
    };
  } catch (err) {
    console.error('Error loading lessons:', err);
    throw error(500, 'Errore nel caricamento delle lezioni');
  }
};

export const actions: Actions = {
  createLesson: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const dateString = data.get('date') as string;
    const academicYearId = data.get('academicYearId') as string;
    const title = data.get('title') as string;
    const description = data.get('description') as string;

    // Validation
    if (!dateString) {
      return fail(400, { message: 'La data è obbligatoria' });
    }

    if (!academicYearId) {
      return fail(400, { message: 'L\'anno accademico è obbligatorio' });
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return fail(400, { message: 'Data non valida' });
    }

    try {
      // Verify that the academic year belongs to the teacher
      const academicYear = await db.academicYear.findUnique({
        where: { id: academicYearId },
        include: {
          course: true
        }
      });

      if (!academicYear || academicYear.course.ownerId !== locals.user.id) {
        return fail(403, { message: 'Anno accademico non trovato o non autorizzato' });
      }

      const lesson = await db.lesson.create({
        data: {
          date: date,
          academicYearId: academicYearId,
          title: title?.trim() || null,
          description: description?.trim() || null
        }
      });

      return { success: true, message: 'Lezione creata con successo', lessonId: lesson.id };
    } catch (err) {
      console.error('Error creating lesson:', err);
      return fail(500, { message: 'Errore nella creazione della lezione' });
    }
  },

  deleteLesson: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const id = data.get('id') as string;

    if (!id) {
      return fail(400, { message: 'ID lezione mancante' });
    }

    try {
      // Delete associated scores first
      await db.score.deleteMany({
        where: { lessonId: id }
      });

      // Delete the lesson
      await db.lesson.delete({
        where: { id }
      });

      return { success: true, message: 'Lezione eliminata con successo' };
    } catch (err) {
      console.error('Error deleting lesson:', err);
      return fail(500, { message: 'Errore nell\'eliminazione della lezione' });
    }
  },

  assignPoints: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const lessonId = data.get('lessonId') as string;
    const userId = data.get('userId') as string;
    const actionId = data.get('actionId') as string;

    // Validation
    if (!lessonId || !userId || !actionId) {
      return fail(400, { message: 'Dati mancanti per l\'assegnazione punti' });
    }

    try {
      // Get the action to get points value
      const action = await db.action.findUnique({
        where: { id: actionId }
      });

      if (!action) {
        return fail(400, { message: 'Azione non trovata' });
      }

      // Check if user already has this action for this lesson
      const existingScore = await db.score.findFirst({
        where: {
          lessonId,
          userId,
          actionId
        }
      });

      if (existingScore) {
        return fail(400, { message: 'Punti già assegnati per questa azione in questa lezione' });
      }

      // Create the score
      await db.score.create({
        data: {
          lessonId,
          userId,
          actionId,
          points: action.points,
          assignedBy: locals.user.id
        }
      });

      return { success: true, message: 'Punti assegnati con successo' };
    } catch (err) {
      console.error('Error assigning points:', err);
      return fail(500, { message: 'Errore nell\'assegnazione dei punti' });
    }
  },

  assignMultiplePoints: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const lessonId = data.get('lessonId') as string;
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
