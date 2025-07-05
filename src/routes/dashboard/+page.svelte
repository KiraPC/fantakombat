<!-- Dashboard page for Fantakombat -->
<script lang="ts">
  export let data;
  
  $: user = data.user;
  $: isTeacher = user?.role === 'INSEGNANTE';
  $: leaderboard = data.leaderboard || [];
  $: recentActivity = data.recentActivity || [];
  $: userStats = data.userStats || {};
  
  // Format date for display
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
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
</script>

<svelte:head>
  <title>Dashboard - Fantakombat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="px-4 py-6 sm:px-0">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            Bentornato, {user.name}! 👋
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            Ecco un riepilogo delle tue attività recenti
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <span class="badge {isTeacher ? 'badge-blue' : 'badge-green'} text-lg px-4 py-2">
            {isTeacher ? '👨‍🏫 Insegnante' : '🥊 Iscritto'}
          </span>
        </div>
      </div>
    </div>
    
    <!-- Stats Overview -->
    <div class="px-4 py-6 sm:px-0">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- User's Total Points -->
        <div class="card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span class="text-primary-600 font-bold">🏆</span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  {isTeacher ? 'Punti Totali Assegnati' : 'I Tuoi Punti'}
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {(userStats.totalPoints || 0).toFixed(1).replace('.0', '')}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        <!-- Position in Leaderboard -->
        {#if !isTeacher}
          <div class="card">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                  <span class="text-secondary-600 font-bold">📊</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">
                    Posizione in Classifica
                  </dt>
                  <dd class="text-lg font-medium text-gray-900">
                    #{userStats.position || 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        {/if}
        
        <!-- Recent Activity Count -->
        <div class="card">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span class="text-green-600 font-bold">⚡</span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  Attività Recenti
                </dt>
                <dd class="text-lg font-medium text-gray-900">
                  {recentActivity.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="px-4 py-6 sm:px-0">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Leaderboard Preview -->
        <div class="card">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">
              🏆 Classifica
            </h2>
            <a 
              href="/leaderboard" 
              class="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              Vedi tutto →
            </a>
          </div>
          
          {#if leaderboard.length > 0}
            <div class="space-y-4">
              {#each leaderboard.slice(0, 5) as entry, index}
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                      <span class="text-lg font-bold text-gray-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {entry.user.name}
                      </p>
                      {#if entry.user.id === user.id}
                        <p class="text-xs text-primary-600">Tu</p>
                      {/if}
                    </div>
                  </div>
                  <div class="text-sm font-medium text-gray-900">
                    {entry.totalPoints.toFixed(1).replace('.0', '')} punti
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-8 text-gray-500">
              <span class="text-4xl mb-2 block">🏆</span>
              <p>Nessun dato disponibile</p>
            </div>
          {/if}
        </div>
        
        <!-- Recent Activity -->
        <div class="card">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">
              ⚡ Attività Recenti
            </h2>
            {#if isTeacher}
              <a 
                href="/lessons" 
                class="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                Gestisci lezioni →
              </a>
            {/if}
          </div>
          
          {#if recentActivity.length > 0}
            <div class="space-y-4">
              {#each recentActivity.slice(0, 5) as activity}
                <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div class="flex-shrink-0">
                    <span class="text-lg">
                      {activity.action.type === 'BONUS' ? '🟢' : '🔴'}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900">
                      {activity.user.name}
                    </p>
                    <p class="text-sm text-gray-600">
                      {activity.action.name}
                      <span class="font-medium">
                        {activity.points > 0 ? '+' : ''}{activity.points} punti
                      </span>
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-8 text-gray-500">
              <span class="text-4xl mb-2 block">⚡</span>
              <p>Nessuna attività recente</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="px-4 py-6 sm:px-0">
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          🚀 Azioni Rapide
        </h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a 
            href="/leaderboard" 
            class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span class="text-2xl">🏆</span>
            <div>
              <p class="text-sm font-medium text-gray-900">Classifica</p>
              <p class="text-xs text-gray-600">Vedi posizioni</p>
            </div>
          </a>
          
          <a 
            href="/profile" 
            class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span class="text-2xl">👤</span>
            <div>
              <p class="text-sm font-medium text-gray-900">Profilo</p>
              <p class="text-xs text-gray-600">Gestisci account</p>
            </div>
          </a>
          
          {#if isTeacher}
            <a 
              href="/actions" 
              class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span class="text-2xl">⚡</span>
              <div>
                <p class="text-sm font-medium text-gray-900">Azioni</p>
                <p class="text-xs text-gray-600">Gestisci bonus/malus</p>
              </div>
            </a>
            
            <a 
              href="/lessons" 
              class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span class="text-2xl">📚</span>
              <div>
                <p class="text-sm font-medium text-gray-900">Lezioni</p>
                <p class="text-xs text-gray-600">Gestisci lezioni</p>
              </div>
            </a>
            
            <a 
              href="/users" 
              class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span class="text-2xl">👥</span>
              <div>
                <p class="text-sm font-medium text-gray-900">Utenti</p>
                <p class="text-xs text-gray-600">Gestisci iscritti</p>
              </div>
            </a>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
