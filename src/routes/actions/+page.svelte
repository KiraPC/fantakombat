<!-- Actions management page for teachers -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  
  export let data;
  export let form;
  
  let showCreateForm = false;
  let editingAction: any = null;
  let deleteConfirmId: string | null = null;
  
  // Form fields
  let name = '';
  let points = 0;
  let type = 'BONUS';
  
  // Reset form
  function resetForm() {
    name = '';
    points = 0;
    type = 'BONUS';
    editingAction = null;
    showCreateForm = false;
  }
  
  // Handle edit action
  function handleEdit(action: any) {
    editingAction = action;
    name = action.name;
    points = Math.abs(action.points);
    type = action.type;
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
  <title>Gestisci Azioni - Fantakombat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="px-4 py-6 sm:px-0">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            ⚡ Gestisci Azioni
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            Crea e gestisci le azioni (bonus e malus) per i tuoi iscritti
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            on:click={() => { showCreateForm = true; }}
            class="btn btn-primary"
          >
            <span class="text-lg mr-2">+</span>
            Nuova Azione
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
            {editingAction ? 'Modifica Azione' : 'Nuova Azione'}
          </h2>
          
          <form 
            method="POST" 
            action="?/{editingAction ? 'update' : 'create'}"
            use:enhance={handleSubmitResult}
          >
            {#if editingAction}
              <input type="hidden" name="id" value={editingAction.id} />
            {/if}
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">
                  Nome Azione
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  bind:value={name}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="es. Presenza in orario"
                />
              </div>
              
              <div>
                <label for="type" class="block text-sm font-medium text-gray-700">
                  Tipo
                </label>
                <select
                  id="type"
                  name="type"
                  bind:value={type}
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="BONUS">🟢 Bonus</option>
                  <option value="MALUS">🔴 Malus</option>
                </select>
              </div>
              
              <div>
                <label for="points" class="block text-sm font-medium text-gray-700">
                  Punti
                </label>
                <input
                  id="points"
                  name="points"
                  type="number"
                  bind:value={points}
                  min="1"
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="es. 10"
                />
                <p class="mt-1 text-xs text-gray-500">
                  {type === 'MALUS' ? 'I punti saranno automaticamente negativi' : 'I punti saranno positivi'}
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
                {editingAction ? 'Aggiorna' : 'Crea'} Azione
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
    
    <!-- Actions List -->
    <div class="px-4 sm:px-0">
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          Elenco Azioni ({data.actions.length})
        </h2>
        
        {#if data.actions.length === 0}
          <div class="text-center py-12">
            <span class="text-6xl mb-4 block">⚡</span>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              Nessuna azione trovata
            </h3>
            <p class="text-gray-600 mb-4">
              Crea la tua prima azione per iniziare ad assegnare punti
            </p>
            <button
              on:click={() => { showCreateForm = true; }}
              class="btn btn-primary"
            >
              <span class="text-lg mr-2">+</span>
              Crea Prima Azione
            </button>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punti
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Creazione
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each data.actions as action}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">
                        {action.name}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {action.type === 'BONUS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        {action.type === 'BONUS' ? '🟢' : '🔴'} {action.type}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900 font-medium">
                        {action.points > 0 ? '+' : ''}{action.points}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(action.createdAt)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex justify-end space-x-2">
                        <button
                          on:click={() => handleEdit(action)}
                          class="text-primary-600 hover:text-primary-900"
                        >
                          ✏️ Modifica
                        </button>
                        <button
                          on:click={() => deleteConfirmId = action.id}
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
            Sei sicuro di voler eliminare questa azione? Questa operazione non può essere annullata.
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
