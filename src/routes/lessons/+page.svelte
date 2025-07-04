<!-- Lessons management page for teachers -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  export let data;
  export let form;
  
  let showCreateForm = false;
  let deleteConfirmId: string | null = null;
  
  // Form fields
  let lessonDate = '';
  let lessonTitle = '';
  let lessonDescription = '';
  let selectedAcademicYearId = '';
  
  // Reset form
  function resetForm() {
    lessonDate = '';
    lessonTitle = '';
    lessonDescription = '';
    selectedAcademicYearId = '';
    showCreateForm = false;
  }
  
  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Format datetime
  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Get current date for input default
  function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Handle year filter change
  function handleYearChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const yearId = target.value;
    
    const url = new URL(window.location.href);
    if (yearId) {
      url.searchParams.set('year', yearId);
    } else {
      url.searchParams.delete('year');
    }
    url.searchParams.delete('page'); // Reset to first page
    goto(url.toString());
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
  
  // Navigate to lesson detail
  function viewLessonDetail(lessonId: string) {
    goto(`/lessons/${lessonId}`);
  }
  
  // Navigate to page
  function goToPage(page: number) {
    goto(`/lessons?page=${page}`);
  }
</script>

<svelte:head>
  <title>Gestisci Lezioni - Fantakombat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="px-4 py-6 sm:px-0">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            📚 Gestisci Lezioni
          </h1>
          <p class="mt-1 text-sm text-gray-600">
            Crea lezioni e assegna punti ai tuoi iscritti
          </p>
        </div>
        <div class="mt-4 sm:mt-0 flex gap-3">
          {#if data.courses && data.courses.length > 0}
            <select
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              on:change={handleYearChange}
            >
              <option value="">Tutti gli anni accademici</option>
              {#each data.courses as course}
                <optgroup label={course.name}>
                  {#each course.academicYears as year}
                    <option 
                      value={year.id}
                      selected={data.selectedYearId === year.id}
                    >
                      {year.name} {year.isActive ? '(Attivo)' : '(Chiuso)'}
                    </option>
                  {/each}
                </optgroup>
              {/each}
            </select>
          {/if}
          <button
            on:click={() => { 
              showCreateForm = true; 
              lessonDate = getCurrentDate(); 
            }}
            class="btn btn-primary"
          >
            <span class="text-lg mr-2">+</span>
            Nuova Lezione
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
    
    <!-- Create Lesson Form -->
    {#if showCreateForm}
      <div class="px-4 sm:px-0 mb-8">
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">
            Nuova Lezione
          </h2>
          
          <form 
            method="POST" 
            action="?/createLesson"
            use:enhance={handleSubmitResult}
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="academicYearId" class="block text-sm font-medium text-gray-700">
                  Anno Accademico *
                </label>
                <select
                  id="academicYearId"
                  name="academicYearId"
                  bind:value={selectedAcademicYearId}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Seleziona un anno accademico</option>
                  {#each data.courses as course}
                    <optgroup label={course.name}>
                      {#each course.academicYears as year}
                        <option value={year.id}>
                          {year.name} {year.isActive ? '(Attivo)' : '(Chiuso)'}
                        </option>
                      {/each}
                    </optgroup>
                  {/each}
                </select>
              </div>
              
              <div>
                <label for="date" class="block text-sm font-medium text-gray-700">
                  Data Lezione *
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  bind:value={lessonDate}
                  required
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              
              <div class="md:col-span-2">
                <label for="title" class="block text-sm font-medium text-gray-700">
                  Titolo Lezione
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  bind:value={lessonTitle}
                  placeholder="es. Lezione di Boxe - Tecniche di base"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              
              <div class="md:col-span-2">
                <label for="description" class="block text-sm font-medium text-gray-700">
                  Descrizione
                </label>
                <textarea
                  id="description"
                  name="description"
                  bind:value={lessonDescription}
                  rows="3"
                  placeholder="Descrizione della lezione (opzionale)"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                Crea Lezione
              </button>
            </div>
          </form>
        </div>
      </div>
    {/if}
    
    <!-- Lessons List -->
    <div class="px-4 sm:px-0">
      <div class="card">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">
            Elenco Lezioni ({data.pagination?.totalLessons || 0})
          </h2>
          <div class="mt-2 sm:mt-0 text-sm text-gray-600">
            Pagina {data.pagination?.currentPage || 1} di {data.pagination?.totalPages || 1}
          </div>
        </div>
        
        {#if data.lessons.length === 0}
          <div class="text-center py-12">
            <span class="text-6xl mb-4 block">📚</span>
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              Nessuna lezione trovata
            </h3>
            <p class="text-gray-600 mb-4">
              Crea la tua prima lezione per iniziare ad assegnare punti
            </p>
            <button
              on:click={() => { 
                showCreateForm = true; 
                lessonDate = getCurrentDate(); 
              }}
              class="btn btn-primary"
            >
              <span class="text-lg mr-2">+</span>
              Crea Prima Lezione
            </button>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data & Titolo
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anno Accademico
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Punteggi
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creata
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each data.lessons as lesson}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0">
                          <span class="text-2xl">📅</span>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {formatDate(lesson.date)}
                          </div>
                          {#if lesson.title}
                            <div class="text-sm text-gray-500">
                              {lesson.title}
                            </div>
                          {/if}
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        {lesson.academicYear.courseName}
                      </div>
                      <div class="text-sm text-gray-500">
                        {lesson.academicYear.name}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        {lesson.scoresCount} punteggi assegnati
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(lesson.createdAt)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex justify-end space-x-2">
                        <button
                          on:click={() => viewLessonDetail(lesson.id)}
                          class="text-primary-600 hover:text-primary-900"
                        >
                          👁️ Dettagli
                        </button>
                        <button
                          on:click={() => deleteConfirmId = lesson.id}
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
          
          <!-- Pagination -->
          <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                on:click={() => goToPage((data.pagination?.currentPage || 1) - 1)}
                disabled={!data.pagination?.hasPrevPage}
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Precedente
              </button>
              <button
                on:click={() => goToPage((data.pagination?.currentPage || 1) + 1)}
                disabled={!data.pagination?.hasNextPage}
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Successiva
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Mostrando
                  <span class="font-medium">{((data.pagination?.currentPage || 1) - 1) * 10 + 1}</span>
                  a
                  <span class="font-medium">{Math.min((data.pagination?.currentPage || 1) * 10, data.pagination?.totalLessons || 0)}</span>
                  di
                  <span class="font-medium">{data.pagination?.totalLessons || 0}</span>
                  risultati
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    on:click={() => goToPage((data.pagination?.currentPage || 1) - 1)}
                    disabled={!data.pagination?.hasPrevPage}
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span class="sr-only">Precedente</span>
                    ←
                  </button>
                  {#each Array(data.pagination?.totalPages || 1) as _, i}
                    {#if i + 1 === (data.pagination?.currentPage || 1)}
                      <span class="relative inline-flex items-center px-4 py-2 border border-primary-500 bg-primary-50 text-sm font-medium text-primary-600">
                        {i + 1}
                      </span>
                    {:else if Math.abs(i + 1 - (data.pagination?.currentPage || 1)) <= 2 || i + 1 === 1 || i + 1 === (data.pagination?.totalPages || 1)}
                      <button
                        on:click={() => goToPage(i + 1)}
                        class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {i + 1}
                      </button>
                    {:else if Math.abs(i + 1 - (data.pagination?.currentPage || 1)) === 3}
                      <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    {/if}
                  {/each}
                  <button
                    on:click={() => goToPage((data.pagination?.currentPage || 1) + 1)}
                    disabled={!data.pagination?.hasNextPage}
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span class="sr-only">Successiva</span>
                    →
                  </button>
                </nav>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Delete Lesson Confirmation Modal -->
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
            Sei sicuro di voler eliminare questa lezione? Tutti i punteggi associati saranno eliminati. Questa operazione non può essere annullata.
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
            action="?/deleteLesson"
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
