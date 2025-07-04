<!-- Login page for Fantakombat -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  
  export let form: any;
  
  let loading = false;
  let email = '';
  let password = '';
  
  const handleSubmit: SubmitFunction = () => {
    loading = true;
    return async ({ update }) => {
      await update();
      loading = false;
    };
  };
</script>

<svelte:head>
  <title>Accedi - Fantakombat</title>
</svelte:head>

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
        Accedi a Fantakombat
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        Entra nel gioco e inizia a guadagnare punti!
      </p>
    </div>
    
    <!-- Login Form -->
    <form 
      class="mt-8 space-y-6" 
      method="post" 
      action="?/login"
      use:enhance={handleSubmit}
    >
      <div class="space-y-4">
        <!-- Email Field -->
        <div>
          <label for="email" class="form-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            bind:value={email}
            class="form-input"
            placeholder="La tua email"
          />
        </div>
        
        <!-- Password Field -->
        <div>
          <label for="password" class="form-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            bind:value={password}
            class="form-input"
            placeholder="La tua password"
          />
        </div>
      </div>
      
      <!-- Error Message -->
      {#if form?.error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <span class="text-red-400 text-xl">⚠️</span>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700">{form.error}</p>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Submit Button -->
      <div>
        <button
          type="submit"
          disabled={loading}
          class="w-full btn btn-primary flex justify-center py-3 px-4 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if loading}
            <div class="spinner h-5 w-5 mr-2"></div>
            Accedendo...
          {:else}
            <span class="mr-2">🔐</span>
            Accedi
          {/if}
        </button>
      </div>
      
      <!-- Register Link -->
      <div class="text-center">
        <p class="text-sm text-gray-600">
          Non hai un account?
          <a href="/register" class="font-medium text-primary-600 hover:text-primary-500">
            Registrati qui
          </a>
        </p>
      </div>
    </form>
  </div>
</div>
