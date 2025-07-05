<script lang="ts">
  import { goto } from '$app/navigation';
  import { format } from 'date-fns';
  import { it } from 'date-fns/locale';
  import type { PageData } from './$types';

  export let data: PageData;

  // Handle year filter change
  function handleYearChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const yearId = target.value;
    
    const url = new URL(window.location.href);
    if (yearId) {
      url.searchParams.set('year', yearId);
    } else {
      url.searchParams.delete('year');
    }
    goto(url.toString());
  }

  // Format date for display
  function formatDate(dateString: string): string {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
  }

  // Get position color
  function getPositionColor(position: number): string {
    if (position === 1) return 'text-yellow-600'; // Gold
    if (position === 2) return 'text-gray-600'; // Silver
    if (position === 3) return 'text-amber-600'; // Bronze
    return 'text-gray-500';
  }

  // Get position icon
  function getPositionIcon(position: number): string {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '🏆';
  }

  // Check if user is current user
  function isCurrentUser(userId: string): boolean {
    return userId === data.currentUser.id;
  }
</script>

<svelte:head>
  <title>Classifiche - Fantakombat</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">🏆 Classifiche</h1>
      <p class="text-gray-600 mt-2">Scopri la tua posizione nella classifica</p>
    </div>
    
    {#if data.availableYears.length > 0}
      <div class="flex items-center gap-2">
        <label for="yearFilter" class="text-sm font-medium text-gray-700">
          Anno Accademico:
        </label>
        <select
          id="yearFilter"
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          on:change={handleYearChange}
        >
          {#each data.availableYears as year}
            <option 
              value={year.id}
              selected={data.selectedYear === year.id}
            >
              {year.courseName} - {year.name} {year.isActive ? '(Attivo)' : '(Chiuso)'}
            </option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  {#if data.availableYears.length === 0}
    <!-- No courses enrolled -->
    <div class="text-center py-12">
      <span class="text-6xl mb-4 block">📚</span>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        Nessun corso trovato
      </h3>
      <p class="text-gray-600 mb-4">
        Non sei ancora iscritto a nessun corso. Contatta il tuo insegnante per iscriverti.
      </p>
    </div>
  {:else if data.selectedYearInfo}
    <!-- Year Info -->
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {data.selectedYearInfo.courseName}
          </h2>
          <p class="text-gray-600">
            Anno Accademico: {data.selectedYearInfo.name}
          </p>
          <div class="text-sm text-gray-500 mt-1">
            <span>Inizio: {formatDate(data.selectedYearInfo.startDate)}</span>
            {#if data.selectedYearInfo.endDate}
              <span class="ml-4">Fine: {formatDate(data.selectedYearInfo.endDate)}</span>
            {/if}
          </div>
        </div>
        <div class="text-right">
          <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {data.rankings.length} partecipanti
          </span>
        </div>
      </div>
    </div>

    <!-- Rankings -->
    {#if data.rankings.length === 0}
      <div class="text-center py-12">
        <span class="text-6xl mb-4 block">🏆</span>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          Nessun punteggio disponibile
        </h3>
        <p class="text-gray-600">
          Non ci sono ancora punteggi assegnati per questo anno accademico.
        </p>
      </div>
    {:else}
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            Classifica Generale
          </h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posizione
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partecipante
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Punteggio Totale
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonus
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Malus
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lezioni
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each data.rankings as user, index}
                <tr class="hover:bg-gray-50 {isCurrentUser(user.userId) ? 'bg-blue-50' : ''}">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <span class="text-2xl mr-2">{getPositionIcon(user.position)}</span>
                      <span class="text-lg font-bold {getPositionColor(user.position)}">
                        #{user.position}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <span class="text-white font-bold text-lg">
                            {user.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 flex items-center">
                          {user.userName}
                          {#if isCurrentUser(user.userId)}
                            <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Tu
                            </span>
                          {/if}
                        </div>
                        <div class="text-sm text-gray-500">
                          {user.userEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="text-lg font-bold text-gray-900">
                      {user.totalPoints.toFixed(1).replace('.0', '')}
                    </div>
                    <div class="text-sm text-gray-500">
                      punti
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="text-sm font-medium text-green-600">
                      +{user.bonusPoints}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="text-sm font-medium text-red-600">
                      -{user.malusPoints}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="text-sm font-medium text-gray-900">
                      {user.totalLessons}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="text-sm font-medium text-gray-900">
                      {user.scoresCount}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Current User Stats -->
      {#if data.rankings.length > 0}
        {@const currentUserRank = data.rankings.find(r => r.userId === data.currentUser.id)}
        {#if currentUserRank}
          <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-blue-900">
                  Le tue statistiche
                </h3>
                <p class="text-blue-700">
                  Sei al {currentUserRank.position}° posto con {currentUserRank.totalPoints.toFixed(1).replace('.0', '')} punti
                </p>
              </div>
              <div class="text-right">
                <div class="text-2xl text-blue-600">
                  {getPositionIcon(currentUserRank.position)}
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div class="bg-white rounded-lg p-4">
                <div class="text-2xl font-bold text-blue-600">
                  {currentUserRank.totalPoints.toFixed(1).replace('.0', '')}
                </div>
                <div class="text-sm text-gray-600">Punti totali</div>
              </div>
              <div class="bg-white rounded-lg p-4">
                <div class="text-2xl font-bold text-green-600">
                  +{currentUserRank.bonusPoints}
                </div>
                <div class="text-sm text-gray-600">Bonus</div>
              </div>
              <div class="bg-white rounded-lg p-4">
                <div class="text-2xl font-bold text-red-600">
                  -{currentUserRank.malusPoints}
                </div>
                <div class="text-sm text-gray-600">Malus</div>
              </div>
              <div class="bg-white rounded-lg p-4">
                <div class="text-2xl font-bold text-purple-600">
                  {currentUserRank.totalLessons}
                </div>
                <div class="text-sm text-gray-600">Lezioni</div>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    {/if}
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
  }
</style>
