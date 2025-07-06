<script lang="ts">
  import { locale } from 'svelte-i18n';
  import { setLanguage, supportedLocales, localeLabels } from '$lib/i18n';

  function handleLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newLocale = target.value;
    setLanguage(newLocale);
    
    // Salva la preferenza nel localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fantakombat-locale', newLocale);
    }
    
    // Ricarica la pagina per applicare immediatamente le traduzioni
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
</script>

<div class="language-selector">
  <label for="language-select" class="sr-only">
    Seleziona lingua / Select language
  </label>
  <select
    id="language-select"
    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
    value={$locale}
    on:change={handleLanguageChange}
  >
    {#each supportedLocales as localeCode}
      <option value={localeCode}>
        {localeLabels[localeCode as keyof typeof localeLabels]}
      </option>
    {/each}
  </select>
</div>

<style>
  .language-selector {
    display: inline-block;
    min-width: 120px;
  }
  
  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
  }
</style>
