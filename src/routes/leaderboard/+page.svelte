<!-- Leaderboard page for Fantakombat -->
<script lang="ts">
  export let data;
  
  $: user = data.user;
  $: leaderboard = data.leaderboard || [];
  $: userPosition = data.userPosition;
  
  // Get medal emoji based on position
  function getMedal(position: number) {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  }
  
  // Get position color
  function getPositionColor(position: number) {
    switch (position) {
      case 1:
        return 'text-yellow-600';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  }
</script>

<svelte:head>
  <title>Classifica - Fantakombat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="px-4 py-6 sm:px-0">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          🏆 Classifica Fantakombat
        </h1>
        <p class="text-lg text-gray-600 mb-8">
          Vedi chi sta dominando nel mondo del fit&box!
        </p>
        
        {#if userPosition && user?.role === 'ISCRITTO'}
          <div class="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full">
            <span class="text-lg">🎯</span>
            <span class="font-medium">
              Sei al {userPosition}° posto
            </span>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Leaderboard -->
    <div class="px-4 py-6 sm:px-0">
      <div class="card">
        {#if leaderboard.length > 0}
          <div class="space-y-4">
            {#each leaderboard as entry, index}
              {@const position = index + 1}
              {@const isCurrentUser = entry.user.id === user?.id}
              
              <div class="flex items-center justify-between p-4 rounded-lg transition-colors {isCurrentUser ? 'bg-primary-50 ring-2 ring-primary-200' : 'bg-gray-50 hover:bg-gray-100'}">
                <div class="flex items-center space-x-4">
                  <!-- Position -->
                  <div class="flex-shrink-0">
                    <div class="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                      <span class="text-lg font-bold {getPositionColor(position)}">
                        {position <= 3 ? getMedal(position) : position}
                      </span>
                    </div>
                  </div>
                  
                  <!-- User Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                      <p class="text-lg font-medium text-gray-900 truncate">
                        {entry.user.name}
                      </p>
                      {#if isCurrentUser}
                        <span class="badge badge-blue text-xs">Tu</span>
                      {/if}
                    </div>
                    <p class="text-sm text-gray-600 truncate">
                      {entry.user.email}
                    </p>
                  </div>
                </div>
                
                <!-- Points -->
                <div class="text-right">
                  <p class="text-2xl font-bold text-gray-900">
                    {entry.totalPoints}
                  </p>
                  <p class="text-sm text-gray-600">
                    punti
                  </p>
                </div>
              </div>
            {/each}
          </div>
          
          <!-- Stats -->
          <div class="mt-8 pt-6 border-t border-gray-200">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900">
                  {leaderboard.length}
                </p>
                <p class="text-sm text-gray-600">
                  Partecipanti totali
                </p>
              </div>
              
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900">
                  {leaderboard[0]?.totalPoints || 0}
                </p>
                <p class="text-sm text-gray-600">
                  Punteggio massimo
                </p>
              </div>
              
              <div class="text-center">
                <p class="text-2xl font-bold text-gray-900">
                  {Math.round(leaderboard.reduce((sum: number, entry: any) => sum + entry.totalPoints, 0) / leaderboard.length) || 0}
                </p>
                <p class="text-sm text-gray-600">
                  Punteggio medio
                </p>
              </div>
            </div>
          </div>
        {:else}
          <div class="text-center py-12">
            <div class="text-6xl mb-4">🏆</div>
            <h3 class="text-xl font-medium text-gray-900 mb-2">
              Nessun dato disponibile
            </h3>
            <p class="text-gray-600">
              Inizia a partecipare alle lezioni per vedere la classifica!
            </p>
          </div>
        {/if}
      </div>
    </div>
    
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
        
        {#if user?.role === 'ISCRITTO'}
          <a 
            href="/profile" 
            class="btn btn-primary inline-flex items-center space-x-2 px-6 py-3"
          >
            <span>👤</span>
            <span>Vedi il tuo Profilo</span>
          </a>
        {/if}
      </div>
    </div>
  </div>
</div>
