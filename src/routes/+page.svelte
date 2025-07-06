<!-- Home page for Fantakombat -->
<script lang="ts">
  import { _, isLoading } from 'svelte-i18n';
  
  export let data;
  
  $: user = data?.user;
  $: isLoggedIn = !!user;
  
  // Safe translate function that provides fallbacks
  function t(key: string, fallback: string): string {
    if ($isLoading) return fallback;
    return $_(key, { default: fallback });
  }
</script>

<svelte:head>
  <title>{t('app.title', 'FantaKombat')} - {t('app.subtitle', 'Fit&Box Game')}</title>
  <meta name="description" content={t('app.description', 'Una piattaforma di gamification per le lezioni di Fit&Box')} />
</svelte:head>

{#if $isLoading}
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      <p class="mt-4 text-gray-600">Caricamento...</p>
    </div>
  </div>
{:else}
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
        {t('app.title', 'FantaKombat')}
      </h1>
      
      <p class="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
        {t('app.description', 'Una piattaforma di gamification per le lezioni di Fit&Box')}.
        {t('app.tagline', 'Rendi le tue lezioni di Fit&Box coinvolgenti e divertenti attraverso il gioco!')}
      </p>
      
      {#if isLoggedIn}
        <!-- Logged in user - show dashboard link -->
        <div class="space-y-4">
          <p class="text-lg text-gray-700">
            {t('greetings.welcomeUser', `Benvenuto, ${user?.name}!`)}
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/dashboard" 
              class="btn btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
            >
              <span>🏠</span>
              <span>{t('dashboard.goToDashboard', 'Vai alla Dashboard')}</span>
            </a>
            <a 
              href="/leaderboard" 
              class="btn btn-secondary text-lg px-8 py-3 inline-flex items-center space-x-2"
            >
              <span>🏆</span>
              <span>{t('leaderboard.viewLeaderboard', 'Visualizza Classifica')}</span>
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
            <span>{t('auth.login', 'Accedi')}</span>
          </a>
        </div>
      {/if}
    </div>
    
    <!-- Features Section -->
    <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="card text-center">
        <div class="text-4xl mb-4">🏆</div>
        <h3 class="text-xl font-semibold mb-2">{t('navigation.leaderboard', 'Classifica')}</h3>
        <p class="text-gray-600">
          {t('common.featuresDescriptions.leaderboard', 'Visualizza le classifiche dei giocatori e sfida i tuoi amici!')}
        </p>
      </div>
      
      <div class="card text-center">
        <div class="text-4xl mb-4">⚡</div>
        <h3 class="text-xl font-semibold mb-2">{t('navigation.actions', 'Azioni')}</h3>
        <p class="text-gray-600">
          {t('common.featuresDescriptions.actions', 'Esegui azioni durante le lezioni e guadagna punti!')}
        </p>
      </div>
      
      <div class="card text-center">
        <div class="text-4xl mb-4">📊</div>
        <h3 class="text-xl font-semibold mb-2">{t('stats.scoreHistory', 'Storico Punteggi')}</h3>
        <p class="text-gray-600">
          {t('common.featuresDescriptions.history', 'Visualizza il tuo storico punteggi e progressi nel tempo!')}
        </p>
      </div>
    </div>
    
    <!-- About Section -->
    <div class="mt-20 card">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 mb-6">{t('common.howItWorks', 'Come Funziona')}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div>
            <h3 class="text-xl font-semibold mb-3 flex items-center">
              <span class="text-2xl mr-2">👨‍🏫</span>
              {t('common.forTeachers', 'Per gli Insegnanti')}
            </h3>
            <ul class="space-y-2 text-gray-600">
              <li>• {t('common.teacherFeatures.createActions', 'Crea azioni personalizzate')}</li>
              <li>• {t('common.teacherFeatures.manageUsers', 'Gestisci utenti e lezioni')}</li>
              <li>• {t('common.teacherFeatures.assignPoints', 'Assegna punti e feedback')}</li>
              <li>• {t('common.teacherFeatures.monitorProgress', 'Monitora i progressi degli studenti')}</li>
            </ul>
          </div>
          
          <div>
            <h3 class="text-xl font-semibold mb-3 flex items-center">
              <span class="text-2xl mr-2">🥊</span>
              {t('common.forStudents', 'Per gli Studenti')}
            </h3>
            <ul class="space-y-2 text-gray-600">
              <li>• {t('common.studentFeatures.viewLeaderboard', 'Visualizza classifica e sfide')}</li>
              <li>• {t('common.studentFeatures.viewHistory', 'Visualizza storico punteggi')}</li>
              <li>• {t('common.studentFeatures.trackProgress', 'Monitora i tuoi progressi')}</li>
              <li>• {t('common.studentFeatures.competeWithOthers', 'Compete con altri studenti')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
{/if}