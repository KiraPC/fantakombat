<!-- Lesson detail page for teachers -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  
  export let data;
  export let form;
  
  let removeScoreConfirmId: string | null = null;
  
  // Form fields
  let selectedUserId = '';
  let selectedActionIds: string[] = [];
  
  // Reset form
  function resetForm() {
    selectedUserId = '';
    selectedActionIds = [];
  }
  
  // Toggle action selection
  function toggleActionSelection(actionId: string) {
    if (selectedActionIds.includes(actionId)) {
      selectedActionIds = selectedActionIds.filter(id => id !== actionId);
    } else {
      selectedActionIds = [...selectedActionIds, actionId];
    }
  }
  
  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Format datetime
  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Handle form submission result
  const handleSubmitResult = () => {
    return async ({ result, update }: any) => {
      // Update the form state with the result
      await update();
      
      // Always invalidate to ensure we have the latest data
      await invalidateAll();
      
      if (result.type === 'success') {
        resetForm();
        removeScoreConfirmId = null;
        selectedUserId = '';
        selectedActionIds = [];
      }
      
      // Log for debugging
      console.log('Form submission result:', result);
    };
  };
  
  // Get lesson total points
  function getLessonTotalPoints(lesson: any) {
    return lesson.scores.reduce((total: number, score: any) => total + score.points, 0);
  }
  
  // Get lesson participants count
  function getLessonParticipants(lesson: any) {
    const uniqueUsers = new Set(lesson.scores.map((score: any) => score.user.id));
    return uniqueUsers.size;
  }
</script>

<svelte:head>
  <title>Dettaglio Lezione {formatDate(data.lesson.date)} - Fantakombat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="px-4 py-6 sm:px-0">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav class="flex mb-4">
            <ol class="flex items-center space-x-2">
              <li>
                <a href="/lessons" class="text-gray-500 hover:text-gray-700">
                  📚 Lezioni
                </a>
              </li>
              <li>
                <span class="text-gray-500">/</span>
              </li>
              <li>
                <span class="text-gray-900 font-medium">
                  {formatDate(data.lesson.date)}
                </span>
              </li>
            </ol>
          </nav>
          <h1 class="text-3xl font-bold text-gray-900">
            📅 Lezione del {formatDate(data.lesson.date)}
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            Creata il {formatDateTime(data.lesson.createdAt)}
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex items-center space-x-4">
          <div class="text-sm text-gray-600">
            <span class="font-medium">{getLessonParticipants(data.lesson)}</span> partecipanti
          </div>
          <div class="text-sm text-gray-600">
            <span class="font-medium">{getLessonTotalPoints(data.lesson)}</span> punti totali
          </div>
        </div>
      </div>
    </div>
    
    <!-- Success/Error Messages -->
    {#if form?.success}
      <div class="px-4 sm:px-0 mb-6">
        <div class="rounded-md bg-green-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <span class="text-green-400 text-xl">✅</span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">
                {form.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    {#if form?.message && !form?.success}
      <div class="px-4 sm:px-0 mb-6">
        <div class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <span class="text-red-400 text-xl">❌</span>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">
                {form.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Assign Points Form -->
    <div class="px-4 sm:px-0 mb-8">
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          Assegna Punti
        </h2>
        <form 
          method="POST" 
          action="?/assignMultiplePoints"
          use:enhance={handleSubmitResult}
        >
          <!-- User Selection -->
          <div class="mb-4">
            <label for="userId" class="block text-sm font-medium text-gray-700 mb-2">
              Seleziona Iscritto
            </label>
            <select
              id="userId"
              name="userId"
              bind:value={selectedUserId}
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Seleziona iscritto</option>
              {#each data.users as user}
                <option value={user.id}>{user.name}</option>
              {/each}
            </select>
          </div>
          
          <!-- Actions Selection -->
          <div class="mb-4">
            <fieldset>
              <legend class="block text-sm font-medium text-gray-700 mb-3">
                Seleziona Azioni (puoi selezionarne più di una)
              </legend>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border rounded-md p-3">
                {#each data.actions as action}
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="action-{action.id}"
                      value={action.id}
                      checked={selectedActionIds.includes(action.id)}
                      on:change={() => toggleActionSelection(action.id)}
                      class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label for="action-{action.id}" class="ml-3 text-sm cursor-pointer flex-1">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {action.type === 'BONUS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        {action.type === 'BONUS' ? '🟢' : '🔴'} {action.name}
                      </span>
                      <span class="ml-2 font-medium">
                        ({action.points > 0 ? '+' : ''}{action.points} punti)
                      </span>
                    </label>
                  </div>
                {/each}
              </div>
            </fieldset>
            {#if selectedActionIds.length > 0}
              <p class="mt-2 text-sm text-gray-600">
                {selectedActionIds.length} azioni selezionate
              </p>
            {/if}
          </div>
          
          <!-- Hidden inputs for selected actions -->
          {#each selectedActionIds as actionId}
            <input type="hidden" name="actionIds" value={actionId} />
          {/each}
          
          <div class="flex justify-end">
            <button
              type="submit"
              disabled={!selectedUserId || selectedActionIds.length === 0}
              class="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assegna {selectedActionIds.length > 0 ? `${selectedActionIds.length} azioni` : 'Punti'}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Scores List -->
    <div class="px-4 sm:px-0">
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          Punteggi Assegnati ({data.lesson.scores.length})
        </h2>
        
        {#if data.lesson.scores.length === 0}
          <div class="text-center py-12">
            <span class="text-6xl mb-4 block">📊</span>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              Nessun punteggio assegnato
            </h3>
            <p class="text-gray-600">
              Inizia ad assegnare punti ai tuoi iscritti per questa lezione
            </p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Iscritto
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azione
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punti
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assegnato
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each data.lesson.scores as score}
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-8 w-8">
                          <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span class="text-primary-600 font-medium text-sm">
                              {score.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {score.user.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {score.action.type === 'BONUS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        {score.action.type === 'BONUS' ? '🟢' : '🔴'} {score.action.name}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">
                        {score.points > 0 ? '+' : ''}{score.points}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(score.createdAt)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        on:click={() => removeScoreConfirmId = score.id}
                        class="text-red-600 hover:text-red-900"
                      >
                        🗑️ Rimuovi
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Remove Score Confirmation Modal -->
{#if removeScoreConfirmId}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <span class="text-red-600 text-2xl">🗑️</span>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mt-2">
          Rimuovi Punteggio
        </h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500">
            Sei sicuro di voler rimuovere questo punteggio? Questa operazione non può essere annullata.
          </p>
        </div>
        <div class="flex justify-center space-x-3 mt-4">
          <button
            on:click={() => removeScoreConfirmId = null}
            class="btn btn-secondary"
          >
            Annulla
          </button>
          <form 
            method="POST" 
            action="?/removeScore"
            use:enhance={handleSubmitResult}
            class="inline"
          >
            <input type="hidden" name="scoreId" value={removeScoreConfirmId} />
            <button
              type="submit"
              class="btn bg-red-600 text-white hover:bg-red-700"
              on:click={() => removeScoreConfirmId = null}
            >
              Rimuovi
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
{/if}
