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
    const [lesson, actions, users, presences] = await Promise.all([
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
        where: {
          isAutomatic: false
        },
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
      }),
      db.presence.findMany({
        where: {
          lessonId: lessonId
        },
        select: {
          userId: true,
          createdAt: true
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
            type: score.action.type,
            isAutomatic: score.action.isAutomatic
          }
        }))
      },
      actions: actions.map(action => ({
        id: action.id,
        name: action.name,
        points: action.points,
        type: action.type
      })),
      users: users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email
      })),
      presences: presences.map((p: any) => ({
        userId: p.userId,
        createdAt: p.createdAt.toISOString()
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
  },

  setPresences: async ({ request, locals, params }) => {
    if (!locals.user || locals.user.role !== 'INSEGNANTE') {
      return fail(403, { message: 'Accesso negato' });
    }

    const data = await request.formData();
    const lessonId = params.id;
    const userIds = data.getAll('userIds') as string[];

    try {
      // Ottieni la lezione corrente con anno accademico
      const currentLesson = await db.lesson.findUnique({
        where: { id: lessonId },
        include: { academicYear: true }
      });

      if (!currentLesson) {
        return fail(404, { message: 'Lezione non trovata' });
      }

      // Ottieni tutte le lezioni precedenti dello stesso anno accademico, ordinate per data
      const allLessons = await db.lesson.findMany({
        where: {
          academicYearId: currentLesson.academicYearId,
          date: { lte: currentLesson.date }
        },
        orderBy: { date: 'desc' },
        include: {
          presences: true
        }
      });

      // Ottieni tutti gli utenti iscritti
      const allUsers = await db.user.findMany({
        where: { role: 'ISCRITTO' }
      });

      // Trova le azioni automatiche (presenza/assenza e streak)
      const presenceAction = await db.action.findFirst({
        where: { 
          courseId: currentLesson.academicYear.courseId,
          name: { contains: 'Presenza', mode: 'insensitive' }
        }
      });

      const absenceAction = await db.action.findFirst({
        where: { 
          courseId: currentLesson.academicYear.courseId,
          name: { contains: 'Assenza', mode: 'insensitive' }
        }
      });

      // Rimuovi presenze e punteggi automatici esistenti per questa lezione
      await db.presence.deleteMany({
        where: { lessonId }
      });

      // Rimuovi i punteggi automatici di presenza/assenza per questa lezione
      if (presenceAction || absenceAction) {
        await db.score.deleteMany({
          where: {
            lessonId,
            actionId: {
              in: [presenceAction?.id, absenceAction?.id].filter(Boolean) as string[]
            }
          }
        });
      }

      // Crea le nuove presenze
      if (userIds.length > 0) {
        await db.presence.createMany({
          data: userIds.map(userId => ({
            lessonId,
            userId
          }))
        });
      }

      // Calcola e assegna punti automatici per ogni utente
      const pointsAssigned: string[] = [];
      
      for (const user of allUsers) {
        const isPresent = userIds.includes(user.id);
        
        // Assegna punto presenza/assenza
        if (isPresent && presenceAction) {
          await db.score.create({
            data: {
              userId: user.id,
              lessonId,
              actionId: presenceAction.id,
              points: presenceAction.points,
              assignedBy: locals.user!.id
            }
          });
        } else if (!isPresent && absenceAction) {
          await db.score.create({
            data: {
              userId: user.id,
              lessonId,
              actionId: absenceAction.id,
              points: absenceAction.points,
              assignedBy: locals.user!.id
            }
          });
        }

        // Calcola streak di presenze consecutive
        if (isPresent) {
          let consecutivePresences = 1; // Include la lezione corrente
          
          // Conta le presenze consecutive nelle lezioni precedenti
          for (let i = 1; i < allLessons.length; i++) {
            const prevLesson = allLessons[i];
            const wasPresent = prevLesson.presences.some(p => p.userId === user.id);
            
            if (wasPresent) {
              consecutivePresences++;
            } else {
              break;
            }
          }

          // Calcola bonus per streak SOLO a multipli esatti di 3
          // Bonus assegnato SOLO a 3, 6, 9, 12, 15... presenze consecutive
          let bonusPoints = 0;
          let bonusMessage = '';
          
          if (consecutivePresences >= 3 && consecutivePresences % 3 === 0) {
            // Calcola il livello di streak (3→1, 6→2, 9→3, 12→4, ecc.)
            const streakLevel = consecutivePresences / 3;
            bonusPoints = streakLevel * 0.5;
            
            // Emoji basato sul livello
            let emoji = '✨';
            if (consecutivePresences >= 12) emoji = '🏆';
            else if (consecutivePresences >= 9) emoji = '🔥🔥';
            else if (consecutivePresences >= 6) emoji = '🔥';
            
            bonusMessage = `${emoji} ${user.name}: ${consecutivePresences} presenze consecutive (+${bonusPoints})`;
          }

          if (bonusPoints > 0) {
            // Cerca l'azione per bonus presenze consecutive
            const streakAction = await db.action.findFirst({
              where: {
                courseId: currentLesson.academicYear.courseId,
                name: 'Bonus Presenze Consecutive',
                isAutomatic: true
              }
            });

            if (!streakAction) {
              console.warn('Azione "Bonus Presenze Consecutive" non trovata');
              continue;
            }

            await db.score.create({
              data: {
                userId: user.id,
                lessonId,
                actionId: streakAction.id,
                points: bonusPoints,
                assignedBy: locals.user!.id,
                notes: `${consecutivePresences} presenze consecutive`
              }
            });

            pointsAssigned.push(bonusMessage);
          }
        } else {
          // Calcola streak di assenze consecutive
          let consecutiveAbsences = 1; // Include la lezione corrente
          
          for (let i = 1; i < allLessons.length; i++) {
            const prevLesson = allLessons[i];
            const wasPresent = prevLesson.presences.some(p => p.userId === user.id);
            
            if (!wasPresent) {
              consecutiveAbsences++;
            } else {
              break;
            }
          }

          // Calcola malus per streak SOLO a multipli esatti di 3
          // Malus assegnato SOLO a 3, 6, 9, 12 assenze consecutive
          // Punti: 3→-0.5, 6→-1.0, 9→-1.5, 12→-2.0 (poi rimane -2.0)
          let malusPoints = 0;
          let malusMessage = '';
          
          if (consecutiveAbsences >= 3 && consecutiveAbsences % 3 === 0) {
            // Calcola il livello di streak (3→1, 6→2, 9→3, 12→4)
            const streakLevel = consecutiveAbsences / 3;
            // Malus progressivo: -0.5, -1.0, -1.5, -2.0 (cap a -2.0)
            malusPoints = Math.max(-2.0, streakLevel * -0.5);
            
            // Emoji basato sul livello
            let emoji = '⚠️';
            if (consecutiveAbsences >= 12) emoji = '🚨';
            else if (consecutiveAbsences >= 9) emoji = '⚠️⚠️';
            else if (consecutiveAbsences >= 6) emoji = '⚠️🔴';
            
            malusMessage = `${emoji} ${user.name}: ${consecutiveAbsences} assenze consecutive (${malusPoints})`;
          }

          if (malusPoints < 0) {
            // Cerca l'azione per malus assenze consecutive
            const streakAction = await db.action.findFirst({
              where: {
                courseId: currentLesson.academicYear.courseId,
                name: 'Malus Assenze Consecutive',
                isAutomatic: true
              }
            });

            if (!streakAction) {
              console.warn('Azione "Malus Assenze Consecutive" non trovata');
              continue;
            }

            await db.score.create({
              data: {
                userId: user.id,
                lessonId,
                actionId: streakAction.id,
                points: malusPoints,
                assignedBy: locals.user!.id,
                notes: `${consecutiveAbsences} assenze consecutive`
              }
            });

            pointsAssigned.push(malusMessage);
          }
        }
      }

      let message = `Presenze salvate: ${userIds.length} ${userIds.length === 1 ? 'allievo presente' : 'allievi presenti'}`;
      if (pointsAssigned.length > 0) {
        message += `\n\nBonus/Malus assegnati:\n${pointsAssigned.join('\n')}`;
      }

      return { 
        success: true, 
        message
      };
    } catch (err) {
      console.error('Error saving presences:', err);
      return fail(500, { message: 'Errore nel salvataggio delle presenze' });
    }
  }
};
