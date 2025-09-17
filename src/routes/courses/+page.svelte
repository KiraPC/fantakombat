<!-- Courses management page for teachers -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { goto } from '$app/navigation';
  
  export let data;
  export let form;
  
  let showCreateForm = false;
  let editingCourse: any = null;
  let deleteConfirmId: string | null = null;
  
  // Form fields
  let name = '';
  let description = '';
  
  // Reset form
  function resetForm() {
    name = '';
    description = '';
    editingCourse = null;
    showCreateForm = false;
  }
  
  // Handle edit course
  function handleEdit(course: any) {
    editingCourse = course;
    name = course.name;
    description = course.description || '';
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
  
  // Handle form submission result
  const handleSubmitResult = () => {
    return async ({ result, update }: any) => {
      // Update the form state with the result
      await update();
      
      // Always invalidate to ensure we have the latest data
      await invalidateAll();
      
      if (result.type === 'success') {
        resetForm();
        deleteConfirmId = null;
      }
      
      // Log for debugging
      console.log('Form submission result:', result);
    };
  };
  
  // Navigate to course detail
  function viewCourseDetail(courseId: string) {
    goto(`/courses/${courseId}`);
  }
</script>

<svelte:head>
  <title>Gestisci Corsi - Fantakombat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="px-4 py-6 sm:px-0">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            🎓 Gestisci Corsi
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            Crea e gestisci i tuoi corsi di fit&box
          </p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button
            on:click={() => { showCreateForm = true; }}
            class="btn btn-primary"
          >
            <span class="text-lg mr-2">+</span>
            Nuovo Corso
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
            {editingCourse ? 'Modifica Corso' : 'Nuovo Corso'}
          </h2>
          
          <form 
            method="POST" 
            action="?/{editingCourse ? 'updateCourse' : 'createCourse'}"
            use:enhance={handleSubmitResult}
          >
            {#if editingCourse}
              <input type="hidden" name="id" value={editingCourse.id} />
            {/if}
            
            <div class="grid grid-cols-1 gap-6">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">
                  Nome Corso
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  bind:value={name}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="es. Corso Fit&Box Principianti"
                />
              </div>
              
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700">
                  Descrizione (opzionale)
                </label>
                <textarea
                  id="description"
                  name="description"
                  bind:value={description}
                  rows="3"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Descrizione del corso..."
                ></textarea>
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
                {editingCourse ? 'Aggiorna' : 'Crea'} Corso
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
    
    <!-- Courses List -->
    <div class="px-4 sm:px-0">
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          I Tuoi Corsi ({data.courses.length})
        </h2>
        
        {#if data.courses.length === 0}
          <div class="text-center py-12">
            <span class="text-6xl mb-4 block">🎓</span>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              Nessun corso trovato
            </h3>
            <p class="text-gray-600 mb-4">
              Crea il tuo primo corso per iniziare a gestire le lezioni
            </p>
            <button
              on:click={() => { showCreateForm = true; }}
              class="btn btn-primary"
            >
              <span class="text-lg mr-2">+</span>
              Crea Primo Corso
            </button>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#each data.courses as course}
              <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                      {course.name}
                    </h3>
                    {#if course.description}
                      <p class="text-sm text-gray-600 mb-4">
                        {course.description}
                      </p>
                    {/if}
                  </div>
                  <div class="ml-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {course.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                      {course.isActive ? '🟢 Attivo' : '⚪ Inattivo'}
                    </span>
                  </div>
                </div>
                
                <!-- Course Stats -->
                <div class="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div class="flex items-center">
                    <span class="mr-1">📚</span>
                    <span>{course.academicYearsCount} anni</span>
                  </div>
                </div>
                
                <!-- Academic Years Preview -->
                {#if course.academicYears.length > 0}
                  <div class="mb-4">
                    <h4 class="text-sm font-medium text-gray-700 mb-2">Anni Accademici:</h4>
                    <div class="space-y-1">
                      {#each course.academicYears.slice(0, 2) as year}
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-gray-600">{year.name}</span>
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium {year.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}">
                            {year.isActive ? 'Attivo' : 'Concluso'}
                          </span>
                        </div>
                      {/each}
                      {#if course.academicYears.length > 2}
                        <div class="text-xs text-gray-500">
                          +{course.academicYears.length - 2} altri...
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}
                
                <!-- Created date -->
                <p class="text-xs text-gray-500 mb-4">
                  Creato il {formatDate(course.createdAt)}
                </p>
                
                <!-- Actions -->
                <div class="flex justify-between space-x-2">
                  <button
                    on:click={() => viewCourseDetail(course.id)}
                    class="flex-1 btn btn-sm btn-primary"
                  >
                    👁️ Gestisci
                  </button>
                  <button
                    on:click={() => handleEdit(course)}
                    class="btn btn-sm btn-secondary"
                  >
                    ✏️
                  </button>
                  <button
                    on:click={() => deleteConfirmId = course.id}
                    class="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            {/each}
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
            Sei sicuro di voler eliminare questo corso? Tutti gli anni accademici, le lezioni e i punteggi associati saranno eliminati definitivamente. Questa operazione non può essere annullata.
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
            action="?/deleteCourse"
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
