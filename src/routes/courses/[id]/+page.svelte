<script lang="ts">
  import { enhance } from '$app/forms';
  import { format } from 'date-fns';
  import { it } from 'date-fns/locale';
  import type { PageData } from './$types';

  export let data: PageData;

  let showCreateModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let showEnrollModal = false;
  let showUnenrollModal = false;
  let selectedYear: any = null;
  let selectedEnrollment: any = null;

  // Form state
  let isSubmitting = false;
  let formError: string | null = null;
  let formSuccess: string | null = null;

  function handleSubmitResult(result: any) {
    isSubmitting = false;
    if (result.type === 'success') {
      if (result.data?.success) {
        formSuccess = result.data.message;
        formError = null;
        showCreateModal = false;
        showEditModal = false;
        showDeleteModal = false;
        showEnrollModal = false;
        showUnenrollModal = false;
        selectedYear = null;
        selectedEnrollment = null;
      } else if (result.data?.message) {
        formError = result.data.message;
        formSuccess = null;
      }
    } else if (result.type === 'failure') {
      formError = result.data?.message || 'Si è verificato un errore';
      formSuccess = null;
    }
  }

  // Enhanced form handlers
  function handleCreateAcademicYear() {
    isSubmitting = true;
    return async ({ result, update }: any) => {
      await update();
      handleSubmitResult(result);
    };
  }

  function handleUpdateAcademicYear() {
    isSubmitting = true;
    return async ({ result, update }: any) => {
      await update();
      handleSubmitResult(result);
    };
  }

  function handleDeleteAcademicYear() {
    isSubmitting = true;
    return async ({ result, update }: any) => {
      await update();
      handleSubmitResult(result);
    };
  }

  function handleCloseAcademicYear() {
    isSubmitting = true;
    return async ({ result, update }: any) => {
      await update();
      handleSubmitResult(result);
    };
  }

  function handleEnrollStudent() {
    isSubmitting = true;
    return async ({ result, update }: any) => {
      await update();
      handleSubmitResult(result);
    };
  }

  function handleUnenrollStudent() {
    isSubmitting = true;
    return async ({ result, update }: any) => {
      await update();
      handleSubmitResult(result);
    };
  }

  function openCreateModal() {
    showCreateModal = true;
    formError = null;
    formSuccess = null;
  }

  function openEditModal(year: any) {
    selectedYear = year;
    showEditModal = true;
    formError = null;
    formSuccess = null;
  }

  function openDeleteModal(year: any) {
    selectedYear = year;
    showDeleteModal = true;
    formError = null;
    formSuccess = null;
  }

  function openEnrollModal() {
    showEnrollModal = true;
    formError = null;
    formSuccess = null;
  }

  function openUnenrollModal(enrollment: any) {
    selectedEnrollment = enrollment;
    showUnenrollModal = true;
    formError = null;
    formSuccess = null;
  }

  function closeModals() {
    showCreateModal = false;
    showEditModal = false;
    showDeleteModal = false;
    showEnrollModal = false;
    showUnenrollModal = false;
    selectedYear = null;
    selectedEnrollment = null;
    formError = null;
    formSuccess = null;
  }

  // Format date for display
  function formatDate(dateString: string): string {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: it });
  }

  // Format date for input
  function formatDateInput(dateString: string): string {
    return format(new Date(dateString), 'yyyy-MM-dd');
  }

  // Clear messages after some time
  $: if (formSuccess) {
    setTimeout(() => {
      formSuccess = null;
    }, 5000);
  }
</script>

<svelte:head>
  <title>Gestione Corso - {data.course.name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">{data.course.name}</h1>
      {#if data.course.description}
        <p class="text-gray-600 mt-2">{data.course.description}</p>
      {/if}
      <div class="flex items-center gap-4 mt-4">
        <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {data.course.academicYears.length} anni accademici
        </span>
        <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          {data.course.academicYears.reduce((total, year) => total + (year.enrolledStudents?.length || 0), 0)} studenti iscritti
        </span>
      </div>
    </div>
    <div class="flex gap-2">
      <a href="/courses" class="btn btn-secondary">
        ← Torna ai corsi
      </a>
      <button
        type="button"
        class="btn btn-primary"
        on:click={openCreateModal}
      >
        + Nuovo Anno Accademico
      </button>
    </div>
  </div>

  <!-- Success/Error Messages -->
  {#if formSuccess}
    <div class="alert alert-success mb-6">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      {formSuccess}
    </div>
  {/if}

  {#if formError}
    <div class="alert alert-error mb-6">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
      {formError}
    </div>
  {/if}

  <!-- Academic Years List -->
  <div class="grid gap-6">
    {#each data.course.academicYears as year}
      <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 flex items-center gap-2">
              {year.name}
              {#if year.isActive}
                <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Attivo</span>
              {:else}
                <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Chiuso</span>
              {/if}
            </h3>
            <div class="text-sm text-gray-600 mt-1">
              <span>Inizio: {formatDate(year.startDate)}</span>
              {#if year.endDate}
                <span class="ml-4">Fine: {formatDate(year.endDate)}</span>
              {/if}
            </div>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-sm btn-secondary"
              on:click={() => openEditModal(year)}
            >
              Modifica
            </button>
            {#if year.isActive}
              <form method="post" action="?/closeAcademicYear" use:enhance={handleCloseAcademicYear}>
                <input type="hidden" name="id" value={year.id} />
                <button
                  type="submit"
                  class="btn btn-sm btn-warning"
                  disabled={isSubmitting}
                >
                  Chiudi Anno
                </button>
              </form>
            {/if}
            <button
              type="button"
              class="btn btn-sm btn-danger"
              on:click={() => openDeleteModal(year)}
            >
              Elimina
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">{year.lessonsCount}</div>
            <div class="text-sm text-gray-600">Lezioni</div>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="text-2xl font-bold text-green-600">{year.scoresCount}</div>
            <div class="text-sm text-gray-600">Punteggi assegnati</div>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="space-y-2">
              <a href="/academic-years/{year.id}" class="btn btn-sm btn-primary w-full">
                Gestisci Anno
              </a>
              <a href="/lessons?year={year.id}" class="btn btn-sm btn-secondary w-full">
                Gestisci Lezioni
              </a>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-gray-500 text-lg">Nessun anno accademico creato per questo corso.</p>
        <button
          type="button"
          class="btn btn-primary mt-4"
          on:click={openCreateModal}
        >
          Crea il primo anno accademico
        </button>
      </div>
    {/each}
  </div>

<!-- Create Academic Year Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Crea Nuovo Anno Accademico
        </h3>
        <form method="post" action="?/createAcademicYear" use:enhance={handleCreateAcademicYear}>
          <div class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                Nome Anno Accademico *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="es. 2024/2025"
                required
              />
            </div>
            <div>
              <label for="startDate" class="block text-sm font-medium text-gray-700">
                Data Inizio *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label for="endDate" class="block text-sm font-medium text-gray-700">
                Data Fine (opzionale)
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={closeModals}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creazione...' : 'Crea Anno Accademico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Academic Year Modal -->
{#if showEditModal && selectedYear}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Modifica Anno Accademico
        </h3>
        <form method="post" action="?/updateAcademicYear" use:enhance={handleUpdateAcademicYear}>
          <input type="hidden" name="id" value={selectedYear.id} />
          <div class="space-y-4">
            <div>
              <label for="editName" class="block text-sm font-medium text-gray-700">
                Nome Anno Accademico *
              </label>
              <input
                type="text"
                id="editName"
                name="name"
                value={selectedYear.name}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label for="editStartDate" class="block text-sm font-medium text-gray-700">
                Data Inizio *
              </label>
              <input
                type="date"
                id="editStartDate"
                name="startDate"
                value={formatDateInput(selectedYear.startDate)}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label for="editEndDate" class="block text-sm font-medium text-gray-700">
                Data Fine (opzionale)
              </label>
              <input
                type="date"
                id="editEndDate"
                name="endDate"
                value={selectedYear.endDate ? formatDateInput(selectedYear.endDate) : ''}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={closeModals}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Aggiornamento...' : 'Aggiorna Anno Accademico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Academic Year Modal -->
{#if showDeleteModal && selectedYear}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Conferma Eliminazione
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          Sei sicuro di voler eliminare l'anno accademico "{selectedYear.name}"?
          {#if selectedYear.lessonsCount > 0}
            <br><br>
            <strong class="text-red-600">
              Attenzione: Questo anno accademico contiene {selectedYear.lessonsCount} lezioni
              {#if selectedYear.scoresCount > 0}
                e {selectedYear.scoresCount} punteggi assegnati
              {/if}.
              Tutti i dati saranno eliminati definitivamente.
            </strong>
          {/if}
        </p>
        <form method="post" action="?/deleteAcademicYear" use:enhance={handleDeleteAcademicYear}>
          <input type="hidden" name="id" value={selectedYear.id} />
          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={closeModals}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              class="btn btn-danger"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Eliminazione...' : 'Elimina Anno Accademico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>  {/if}
</div>

<!-- Enroll Student Modal -->
{#if showEnrollModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Iscrivi Studente all'Anno Accademico
          {#if selectedYear}
            - {selectedYear.name}
          {/if}
        </h3>
        <form method="post" action="?/enrollStudent" use:enhance={handleEnrollStudent}>
          <input type="hidden" name="academicYearId" value={selectedYear?.id} />
          <div class="mb-4">
            <label for="enrollUserId" class="block text-sm font-medium text-gray-700">
              Seleziona Studente
            </label>
            <select
              id="enrollUserId"
              name="userId"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Seleziona uno studente...</option>
              {#each data.availableStudents as student}
                <option value={student.id}>{student.name} - {student.email}</option>
              {/each}
            </select>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={closeModals}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Iscrizione...' : 'Iscrivi Studente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Unenroll Student Modal -->
{#if showUnenrollModal && selectedEnrollment}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Conferma Disiscrizione
        </h3>
        <p class="text-sm text-gray-500 mb-4">
          Sei sicuro di voler disiscrivere <strong>{selectedEnrollment.userName}</strong> da questo anno accademico?
          <br><br>
          <strong class="text-red-600">
            Attenzione: Se lo studente ha già punteggi assegnati in questo anno accademico, non sarà possibile disiscriverslo.
          </strong>
        </p>
        <form method="post" action="?/unenrollStudent" use:enhance={handleUnenrollStudent}>
          <input type="hidden" name="userId" value={selectedEnrollment.userId} />
          <input type="hidden" name="academicYearId" value={selectedEnrollment.academicYearId} />
          <div class="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              class="btn btn-secondary"
              on:click={closeModals}
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              class="btn btn-danger"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Disiscrizione...' : 'Disiscrivi Studente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border: 1px solid transparent;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0.375rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    outline: none;
    transition: colors 0.2s;
  }
  
  .btn:focus {
    outline: 2px solid;
    outline-offset: 2px;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary {
    color: white;
    background-color: rgb(79, 70, 229);
  }
  
  .btn-primary:hover {
    background-color: rgb(67, 56, 202);
  }
  
  .btn-primary:focus {
    outline-color: rgb(99, 102, 241);
  }
  
  .btn-secondary {
    color: rgb(55, 65, 81);
    background-color: white;
    border-color: rgb(209, 213, 219);
  }
  
  .btn-secondary:hover {
    background-color: rgb(249, 250, 251);
  }
  
  .btn-secondary:focus {
    outline-color: rgb(99, 102, 241);
  }
  
  .btn-danger {
    color: white;
    background-color: rgb(220, 38, 38);
  }
  
  .btn-danger:hover {
    background-color: rgb(185, 28, 28);
  }
  
  .btn-danger:focus {
    outline-color: rgb(239, 68, 68);
  }
  
  .btn-warning {
    color: white;
    background-color: rgb(217, 119, 6);
  }
  
  .btn-warning:hover {
    background-color: rgb(180, 83, 9);
  }
  
  .btn-warning:focus {
    outline-color: rgb(245, 158, 11);
  }
  
  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }
  
  .alert {
    display: flex;
    align-items: center;
    padding: 1rem;
    border-radius: 0.5rem;
  }
  
  .alert-success {
    background-color: rgb(240, 253, 244);
    color: rgb(22, 101, 52);
    border: 1px solid rgb(187, 247, 208);
  }
  
  .alert-error {
    background-color: rgb(254, 242, 242);
    color: rgb(153, 27, 27);
    border: 1px solid rgb(254, 202, 202);
  }
</style>
