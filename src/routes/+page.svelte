<!-- Home page for Fantakombat -->
<script lang="ts">
  export let data;
  
  $: user = data?.user;
  $: isLoggedIn = !!user;
</script>

<svelte:head>
  <title>Fantakombat - Fit&Box Game</title>
  <meta name="description" content="Fantakombat - Il gioco a punti per il corso di fit&box" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Hero Section -->
    <div class="text-center">
      <div class="flex justify-center mb-8">
        <div class="bg-white rounded-full p-6 shadow-lg">
          <span class="text-6xl">🥊</span>
        </div>
      </div>
      
      <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
        Fantakombat
      </h1>
      
      <p class="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
        Il gioco a punti per il corso di <strong>fit&box</strong>.
        Guadagna punti, scala la classifica e diventa il campione!
      </p>
      
      {#if isLoggedIn}
        <!-- Logged in user - show dashboard link -->
        <div class="space-y-4">
          <p class="text-lg text-gray-700">
            Bentornato, <strong>{user?.name}</strong>!
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/dashboard" 
              class="btn btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
            >
              <span>🏠</span>
              <span>Vai alla Dashboard</span>
            </a>
            <a 
              href="/leaderboard" 
              class="btn btn-secondary text-lg px-8 py-3 inline-flex items-center space-x-2"
            >
              <span>🏆</span>
              <span>Vedi Classifica</span>
            </a>
          </div>
        </div>
      {:else}
        <!-- Not logged in - show login/register buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/login" 
            class="btn btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
          >
            <span>🔐</span>
            <span>Accedi</span>
          </a>
          <a 
            href="/register" 
            class="btn btn-outline text-lg px-8 py-3 inline-flex items-center space-x-2"
          >
            <span>✨</span>
            <span>Registrati</span>
          </a>
        </div>
      {/if}
    </div>
    
    <!-- Features Section -->
    <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="card text-center">
        <div class="text-4xl mb-4">🏆</div>
        <h3 class="text-xl font-semibold mb-2">Classifica</h3>
        <p class="text-gray-600">
          Compete con gli altri iscritti e scala la classifica guadagnando punti in ogni lezione.
        </p>
      </div>
      
      <div class="card text-center">
        <div class="text-4xl mb-4">⚡</div>
        <h3 class="text-xl font-semibold mb-2">Azioni</h3>
        <p class="text-gray-600">
          Guadagna punti bonus o ricevi malus in base alle tue performance durante le lezioni.
        </p>
      </div>
      
      <div class="card text-center">
        <div class="text-4xl mb-4">📊</div>
        <h3 class="text-xl font-semibold mb-2">Storico</h3>
        <p class="text-gray-600">
          Tieni traccia dei tuoi progressi e consulta lo storico dei tuoi punteggi.
        </p>
      </div>
    </div>
    
    <!-- About Section -->
    <div class="mt-20 card">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-6">Come funziona?</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div>
            <h3 class="text-xl font-semibold mb-3 flex items-center">
              <span class="text-2xl mr-2">👨‍🏫</span>
              Per gli Insegnanti
            </h3>
            <ul class="space-y-2 text-gray-600">
              <li>• Crea azioni positive (bonus) e negative (malus)</li>
              <li>• Gestisci gli utenti iscritti</li>
              <li>• Assegna punti durante le lezioni</li>
              <li>• Monitora i progressi di tutti</li>
            </ul>
          </div>
          
          <div>
            <h3 class="text-xl font-semibold mb-3 flex items-center">
              <span class="text-2xl mr-2">🥊</span>
              Per gli Iscritti
            </h3>
            <ul class="space-y-2 text-gray-600">
              <li>• Visualizza la classifica generale</li>
              <li>• Consulta il tuo storico personale</li>
              <li>• Tieni traccia dei tuoi progressi</li>
              <li>• Compete con gli altri iscritti</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
