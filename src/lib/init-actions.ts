import { db } from '$lib/db';

/**
 * Inizializza le azioni automatiche per tutti i corsi attivi.
 * Viene chiamato all'avvio del server.
 */
export async function initializeAutomaticActions() {
  try {
    console.log('🔧 Inizializzazione azioni automatiche...');

    // Ottieni tutti i corsi attivi
    const courses = await db.course.findMany({
      where: { isActive: true }
    });

    for (const course of courses) {
      // Definizione delle azioni automatiche standard
      const automaticActions = [
        {
          name: 'Presenza',
          description: 'Punto presenza alla lezione (automatico)',
          points: 1.0,
          type: 'BONUS' as const
        },
        {
          name: 'Assenza',
          description: 'Penalità per assenza alla lezione (automatico)',
          points: -0.5,
          type: 'MALUS' as const
        },
        {
          name: 'Bonus Presenze Consecutive',
          description: 'Bonus per presenze consecutive: +0.5 per 3+ lezioni, +1.0 per 6+ lezioni (automatico)',
          points: 0.5,
          type: 'BONUS' as const
        },
        {
          name: 'Malus Assenze Consecutive',
          description: 'Malus per assenze consecutive: -0.5 per 3+ lezioni, -1.0 per 6+ lezioni (automatico)',
          points: -0.5,
          type: 'MALUS' as const
        }
      ];

      // Crea le azioni se non esistono
      for (const actionData of automaticActions) {
        await db.action.upsert({
          where: {
            courseId_name: {
              courseId: course.id,
              name: actionData.name
            }
          },
          update: {
            // Non aggiorniamo nulla, manteniamo le modifiche dell'utente
          },
          create: {
            ...actionData,
            courseId: course.id,
            isActive: true,
            isAutomatic: true
          }
        });
      }
    }

    console.log('✅ Azioni automatiche inizializzate con successo');
  } catch (error) {
    console.error('❌ Errore nell\'inizializzazione delle azioni automatiche:', error);
    // Non blocchiamo l'avvio del server per questo errore
  }
}
