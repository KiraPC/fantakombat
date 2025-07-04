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
    const courses = await db.course.findMany({
      where: {
        ownerId: locals.user.id
      },
      include: {
        academicYears: {
          include: {
            enrollments: true
          },
          orderBy: {
            startDate: 'desc'
          }
        },
        _count: {
          select: {
            academicYears: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      courses: courses.map((course: any) => ({
        id: course.id,
        name: course.name,
        description: course.description,
        isActive: course.isActive,
        createdAt: course.createdAt.toISOString(),
        enrollmentsCount: course.academicYears.reduce((total: number, year: any) => 
          total + (year.enrollments?.length || 0), 0),
        academicYearsCount: course._count.academicYears,
        academicYears: course.academicYears.map((year: any) => ({
          id: year.id,
          name: year.name,
          startDate: year.startDate.toISOString(),
          endDate: year.endDate?.toISOString(),
          isActive: year.isActive
        }))
      }))
    };
  } catch (err) {
    console.error('Error loading courses:', err);
    throw error(500, 'Errore nel caricamento dei corsi');
  }
};

export const actions: Actions = {
  createCourse: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const name = data.get('name') as string;
    const description = data.get('description') as string;

    // Validation
    if (!name || name.trim().length === 0) {
      return fail(400, { message: 'Il nome del corso è obbligatorio' });
    }

    try {
      const course = await db.course.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          ownerId: locals.user.id
        }
      });

      return { success: true, message: 'Corso creato con successo', courseId: course.id };
    } catch (err) {
      console.error('Error creating course:', err);
      return fail(500, { message: 'Errore nella creazione del corso' });
    }
  },

  updateCourse: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const id = data.get('id') as string;
    const name = data.get('name') as string;
    const description = data.get('description') as string;

    // Validation
    if (!id) {
      return fail(400, { message: 'ID corso mancante' });
    }

    if (!name || name.trim().length === 0) {
      return fail(400, { message: 'Il nome del corso è obbligatorio' });
    }

    try {
      // Verify ownership
      const course = await db.course.findUnique({
        where: { id, ownerId: locals.user.id }
      });

      if (!course) {
        return fail(404, { message: 'Corso non trovato o non autorizzato' });
      }

      await db.course.update({
        where: { id },
        data: {
          name: name.trim(),
          description: description?.trim() || null
        }
      });

      return { success: true, message: 'Corso aggiornato con successo' };
    } catch (err) {
      console.error('Error updating course:', err);
      return fail(500, { message: 'Errore nell\'aggiornamento del corso' });
    }
  },

  deleteCourse: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const id = data.get('id') as string;

    if (!id) {
      return fail(400, { message: 'ID corso mancante' });
    }

    try {
      // Verify ownership
      const course = await db.course.findUnique({
        where: { id, ownerId: locals.user.id },
        include: {
          academicYears: {
            include: {
              lessons: {
                include: {
                  scores: true
                }
              }
            }
          }
        }
      });

      if (!course) {
        return fail(404, { message: 'Corso non trovato o non autorizzato' });
      }

      // Check if there are any lessons with scores
      const hasScores = course.academicYears.some(year => 
        year.lessons.some(lesson => lesson.scores.length > 0)
      );

      if (hasScores) {
        return fail(400, { 
          message: 'Impossibile eliminare il corso: contiene lezioni con punteggi assegnati. Elimina prima tutti i punteggi.' 
        });
      }

      // Delete in the correct order: scores -> lessons -> academic years -> enrollments -> course
      for (const year of course.academicYears) {
        for (const lesson of year.lessons) {
          await db.score.deleteMany({
            where: { lessonId: lesson.id }
          });
        }
        await db.lesson.deleteMany({
          where: { academicYearId: year.id }
        });
        // Delete enrollments for this academic year
        await db.academicYearEnrollment.deleteMany({
          where: { academicYearId: year.id }
        });
      }
      
      await db.academicYear.deleteMany({
        where: { courseId: id }
      });

      await db.course.delete({
        where: { id }
      });

      return { success: true, message: 'Corso eliminato con successo' };
    } catch (err) {
      console.error('Error deleting course:', err);
      return fail(500, { message: 'Errore nell\'eliminazione del corso' });
    }
  }
};
