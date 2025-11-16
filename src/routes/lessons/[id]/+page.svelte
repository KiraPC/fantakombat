<!-- Lesson detail page for teachers -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  
  export let data;
  export let form;
  

  let removeScoreConfirmId: string | null = null;
  let activeTab = 'presenze'; // 'presenze' | 'punti'
  let presentUserIds: string[] = (data.presences || []).map((p: any) => p.userId);
  let isSavingPresences = false;
  let isSavingActions = false;
  
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
      // Always invalidate to ensure we have the latest data
      await invalidateAll();
      
      if (result.type === 'success') {
        resetForm();
        removeScoreConfirmId = null;
        selectedUserId = '';
        selectedActionIds = [];
      }
      
      isSavingPresences = false;
      isSavingActions = false;
      
      // Log for debugging
      console.log('Form submission result:', result);
      
      // Call update at the end
      await update();
    };
  };

  // Enhanced handler for presence form
  const handlePresenceForm = () => {
    isSavingPresences = true;
    return handleSubmitResult();
  };

  // Enhanced handler for actions form
  const handleActionsForm = () => {
    isSavingActions = true;
    return handleSubmitResult();
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

  // Aggregate scores by user
  function aggregateScoresByUser(scores: any[]) {
    const userMap = new Map();
    
    scores.forEach(score => {
      const userId = score.user.id;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user: score.user,
          totalPoints: 0,
          actions: []
        });
      }
      
      const userScore = userMap.get(userId);
      userScore.totalPoints += score.points;
      userScore.actions.push({
        id: score.id,
        action: score.action,
        points: score.points,
        createdAt: score.createdAt
      });
    });
    
    return Array.from(userMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  }

  let expandedUsers = new Set<string>();
  
  function toggleUserExpanded(userId: string) {
    if (expandedUsers.has(userId)) {
      expandedUsers.delete(userId);
    } else {
      expandedUsers.add(userId);
    }
    expandedUsers = expandedUsers; // trigger reactivity
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
    
    <!-- Tabs Switch -->
    <div class="px-4 sm:px-0 mb-8">
      <div class="flex border-b border-gray-200">
        <button
          class="px-4 py-2 -mb-px text-sm font-medium border-b-2 focus:outline-none transition-colors"
          class:border-primary-600={activeTab === 'presenze'}
          class:text-primary-600={activeTab === 'presenze'}
          class:border-transparent={activeTab !== 'presenze'}
          class:text-gray-500={activeTab !== 'presenze'}
          on:click={() => activeTab = 'presenze'}
        >
          Presenze
        </button>
        <button
          class="ml-4 px-4 py-2 -mb-px text-sm font-medium border-b-2 focus:outline-none transition-colors"
          class:border-primary-600={activeTab === 'punti'}
          class:text-primary-600={activeTab === 'punti'}
          class:border-transparent={activeTab !== 'punti'}
          class:text-gray-500={activeTab !== 'punti'}
          on:click={() => activeTab = 'punti'}
        >
          Assegna punti
        </button>
      </div>
    </div>

    {#if activeTab === 'presenze'}
      <div class="px-4 sm:px-0 mb-8">
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Gestione Presenze</h2>
          <form method="POST" action="?/setPresences" use:enhance={handlePresenceForm}>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Seleziona gli allievi presenti a questa lezione:
              </label>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto border rounded-md p-4 bg-gray-50">
                {#each data.users as user}
                  <div class="flex items-center p-2 hover:bg-white rounded transition-colors">
                    <input
                      type="checkbox"
                      id="presence-{user.id}"
                      name="userIds"
                      value={user.id}
                      checked={presentUserIds.includes(user.id)}
                      class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label for="presence-{user.id}" class="ml-3 text-sm cursor-pointer flex-1 font-medium text-gray-700">
                      {user.name}
                    </label>
                  </div>
                {/each}
              </div>
              <p class="mt-2 text-xs text-gray-500">
                {presentUserIds.length} {presentUserIds.length === 1 ? 'allievo selezionato' : 'allievi selezionati'}
              </p>
            </div>
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                on:click={() => presentUserIds = []}
                class="btn btn-secondary"
                disabled={isSavingPresences}
              >
                Deseleziona tutti
              </button>
              <button
                type="button"
                on:click={() => presentUserIds = data.users.map((u: any) => u.id)}
                class="btn btn-secondary"
                disabled={isSavingPresences}
              >
                Seleziona tutti
              </button>
              <button type="submit" class="btn btn-primary relative" disabled={isSavingPresences}>
                {#if isSavingPresences}
                  <span class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calcolo punti...
                  </span>
                {:else}
                  💾 Salva Presenze
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    {:else if activeTab === 'punti'}
      <div class="px-4 sm:px-0 mb-8">
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">
            Assegna Punti
          </h2>
          <form 
            method="POST" 
            action="?/assignMultiplePoints"
            use:enhance={handleActionsForm}
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
                disabled={!selectedUserId || selectedActionIds.length === 0 || isSavingActions}
                class="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                {#if isSavingActions}
                  <span class="flex items-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Assegnazione in corso...
                  </span>
                {:else}
                  Assegna {selectedActionIds.length > 0 ? `${selectedActionIds.length} azioni` : 'Punti'}
                {/if}
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
    
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
          <div class="space-y-4">
            {#each aggregateScoresByUser(data.lesson.scores) as userScore}
              <div class="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div class="bg-gray-50 px-6 py-4 flex items-center justify-between">
                  <div class="flex items-center flex-1">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span class="text-primary-600 font-medium">
                          {userScore.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-base font-semibold text-gray-900">
                        {userScore.user.name}
                      </div>
                      <div class="text-sm text-gray-500">
                        {userScore.actions.length} {userScore.actions.length === 1 ? 'azione' : 'azioni'}
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-4">
                    <div class="text-right">
                      <div class="text-2xl font-bold" class:text-green-600={userScore.totalPoints > 0} class:text-red-600={userScore.totalPoints < 0} class:text-gray-900={userScore.totalPoints === 0}>
                        {userScore.totalPoints > 0 ? '+' : ''}{userScore.totalPoints}
                      </div>
                      <div class="text-xs text-gray-500">punti totali</div>
                    </div>
                    <button
                      on:click={() => toggleUserExpanded(userScore.user.id)}
                      class="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <span class="transform transition-transform inline-block" class:rotate-180={expandedUsers.has(userScore.user.id)}>
                        ▼
                      </span>
                    </button>
                  </div>
                </div>
                
                {#if expandedUsers.has(userScore.user.id)}
                  <div class="bg-white px-6 py-4">
                    <div class="space-y-3">
                      {#each userScore.actions as action}
                        <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div class="flex items-center flex-1">
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {action.action.type === 'BONUS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                              {action.action.type === 'BONUS' ? '🟢' : '🔴'} {action.action.name}
                            </span>
                            {#if action.action.isAutomatic}
                              <span class="ml-2 text-xs text-gray-400 italic">🤖 auto</span>
                            {/if}
                            <span class="ml-3 text-sm text-gray-500">
                              {formatDateTime(action.createdAt)}
                            </span>
                          </div>
                          <div class="flex items-center space-x-3">
                            <span class="text-sm font-semibold" class:text-green-600={action.points > 0} class:text-red-600={action.points < 0}>
                              {action.points > 0 ? '+' : ''}{action.points}
                            </span>
                            <button
                              on:click={() => removeScoreConfirmId = action.id}
                              class="text-red-600 hover:text-red-900 text-sm"
                              title="Rimuovi questo punteggio"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
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
            >
              Rimuovi
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
{/if}
