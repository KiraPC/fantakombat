<!-- Users management page for teachers -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  
  export let data;
  export let form;
  
  let showCreateForm = false;
  let editingUser: any = null;
  let deleteConfirmId: string | null = null;
  
  // Form fields
  let name = '';
  let email = '';
  let password = '';
  
  // Reset form
  function resetForm() {
    name = '';
    email = '';
    password = '';
    editingUser = null;
    showCreateForm = false;
    deleteConfirmId = null;
  }
  
  // Handle edit user
  function handleEdit(user: any) {
    editingUser = user;
    name = user.name;
    email = user.email;
    password = ''; // Don't pre-fill password
    showCreateForm = true;
  }
  
  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Handle form submission result (both success and error)
  const handleSubmitResult = () => {
    return async ({ result, update }: any) => {
      // Update the form state with the result
      await update();
      
      // Always invalidate to ensure we have the latest data
      await invalidateAll();
      
      if (result.type === 'success') {
        resetForm();
      }
      
      // Log for debugging
      console.log('Form submission result:', result);
    };
  };
</script>

<svelte:head>
  <title>Gestisci Utenti - Fantakombat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="px-4 py-6 sm:px-0">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            👥 Gestisci Utenti
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            Crea e gestisci gli account degli iscritti
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            on:click={() => { showCreateForm = true; }}
            class="btn btn-primary"
          >
            <span class="text-lg mr-2">+</span>
            Nuovo Utente
          </button>
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
    
    <!-- Create/Edit Form -->
    {#if showCreateForm}
      <div class="px-4 sm:px-0 mb-8">
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">
            {editingUser ? 'Modifica Utente' : 'Nuovo Utente'}
          </h2>
          
          <form 
            method="POST" 
            action="?/{editingUser ? 'update' : 'create'}"
            use:enhance={handleSubmitResult}
          >
            {#if editingUser}
              <input type="hidden" name="id" value={editingUser.id} />
            {/if}
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  bind:value={name}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="es. Mario Rossi"
                />
              </div>
              
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  bind:value={email}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="es. mario.rossi@email.com"
                />
              </div>
              
              <div class="md:col-span-2">
                <label for="password" class="block text-sm font-medium text-gray-700">
                  Password {editingUser ? '(lascia vuoto per non modificare)' : ''}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  bind:value={password}
                  required={!editingUser}
                  minlength="6"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Almeno 6 caratteri"
                />
                <p class="mt-1 text-xs text-gray-500">
                  {editingUser ? 'La password deve essere di almeno 6 caratteri se specificata' : 'La password deve essere di almeno 6 caratteri'}
                </p>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                on:click={resetForm}
                class="btn btn-secondary"
              >
                Annulla
              </button>
              <button
                type="submit"
                class="btn btn-primary"
              >
                {editingUser ? 'Aggiorna' : 'Crea'} Utente
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
    
    <!-- Users List -->
    <div class="px-4 sm:px-0">
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          Elenco Utenti ({data.users.length})
        </h2>
        
        {#if data.users.length === 0}
          <div class="text-center py-12">
            <span class="text-6xl mb-4 block">👥</span>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              Nessun utente trovato
            </h3>
            <p class="text-gray-600 mb-4">
              Crea il primo account per i tuoi iscritti
            </p>
            <button
              on:click={() => { showCreateForm = true; }}
              class="btn btn-primary"
            >
              <span class="text-lg mr-2">+</span>
              Crea Primo Utente
            </button>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utente
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punti Totali
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punteggi
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrato
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each data.users as user}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span class="text-primary-600 font-medium text-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div class="text-sm text-gray-500">
                            🥊 Iscritto
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">
                        {user.totalPoints}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        {user.totalScores}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex justify-end space-x-2">
                        <button
                          on:click={() => handleEdit(user)}
                          class="text-primary-600 hover:text-primary-900"
                        >
                          ✏️ Modifica
                        </button>
                        <button
                          on:click={() => deleteConfirmId = user.id}
                          class="text-red-600 hover:text-red-900"
                        >
                          🗑️ Elimina
                        </button>
                      </div>
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

<!-- Delete Confirmation Modal -->
{#if deleteConfirmId}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3 text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <span class="text-red-600 text-2xl">🗑️</span>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mt-2">
          Conferma Eliminazione
        </h3>
        <div class="mt-2 px-7 py-3">
          <p class="text-sm text-gray-500">
            Sei sicuro di voler eliminare questo utente? Tutti i suoi dati saranno eliminati definitivamente. Questa operazione non può essere annullata.
          </p>
        </div>
        <div class="flex justify-center space-x-3 mt-4">
          <button
            on:click={() => deleteConfirmId = null}
            class="btn btn-secondary"
          >
            Annulla
          </button>
          <form 
            method="POST" 
            action="?/delete"
            use:enhance={handleSubmitResult}
            class="inline"
          >
            <input type="hidden" name="id" value={deleteConfirmId} />
            <button
              type="submit"
              class="btn bg-red-600 text-white hover:bg-red-700"
            >
              Elimina
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
{/if}
