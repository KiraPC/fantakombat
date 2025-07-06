<!-- Profile page for Fantakombat -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { _ } from 'svelte-i18n';
  import type { ActionData } from './$types';
  
  export let data;
  export let form: ActionData;
  
  $: user = data.user;
  $: userScores = data.userScores || [];
  $: userStats = data.userStats || {};
  
  let showChangePasswordForm = false;
  let isSubmitting = false;
  
  // Form state
  let currentPassword = '';
  let newPassword = '';
  let confirmPassword = '';
  
  // Clear form and close modal
  function resetPasswordForm() {
    currentPassword = '';
    newPassword = '';
    confirmPassword = '';
    showChangePasswordForm = false;
  }
  
  // Handle form submission
  function handlePasswordSubmit() {
    isSubmitting = true;
    return async ({ result, update }: any) => {
      await update();
      isSubmitting = false;
      if (result.type === 'success') {
        resetPasswordForm();
      }
    };
  }
  
  // Format date for display
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  // Format datetime for display
  function formatDateTime(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  // Group scores by month
  function groupScoresByMonth(scores: any[]) {
    const groups: Record<string, any[]> = {};
    
    scores.forEach(score => {
      const date = new Date(score.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push({ ...score, monthName });
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, scores]) => ({ key, monthName: scores[0].monthName, scores }));
  }
  
  $: groupedScores = groupScoresByMonth(userScores);
</script>

<svelte:head>
  <title>Profilo - Fantakombat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="px-4 py-6 sm:px-0">
      <div class="text-center">
        <div class="flex justify-center mb-4">
          <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span class="text-3xl">
              {user.role === 'INSEGNANTE' ? '👨‍🏫' : '🥊'}
            </span>
          </div>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          {user.name}
        </h1>
        <p class="text-lg text-gray-600 mb-4">
          {user.email}
        </p>
        <span class="badge {user.role === 'INSEGNANTE' ? 'badge-blue' : 'badge-green'} text-lg px-4 py-2">
          {user.role === 'INSEGNANTE' ? 'Insegnante' : 'Iscritto'}
        </span>
      </div>
    </div>
    
    <!-- Stats -->
    <div class="px-4 py-6 sm:px-0">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card text-center">
          <div class="text-3xl mb-2">🏆</div>
          <div class="text-2xl font-bold text-gray-900">
            {userStats.totalPoints || 0}
          </div>
          <div class="text-sm text-gray-600">
            Punti Totali
          </div>
        </div>
        
        <div class="card text-center">
          <div class="text-3xl mb-2">📊</div>
          <div class="text-2xl font-bold text-gray-900">
            {userStats.position || 'N/A'}
          </div>
          <div class="text-sm text-gray-600">
            Posizione
          </div>
        </div>
        
        <div class="card text-center">
          <div class="text-3xl mb-2">⚡</div>
          <div class="text-2xl font-bold text-gray-900">
            {userScores.length}
          </div>
          <div class="text-sm text-gray-600">
            Attività Totali
          </div>
        </div>
      </div>
    </div>
    
    <!-- Score History -->
    <div class="px-4 py-6 sm:px-0">
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">
            📈 Storico Punteggi
          </h2>
        </div>
        
        {#if groupedScores.length > 0}
          <div class="space-y-8">
            {#each groupedScores as group}
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span class="mr-2">📅</span>
                  {group.monthName}
                </h3>
                
                <div class="space-y-3">
                  {#each group.scores as score}
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div class="flex items-center space-x-3">
                        <div class="flex-shrink-0">
                          <span class="text-lg">
                            {score.action.type === 'BONUS' ? '🟢' : '🔴'}
                          </span>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900">
                            {score.action.name}
                          </p>
                          <p class="text-xs text-gray-600">
                            {formatDate(score.lesson.date)} - {score.lesson.title || 'Lezione'}
                          </p>
                          {#if score.notes}
                            <p class="text-xs text-gray-500 mt-1">
                              Note: {score.notes}
                            </p>
                          {/if}
                        </div>
                      </div>
                      
                      <div class="text-right">
                        <p class="text-sm font-medium {score.points > 0 ? 'text-green-600' : 'text-red-600'}">
                          {score.points > 0 ? '+' : ''}{score.points}
                        </p>
                        <p class="text-xs text-gray-500">
                          {formatDateTime(score.createdAt)}
                        </p>
                      </div>
                    </div>
                  {/each}
                </div>
                
                <!-- Month summary -->
                <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-blue-900">
                      Totale {group.monthName}
                    </span>
                    <span class="text-sm font-bold text-blue-900">
                      {group.scores.reduce((sum: number, score: any) => sum + score.points, 0)} punti
                    </span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-12">
            <div class="text-6xl mb-4">📊</div>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Nessun punteggio ancora
            </h3>
            <p class="text-gray-600">
              Inizia a partecipare alle lezioni per vedere il tuo storico!
            </p>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Change Password Section (only for teachers) -->
    {#if user.role === 'INSEGNANTE'}
      <div class="px-4 py-6 sm:px-0">
        <div class="max-w-2xl mx-auto">
          {#if !showChangePasswordForm}
            <div class="text-center">
              <button 
                type="button"
                class="btn btn-secondary inline-flex items-center space-x-2 px-6 py-3"
                on:click={() => showChangePasswordForm = true}
              >
                <span>🔐</span>
                <span>Cambia Password</span>
              </button>
            </div>
          {:else}
            <div class="card">
              <div class="card-header">
                <h3 class="text-lg font-medium text-gray-900">Cambia Password</h3>
              </div>
            <div class="card-body">
              {#if form?.success}
                <div class="alert alert-success mb-4">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span>{form.message}</span>
                </div>
              {:else if form?.error}
                <div class="alert alert-error mb-4">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>{form.error}</span>
                </div>
              {/if}
              
              <form method="POST" action="?/changePassword" use:enhance={handlePasswordSubmit}>
                <div class="space-y-4">
                  <div>
                    <label for="currentPassword" class="block text-sm font-medium text-gray-700">
                      Password Attuale *
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      bind:value={currentPassword}
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div>
                    <label for="newPassword" class="block text-sm font-medium text-gray-700">
                      Nuova Password *
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      bind:value={newPassword}
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                      minlength="6"
                      disabled={isSubmitting}
                    />
                    <p class="mt-1 text-sm text-gray-500">
                      La password deve avere almeno 6 caratteri
                    </p>
                  </div>
                  
                  <div>
                    <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                      Conferma Nuova Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      bind:value={confirmPassword}
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                      minlength="6"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                <div class="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    on:click={resetPasswordForm}
                    disabled={isSubmitting}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Aggiornamento...' : 'Cambia Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        {/if}
      </div>
    </div>
    {/if}
    
    <!-- Action Buttons -->
    <div class="px-4 py-6 sm:px-0">
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a 
          href="/dashboard" 
          class="btn btn-outline inline-flex items-center space-x-2 px-6 py-3"
        >
          <span>🏠</span>
          <span>Torna alla Dashboard</span>
        </a>
        
        <a 
          href="/leaderboard" 
          class="btn btn-primary inline-flex items-center space-x-2 px-6 py-3"
        >
          <span>🏆</span>
          <span>Vedi Classifica</span>
        </a>
      </div>
    </div>
  </div>
</div>

<style>
  .card {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }
  
  .card-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .card-body {
    padding: 1.5rem;
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border: 1px solid transparent;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.375rem;
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
  }
  
  .btn:focus {
    outline: 2px solid;
    outline-offset: 2px;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background-color: #4f46e5;
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background-color: #4338ca;
  }
  
  .btn-primary:focus {
    outline-color: #6366f1;
  }
  
  .btn-secondary {
    background-color: white;
    color: #374151;
    border-color: #d1d5db;
  }
  
  .btn-secondary:hover:not(:disabled) {
    background-color: #f9fafb;
  }
  
  .btn-secondary:focus {
    outline-color: #6366f1;
  }
  
  .btn-outline {
    background-color: transparent;
    color: #4f46e5;
    border-color: #4f46e5;
  }
  
  .btn-outline:hover:not(:disabled) {
    background-color: #4f46e5;
    color: white;
  }
  
  .btn-outline:focus {
    outline-color: #6366f1;
  }
  
  .alert {
    display: flex;
    align-items: center;
    padding: 1rem;
    border-radius: 0.5rem;
    gap: 0.5rem;
  }
  
  .alert-success {
    background-color: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }
  
  .alert-error {
    background-color: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.75rem;
  }
  
  .badge-blue {
    background-color: #dbeafe;
    color: #1e40af;
  }
  
  .badge-green {
    background-color: #dcfce7;
    color: #166534;
  }
</style>
