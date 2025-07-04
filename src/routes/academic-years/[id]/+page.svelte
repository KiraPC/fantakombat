<script lang="ts">
  import { enhance } from '$app/forms';
  import { format } from 'date-fns';
  import { it } from 'date-fns/locale';
  import type { PageData } from './$types';

  export let data: PageData;

  let showEditModal = false;
  let showEnrollModal = false;
  let showUnenrollModal = false;
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
        showEditModal = false;
        showEnrollModal = false;
        showUnenrollModal = false;
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
  function handleUpdateAcademicYear() {
    isSubmitting = true;
    return async ({ result, update }: any) => {
      await update();
      handleSubmitResult(result);
    };
  }

  function handleActivateAcademicYear() {
    isSubmitting = true;
    return async ({ result, update }: any) => {
      await update();
      handleSubmitResult(result);
    };
  }

  function handleDeactivateAcademicYear() {
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

  function openEditModal() {
    showEditModal = true;
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
    showEditModal = false;
    showEnrollModal = false;
    showUnenrollModal = false;
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
  <title>Gestione Anno Accademico - {data.academicYear.name}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Header -->
  <div class="flex justify-between items-center mb-8">
    <div>
      <div class="flex items-center gap-4 mb-2">
        <h1 class="text-3xl font-bold text-gray-900">{data.academicYear.name}</h1>
        {#if data.academicYear.isActive}
          <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Attivo</span>
        {:else}
          <span class="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">Chiuso</span>
        {/if}
      </div>
      <p class="text-gray-600">
        Corso: <strong>{data.academicYear.course.name}</strong>
      </p>
      {#if data.academicYear.course.description}
        <p class="text-gray-500 text-sm mt-1">{data.academicYear.course.description}</p>
      {/if}
      <div class="flex items-center gap-4 mt-3">
        <span class="text-sm text-gray-500">
          <strong>Inizio:</strong> {formatDate(data.academicYear.startDate)}
        </span>
        {#if data.academicYear.endDate}
          <span class="text-sm text-gray-500">
            <strong>Fine:</strong> {formatDate(data.academicYear.endDate)}
          </span>
        {/if}
      </div>
    </div>
    <div class="flex gap-2">
      <a href="/courses/{data.academicYear.course.id}" class="btn btn-secondary">
        ← Torna al corso
      </a>
      <button type="button" class="btn btn-secondary" on:click={openEditModal}>
        Modifica
      </button>
      {#if data.academicYear.isActive}
        <form method="post" action="?/deactivateAcademicYear" use:enhance={handleDeactivateAcademicYear} class="inline">
          <button type="submit" class="btn btn-warning" disabled={isSubmitting}>
            Disattiva
          </button>
        </form>
      {:else}
        <form method="post" action="?/activateAcademicYear" use:enhance={handleActivateAcademicYear} class="inline">
          <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
            Riattiva
          </button>
        </form>
      {/if}
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

  <!-- Statistics -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div class="text-3xl font-bold text-blue-600">{data.academicYear.stats.enrolledStudents}</div>
      <div class="text-sm text-gray-600">Studenti Iscritti</div>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div class="text-3xl font-bold text-green-600">{data.academicYear.stats.totalLessons}</div>
      <div class="text-sm text-gray-600">Lezioni Totali</div>
    </div>
    <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div class="text-3xl font-bold text-purple-600">{data.academicYear.stats.totalScores}</div>
      <div class="text-sm text-gray-600">Punteggi Assegnati</div>
    </div>
  </div>

  <!-- Enrolled Students -->
  <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-900">
          Studenti Iscritti ({data.academicYear.enrollments.length})
        </h2>
        {#if data.availableStudents.length > 0}
          <button type="button" class="btn btn-primary btn-sm" on:click={openEnrollModal}>
            + Iscrivi Studente
          </button>
        {:else}
          <a href="/users" class="btn btn-secondary btn-sm">
            Crea nuovi studenti
          </a>
        {/if}
      </div>
    </div>

    {#if data.academicYear.enrollments.length > 0}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Iscrizione
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each data.academicYear.enrollments as enrollment}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {enrollment.userName}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {enrollment.userEmail}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(enrollment.enrolledAt)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    class="btn btn-sm btn-danger"
                    on:click={() => openUnenrollModal(enrollment)}
                  >
                    Disiscrivi
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="px-6 py-12 text-center">
        <div class="text-gray-400 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Nessuno studente iscritto</h3>
        <p class="text-gray-500 mb-4">
          Non ci sono ancora studenti iscritti a questo anno accademico.
        </p>
        {#if data.availableStudents.length > 0}
          <button type="button" class="btn btn-primary" on:click={openEnrollModal}>
            Iscrivi il primo studente
          </button>
        {:else}
          <a href="/users" class="btn btn-primary">
            Crea nuovi studenti
          </a>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Recent Lessons -->
  {#if data.academicYear.lessons.length > 0}
    <div class="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-900">
          Lezioni Recenti ({data.academicYear.lessons.length})
        </h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titolo
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Punteggi
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each data.academicYear.lessons.slice(0, 10) as lesson}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lesson.title || 'Lezione senza titolo'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(lesson.date)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lesson.scoresCount} punteggi
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href="/lessons?year={data.academicYear.id}" class="btn btn-sm btn-secondary">
                    Gestisci
                  </a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if data.academicYear.lessons.length > 10}
        <div class="px-6 py-4 bg-gray-50 text-center">
          <a href="/lessons?year={data.academicYear.id}" class="btn btn-secondary">
            Vedi tutte le lezioni ({data.academicYear.lessons.length})
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Edit Academic Year Modal -->
{#if showEditModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Modifica Anno Accademico
        </h3>
        <form method="post" action="?/updateAcademicYear" use:enhance={handleUpdateAcademicYear}>
          <div class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                Nome Anno Accademico *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={data.academicYear.name}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                value={formatDateInput(data.academicYear.startDate)}
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
                value={data.academicYear.endDate ? formatDateInput(data.academicYear.endDate) : ''}
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

<!-- Enroll Student Modal -->
{#if showEnrollModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Iscrivi Studente all'Anno Accademico
        </h3>
        <form method="post" action="?/enrollStudent" use:enhance={handleEnrollStudent}>
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
