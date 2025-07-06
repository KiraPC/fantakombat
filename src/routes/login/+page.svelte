<!-- Login page for Fantakombat -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { _, isLoading } from 'svelte-i18n';
  import type { SubmitFunction } from '@sveltejs/kit';
  
  export let form: any;
  
  let loading = false;
  let email = '';
  let password = '';
  let loginMode: 'choose' | 'teacher' | 'student' = 'choose';
  
  const handleSubmit: SubmitFunction = () => {
    loading = true;
    return async ({ update }) => {
      await update();
      loading = false;
    };
  };
  
  function resetForm() {
    email = '';
    password = '';
    loginMode = 'choose';
  }
  
  // Safe translate function that provides fallbacks
  function t(key: string, fallback: string): string {
    if ($isLoading) return fallback;
    return $_(key, { default: fallback });
  }
</script>

<svelte:head>
  <title>{t('auth.login', 'Accedi')} - {t('app.title', 'FantaKombat')}</title>
</svelte:head>

<!-- Show loading state while translations are loading -->
{#if $isLoading}
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      <p class="mt-4 text-gray-600">Caricamento...</p>
    </div>
  </div>
{:else}
<div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <div class="flex justify-center mb-6">
        <div class="bg-white rounded-full p-4 shadow-lg">
          <span class="text-4xl">🥊</span>
        </div>
      </div>
      <h2 class="text-3xl font-bold text-gray-900">
        {t('auth.loginTitle', 'Accedi a FantaKombat')}
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        {#if loginMode === 'choose'}
          {t('auth.chooseAccessType', 'Scegli il tipo di accesso')}
        {:else if loginMode === 'teacher'}
          {t('auth.teacherAccess', 'Accesso Insegnante')}
        {:else}
          {t('auth.studentAccess', 'Accesso Studente')}
        {/if}
      </p>
    </div>

    <!-- Error Message -->
    {#if form?.error}
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <span class="text-red-400 text-xl">❌</span>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-800">{form.error}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Login Mode Selection -->
    {#if loginMode === 'choose'}
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4">
          <button
            on:click={() => loginMode = 'teacher'}
            class="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <span class="text-xl">👨‍🏫</span>
            </span>
            {t('auth.imTeacher', 'Sono un Insegnante')}
          </button>
          
          <button
            on:click={() => loginMode = 'student'}
            class="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition-colors duration-200"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <span class="text-xl">👨‍🎓</span>
            </span>
            {t('auth.imStudent', 'Sono uno Studente')}
          </button>
        </div>
      </div>
    {/if}

    <!-- Teacher Login Form -->
    {#if loginMode === 'teacher'}
      <form 
        class="mt-8 space-y-6" 
        method="post" 
        action="?/teacherLogin"
        use:enhance={handleSubmit}
      >
        <div class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              {t('forms.email', 'Email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              bind:value={email}
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder={t('forms.placeholders.email', 'La tua email')}
            />
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              {t('forms.password', 'Password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              bind:value={password}
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder={t('forms.placeholders.password', 'La tua password')}
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <button
            type="button"
            on:click={resetForm}
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            ← {t('messages.goBack', 'Indietro')}
          </button>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <span class="text-primary-500 group-hover:text-primary-400">
                {loading ? '⏳' : '🔐'}
              </span>
            </span>
            {loading ? t('auth.loginInProgress', 'Accesso in corso...') : t('auth.loginAsTeacher', 'Accedi come Insegnante')}
          </button>
        </div>
      </form>
    {/if}

    <!-- Student Login Form -->
    {#if loginMode === 'student'}
      <form 
        class="mt-8 space-y-6" 
        method="post" 
        action="?/studentLogin"
        use:enhance={handleSubmit}
      >
        <div class="space-y-4">
          <!-- Email Field -->
          <div>
            <label for="student-email" class="block text-sm font-medium text-gray-700">
              {t('forms.email', 'Email')}
            </label>
            <input
              id="student-email"
              name="email"
              type="email"
              autocomplete="email"
              required
              bind:value={email}
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-secondary-500 focus:border-secondary-500 focus:z-10 sm:text-sm"
              placeholder={t('forms.placeholders.email', 'La tua email')}
            />
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <span class="text-blue-400 text-xl">ℹ️</span>
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-800">
                {t('messages.studentLoginInfo', 'Gli studenti accedono utilizzando solo la loro email. Non è necessaria una password.')}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <button
            type="button"
            on:click={resetForm}
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            ← {t('messages.goBack', 'Indietro')}
          </button>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <span class="text-secondary-500 group-hover:text-secondary-400">
                {loading ? '⏳' : '🎯'}
              </span>
            </span>
            {loading ? t('auth.loginInProgress', 'Accesso in corso...') : t('auth.loginAsStudent', 'Accedi come Studente')}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>
{/if}