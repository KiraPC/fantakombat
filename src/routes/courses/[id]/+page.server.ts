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
    const course = await db.course.findUnique({
      where: {
        id: params.id,
        ownerId: locals.user.id
      },
      include: {
        academicYears: {
          include: {
            lessons: {
              include: {
                scores: true
              }
            },
            enrollments: {
              include: {
                user: true
              }
            }
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      }
    });

    if (!course) {
      throw error(404, 'Corso non trovato');
    }

    // Get all enrollments for this course across all academic years
    const allEnrollments = await db.academicYearEnrollment.findMany({
      where: {
        academicYear: {
          courseId: params.id
        }
      },
      include: {
        user: true,
        academicYear: true
      }
    });

    return {
      course: {
        id: course.id,
        name: course.name,
        description: course.description,
        isActive: course.isActive,
        createdAt: course.createdAt.toISOString(),
        academicYears: course.academicYears.map((year: any) => ({
          id: year.id,
          name: year.name,
          startDate: year.startDate.toISOString(),
          endDate: year.endDate?.toISOString(),
          isActive: year.isActive,
          createdAt: year.createdAt.toISOString(),
          lessonsCount: year.lessons.length,
          scoresCount: year.lessons.reduce((sum: any, lesson: any) => sum + lesson.scores.length, 0),
          enrolledStudents: year.enrollments.map((enrollment: any) => ({
            id: enrollment.id,
            userId: enrollment.userId,
            userName: enrollment.user.name,
            userEmail: enrollment.user.email,
            enrolledAt: enrollment.enrolledAt.toISOString()
          }))
        })),
        // Get unique enrollments across all academic years for this course
        enrollments: allEnrollments.map((enrollment: any) => ({
          id: enrollment.id,
          userId: enrollment.userId,
          userName: enrollment.user.name,
          userEmail: enrollment.user.email,
          enrolledAt: enrollment.enrolledAt.toISOString(),
          academicYearName: enrollment.academicYear.name
        }))
      },
      // Get available students (not enrolled in any academic year of this course)
      availableStudents: await db.user.findMany({
        where: {
          role: 'ISCRITTO',
          academicYearEnrollments: {
            none: {
              academicYear: {
                courseId: params.id
              }
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      }),
      // Get current active academic year for enrollment
      currentAcademicYear: await db.academicYear.findFirst({
        where: {
          courseId: params.id,
          isActive: true
        },
        select: {
          id: true,
          name: true
        }
      })
    };
  } catch (err) {
    console.error('Error loading course:', err);
    throw error(500, 'Errore nel caricamento del corso');
  }
};

export const actions: Actions = {
  createAcademicYear: async ({ request, locals, params }) => {
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
      // Verify course ownership
      const course = await db.course.findUnique({
        where: { id: params.id, ownerId: locals.user.id }
      });

      if (!course) {
        return fail(404, { message: 'Corso non trovato o non autorizzato' });
      }

      // Check if academic year name already exists for this course
      const existingYear = await db.academicYear.findFirst({
        where: {
          courseId: params.id,
          name: name.trim()
        }
      });

      if (existingYear) {
        return fail(400, { message: 'Esiste già un anno accademico con questo nome per questo corso' });
      }

      // Close any other active academic years for this course
      await db.academicYear.updateMany({
        where: {
          courseId: params.id,
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      const academicYear = await db.academicYear.create({
        data: {
          name: name.trim(),
          courseId: params.id,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          isActive: true
        }
      });

      return { success: true, message: 'Anno accademico creato con successo', academicYearId: academicYear.id };
    } catch (err) {
      console.error('Error creating academic year:', err);
      return fail(500, { message: 'Errore nella creazione dell\'anno accademico' });
    }
  },

  updateAcademicYear: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const id = data.get('id') as string;
    const name = data.get('name') as string;
    const startDate = data.get('startDate') as string;
    const endDate = data.get('endDate') as string;

    // Validation
    if (!id) {
      return fail(400, { message: 'ID anno accademico mancante' });
    }

    if (!name || name.trim().length === 0) {
      return fail(400, { message: 'Il nome dell\'anno accademico è obbligatorio' });
    }

    if (!startDate) {
      return fail(400, { message: 'La data di inizio è obbligatoria' });
    }

    try {
      // Verify course ownership through academic year
      const academicYear = await db.academicYear.findUnique({
        where: { id },
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
          courseId: params.id,
          name: name.trim(),
          NOT: {
            id: id
          }
        }
      });

      if (existingYear) {
        return fail(400, { message: 'Esiste già un anno accademico con questo nome per questo corso' });
      }

      await db.academicYear.update({
        where: { id },
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

  closeAcademicYear: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const id = data.get('id') as string;

    if (!id) {
      return fail(400, { message: 'ID anno accademico mancante' });
    }

    try {
      // Verify course ownership through academic year
      const academicYear = await db.academicYear.findUnique({
        where: { id },
        include: {
          course: true
        }
      });

      if (!academicYear || academicYear.course.ownerId !== locals.user.id) {
        return fail(404, { message: 'Anno accademico non trovato o non autorizzato' });
      }

      await db.academicYear.update({
        where: { id },
        data: {
          isActive: false,
          endDate: new Date()
        }
      });

      return { success: true, message: 'Anno accademico chiuso con successo' };
    } catch (err) {
      console.error('Error closing academic year:', err);
      return fail(500, { message: 'Errore nella chiusura dell\'anno accademico' });
    }
  },

  deleteAcademicYear: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const id = data.get('id') as string;

    if (!id) {
      return fail(400, { message: 'ID anno accademico mancante' });
    }

    try {
      // Verify course ownership through academic year
      const academicYear = await db.academicYear.findUnique({
        where: { id },
        include: {
          course: true,
          lessons: {
            include: {
              scores: true
            }
          }
        }
      });

      if (!academicYear || academicYear.course.ownerId !== locals.user.id) {
        return fail(404, { message: 'Anno accademico non trovato o non autorizzato' });
      }

      // Check if there are any lessons with scores
      const hasScores = academicYear.lessons.some(lesson => lesson.scores.length > 0);

      if (hasScores) {
        return fail(400, { 
          message: 'Impossibile eliminare l\'anno accademico: contiene lezioni con punteggi assegnati. Elimina prima tutti i punteggi.' 
        });
      }

      // Delete lessons first, then academic year
      await db.lesson.deleteMany({
        where: { academicYearId: id }
      });

      await db.academicYear.delete({
        where: { id }
      });

      return { success: true, message: 'Anno accademico eliminato con successo' };
    } catch (err) {
      console.error('Error deleting academic year:', err);
      return fail(500, { message: 'Errore nell\'eliminazione dell\'anno accademico' });
    }
  },

  enrollStudent: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const userId = data.get('userId') as string;
    const academicYearId = data.get('academicYearId') as string;

    if (!userId) {
      return fail(400, { message: 'ID studente obbligatorio' });
    }

    if (!academicYearId) {
      return fail(400, { message: 'Anno accademico obbligatorio' });
    }

    try {
      // Verify academic year belongs to this course and is owned by the teacher
      const academicYear = await db.academicYear.findUnique({
        where: { id: academicYearId },
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
            academicYearId
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
          academicYearId
        }
      });

      return { success: true, message: `${student.name} è stato iscritto all'anno accademico ${academicYear.name} con successo` };
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
    const academicYearId = data.get('academicYearId') as string;

    if (!userId) {
      return fail(400, { message: 'ID studente obbligatorio' });
    }

    if (!academicYearId) {
      return fail(400, { message: 'Anno accademico obbligatorio' });
    }

    try {
      // Verify academic year belongs to this course and is owned by the teacher
      const academicYear = await db.academicYear.findUnique({
        where: { id: academicYearId },
        include: {
          course: true
        }
      });

      if (!academicYear || academicYear.course.ownerId !== locals.user.id) {
        return fail(404, { message: 'Anno accademico non trovato o non autorizzato' });
      }

      // Check if student has scores in this specific academic year
      const hasScores = await db.score.findFirst({
        where: {
          userId,
          lesson: {
            academicYearId: academicYearId
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
            academicYearId
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
            academicYearId
          }
        }
      });

      // Get student name for confirmation message
      const student = await db.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });

      return { success: true, message: `${student?.name || 'Lo studente'} è stato disiscritto dall'anno accademico ${academicYear.name} con successo` };
    } catch (err) {
      console.error('Error unenrolling student:', err);
      return fail(500, { message: 'Errore nella disiscrizione dello studente' });
    }
  }
};
