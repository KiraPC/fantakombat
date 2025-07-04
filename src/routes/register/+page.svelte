<!-- Register page for Fantakombat -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  
  export let form: any;
  
  let loading = false;
  let email = '';
  let password = '';
  let confirmPassword = '';
  let name = '';
  let role = 'ISCRITTO';
  let courseName = '';
  
  const handleSubmit: SubmitFunction = () => {
    loading = true;
    return async ({ update }) => {
      await update();
      loading = false;
    };
  };
</script>

<svelte:head>
  <title>Registrati - Fantakombat</title>
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
        Unisciti a Fantakombat
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        Crea il tuo account e inizia a competere!
      </p>
    </div>
    
    <!-- Register Form -->
    <form 
      class="mt-8 space-y-6" 
      method="post" 
      action="?/register"
      use:enhance={handleSubmit}
    >
      <div class="space-y-4">
        <!-- Name Field -->
        <div>
          <label for="name" class="form-label">
            Nome completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            bind:value={name}
            class="form-input"
            placeholder="Il tuo nome completo"
          />
        </div>
        
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
        
        <!-- Role Selection -->
        <div>
          <label for="role" class="form-label">
            Ruolo
          </label>
          <select
            id="role"
            name="role"
            bind:value={role}
            class="form-input"
          >
            <option value="ISCRITTO">Studente</option>
            <option value="INSEGNANTE">Insegnante</option>
          </select>
        </div>
        
        <!-- Password Fields (only for teachers) -->
        {#if role === 'INSEGNANTE'}
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
              placeholder="Scegli una password"
            />
          </div>
          
          <div>
            <label for="confirmPassword" class="form-label">
              Conferma password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              bind:value={confirmPassword}
              class="form-input"
              placeholder="Ripeti la password"
            />
          </div>
        {/if}
        
        <!-- Course Name Field (only for teachers) -->
        {#if role === 'INSEGNANTE'}
          <div>
            <label for="courseName" class="form-label">
              Nome del corso
            </label>
            <input
              id="courseName"
              name="courseName"
              type="text"
              required
              bind:value={courseName}
              class="form-input"
              placeholder="es. Fit&Box, Boxe per principianti, ecc."
            />
            <p class="mt-1 text-sm text-gray-500">
              Inserisci il nome del corso che vuoi creare
            </p>
          </div>
        {/if}
        
        <!-- Info message for students -->
        {#if role === 'ISCRITTO'}
          <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <span class="text-blue-400 text-xl">ℹ️</span>
              </div>
              <div class="ml-3">
                <p class="text-sm text-blue-800">
                  Come studente non hai bisogno di una password! Potrai accedere con la sola email per vedere i tuoi punteggi e la classifica.
                </p>
              </div>
            </div>
          </div>
        {/if}
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
      
      <!-- Success Message -->
      {#if form?.success}
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <span class="text-green-400 text-xl">✅</span>
            </div>
            <div class="ml-3">
              <p class="text-sm text-green-700">{form.success}</p>
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
            Registrando...
          {:else}
            <span class="mr-2">✨</span>
            Registrati
          {/if}
        </button>
      </div>
      
      <!-- Login Link -->
      <div class="text-center">
        <p class="text-sm text-gray-600">
          Hai già un account?
          <a href="/login" class="font-medium text-primary-600 hover:text-primary-500">
            Accedi qui
          </a>
        </p>
      </div>
    </form>
  </div>
</div>
