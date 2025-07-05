// Register page server actions - DISABLED
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Disable registration route
export const load: PageServerLoad = async () => {
  throw error(404, 'Registrazione non disponibile. Contatta l\'amministratore per creare un account.');
};
