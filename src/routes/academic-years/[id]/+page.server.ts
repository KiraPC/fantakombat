import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  if (locals.user.role !== 'INSEGNANTE') {
    throw error(403, 'Accesso negato. Solo gli insegnanti possono accedere a questa pagina.');
  }

  try {
    const academicYear = await db.academicYear.findUnique({
      where: {
        id: params.id
      },
      include: {
        course: true,
        enrollments: {
          include: {
            user: true
          }
        },
        lessons: {
          include: {
            scores: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!academicYear) {
      throw error(404, 'Anno accademico non trovato');
    }

    // Verify ownership
    if (academicYear.course.ownerId !== locals.user.id) {
      throw error(403, 'Non sei autorizzato ad accedere a questo anno accademico');
    }

    // Get available students (not enrolled in this academic year)
    const availableStudents = await db.user.findMany({
      where: {
        role: 'ISCRITTO',
        academicYearEnrollments: {
          none: {
            academicYearId: params.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return {
      academicYear: {
        id: academicYear.id,
        name: academicYear.name,
        startDate: academicYear.startDate.toISOString(),
        endDate: academicYear.endDate?.toISOString(),
        isActive: academicYear.isActive,
        createdAt: academicYear.createdAt.toISOString(),
        course: {
          id: academicYear.course.id,
          name: academicYear.course.name,
          description: academicYear.course.description
        },
        enrollments: academicYear.enrollments.map(enrollment => ({
          id: enrollment.id,
          userId: enrollment.userId,
          userName: enrollment.user.name,
          userEmail: enrollment.user.email,
          enrolledAt: enrollment.enrolledAt.toISOString()
        })),
        lessons: academicYear.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          date: lesson.date.toISOString(),
          scoresCount: lesson.scores.length
        })),
        stats: {
          enrolledStudents: academicYear.enrollments.length,
          totalLessons: academicYear.lessons.length,
          totalScores: academicYear.lessons.reduce((sum, lesson) => sum + lesson.scores.length, 0)
        }
      },
      availableStudents
    };
  } catch (err) {
    console.error('Error loading academic year:', err);
    throw error(500, 'Errore nel caricamento dell\'anno accademico');
  }
};

export const actions: Actions = {
  updateAcademicYear: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const name = data.get('name') as string;
    const startDate = data.get('startDate') as string;
    const endDate = data.get('endDate') as string;

    // Validation
    if (!name || name.trim().length === 0) {
      return fail(400, { message: 'Il nome dell\'anno accademico è obbligatorio' });
    }

    if (!startDate) {
      return fail(400, { message: 'La data di inizio è obbligatoria' });
    }

    try {
      // Verify ownership
      const academicYear = await db.academicYear.findUnique({
        where: { id: params.id },
        include: {
          course: true
        }
      });

      if (!academicYear || academicYear.course.ownerId !== locals.user.id) {
        return fail(404, { message: 'Anno accademico non trovato o non autorizzato' });
      }

      // Check if academic year name already exists for this course (excluding current one)
      const existingYear = await db.academicYear.findFirst({
        where: {
          courseId: academicYear.courseId,
          name: name.trim(),
          NOT: {
            id: params.id
          }
        }
      });

      if (existingYear) {
        return fail(400, { message: 'Esiste già un anno accademico con questo nome per questo corso' });
      }

      await db.academicYear.update({
        where: { id: params.id },
        data: {
          name: name.trim(),
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null
        }
      });

      return { success: true, message: 'Anno accademico aggiornato con successo' };
    } catch (err) {
      console.error('Error updating academic year:', err);
      return fail(500, { message: 'Errore nell\'aggiornamento dell\'anno accademico' });
    }
  },

  activateAcademicYear: async ({ locals, params }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    try {
      // Verify ownership
      const academicYear = await db.academicYear.findUnique({
        where: { id: params.id },
        include: {
          course: true
        }
      });

      if (!academicYear || academicYear.course.ownerId !== locals.user.id) {
        return fail(404, { message: 'Anno accademico non trovato o non autorizzato' });
      }

      // Deactivate all other academic years for this course
      await db.academicYear.updateMany({
        where: {
          courseId: academicYear.courseId,
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      // Activate this academic year
      await db.academicYear.update({
        where: { id: params.id },
        data: {
          isActive: true,
          endDate: null // Remove end date when reactivating
        }
      });

      return { success: true, message: 'Anno accademico riattivato con successo' };
    } catch (err) {
      console.error('Error activating academic year:', err);
      return fail(500, { message: 'Errore nella riattivazione dell\'anno accademico' });
    }
  },

  deactivateAcademicYear: async ({ locals, params }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    try {
      // Verify ownership
      const academicYear = await db.academicYear.findUnique({
        where: { id: params.id },
        include: {
          course: true
        }
      });

      if (!academicYear || academicYear.course.ownerId !== locals.user.id) {
        return fail(404, { message: 'Anno accademico non trovato o non autorizzato' });
      }

      await db.academicYear.update({
        where: { id: params.id },
        data: {
          isActive: false,
          endDate: new Date()
        }
      });

      return { success: true, message: 'Anno accademico disattivato con successo' };
    } catch (err) {
      console.error('Error deactivating academic year:', err);
      return fail(500, { message: 'Errore nella disattivazione dell\'anno accademico' });
    }
  },

  enrollStudent: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const userId = data.get('userId') as string;

    if (!userId) {
      return fail(400, { message: 'ID studente obbligatorio' });
    }

    try {
      // Verify ownership
      const academicYear = await db.academicYear.findUnique({
        where: { id: params.id },
        include: {
          course: true
        }
      });

      if (!academicYear || academicYear.course.ownerId !== locals.user.id) {
        return fail(404, { message: 'Anno accademico non trovato o non autorizzato' });
      }

      // Check if student exists
      const student = await db.user.findUnique({
        where: { id: userId, role: 'ISCRITTO' }
      });

      if (!student) {
        return fail(404, { message: 'Studente non trovato' });
      }

      // Check if already enrolled
      const existingEnrollment = await db.academicYearEnrollment.findUnique({
        where: {
          userId_academicYearId: {
            userId,
            academicYearId: params.id
          }
        }
      });

      if (existingEnrollment) {
        return fail(400, { message: 'Lo studente è già iscritto a questo anno accademico' });
      }

      // Create enrollment
      await db.academicYearEnrollment.create({
        data: {
          userId,
          academicYearId: params.id
        }
      });

      return { success: true, message: `${student.name} è stato iscritto all'anno accademico con successo` };
    } catch (err) {
      console.error('Error enrolling student:', err);
      return fail(500, { message: 'Errore nell\'iscrizione dello studente' });
    }
  },

  unenrollStudent: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const userId = data.get('userId') as string;

    if (!userId) {
      return fail(400, { message: 'ID studente obbligatorio' });
    }

    try {
      // Verify ownership
      const academicYear = await db.academicYear.findUnique({
        where: { id: params.id },
        include: {
          course: true
        }
      });

      if (!academicYear || academicYear.course.ownerId !== locals.user.id) {
        return fail(404, { message: 'Anno accademico non trovato o non autorizzato' });
      }

      // Check if student has scores in this academic year
      const hasScores = await db.score.findFirst({
        where: {
          userId,
          lesson: {
            academicYearId: params.id
          }
        }
      });

      if (hasScores) {
        return fail(400, { 
          message: 'Impossibile disiscrivere lo studente: ha già punteggi assegnati in questo anno accademico.' 
        });
      }

      // Check if enrollment exists
      const existingEnrollment = await db.academicYearEnrollment.findUnique({
        where: {
          userId_academicYearId: {
            userId,
            academicYearId: params.id
          }
        }
      });

      if (!existingEnrollment) {
        return fail(404, { message: 'Iscrizione non trovata' });
      }

      // Delete enrollment
      await db.academicYearEnrollment.delete({
        where: {
          userId_academicYearId: {
            userId,
            academicYearId: params.id
          }
        }
      });

      // Get student name for confirmation message
      const student = await db.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });

      return { success: true, message: `${student?.name || 'Lo studente'} è stato disiscritto dall'anno accademico con successo` };
    } catch (err) {
      console.error('Error unenrolling student:', err);
      return fail(500, { message: 'Errore nella disiscrizione dello studente' });
    }
  }
};
