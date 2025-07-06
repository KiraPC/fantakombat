import { register, init, getLocaleFromNavigator, isLoading } from 'svelte-i18n';
import { browser } from '$app/environment';

// Lingue supportate
export const supportedLocales = ['it', 'en'];

// Labels per le lingue
export const localeLabels = {
  it: 'Italiano',
  en: 'English'
};

// Registrazione delle traduzioni
register('en', () => import('./locales/en.json'));
register('it', () => import('./locales/it.json'));

// Funzione per ottenere la lingua preferita
function getPreferredLocale(): string {
  if (browser) {
    const saved = localStorage.getItem('fantakombat-locale');
    if (saved && supportedLocales.includes(saved)) {
      return saved;
    }
  }
  
  const navigatorLocale = getLocaleFromNavigator();
  if (navigatorLocale && supportedLocales.includes(navigatorLocale)) {
    return navigatorLocale;
  }
  
  return 'it'; // Fallback
}

// Inizializzazione
init({
  fallbackLocale: 'it',
  initialLocale: getPreferredLocale(),
});

// Funzione per cambiare lingua
export function setLanguage(locale: string) {
  if (browser) {
    localStorage.setItem('fantakombat-locale', locale);
  }
  
  init({
    fallbackLocale: 'it',
    initialLocale: locale,
  });
}

// Export the isLoading store for components to check if translations are ready
export { isLoading };
