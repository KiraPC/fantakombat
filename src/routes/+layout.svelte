<!-- Main layout for Fantakombat -->
<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { enhance } from '$app/forms';

  export let data;
  
  // Get user from page data
  $: user = data?.user;
  $: isLoggedIn = !!user;
  $: isTeacher = user?.role === 'INSEGNANTE';
  
  // Get current path reactively
  $: currentPath = $page.url.pathname;
  
  // Check if current route is active (reactive)
  function isActiveRoute(href: string, currentPath: string): boolean {
    return currentPath === href || currentPath?.startsWith(href + '/');
  }
  
  // Navigation items with reactive active state
  $: navigationItems = isLoggedIn 
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
        ...(isTeacher ? [
          { href: '/courses', label: 'Corsi', icon: '📖' },
          { href: '/lessons', label: 'Lezioni', icon: '📚' },
          { href: '/actions', label: 'Azioni', icon: '⚡' },
          { href: '/users', label: 'Utenti', icon: '�' },
        ] : [
          { href: '/rankings', label: 'Classifiche', icon: '🏆' },
        ]),
        { href: '/profile', label: 'Profilo', icon: '👤' },
      ].map(item => ({
        ...item,
        isActive: isActiveRoute(item.href, currentPath)
      }))
    : [];
  
  // Handle mobile menu toggle
  let mobileMenuOpen = false;
  
  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }
  
  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
  
  // Close mobile menu when page changes
  $: if ($page.url.pathname) {
    mobileMenuOpen = false;
  }
</script>

<svelte:head>
  <title>Fantakombat - Fit&Box Game</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  {#if isLoggedIn}
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo and brand -->
          <div class="flex items-center">
            <a href="/dashboard" class="flex items-center space-x-2">
              <span class="text-2xl">🥊</span>
              <span class="text-xl font-bold text-gray-900">Fantakombat</span>
            </a>
          </div>

          <!-- Desktop navigation -->
          <div class="hidden md:flex items-center space-x-8">
            {#each navigationItems as item}
              <a
                href={item.href}
                class="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 {item.isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            {/each}
            
            <!-- User menu -->
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-600">Ciao, {user?.name}</span>
                <span class="badge {isTeacher ? 'badge-blue' : 'badge-green'}">
                  {isTeacher ? 'Insegnante' : 'Iscritto'}
                </span>
              </div>
              
              <!-- Logout button -->
              <form method="post" action="/logout" use:enhance>
                <button
                  type="submit"
                  class="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="md:hidden">
            <button
              on:click={toggleMobileMenu}
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span class="sr-only">Apri menu</span>
              {#if mobileMenuOpen}
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              {:else}
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              {/if}
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      {#if mobileMenuOpen}
        <div class="md:hidden">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {#each navigationItems as item}
              <a
                href={item.href}
                on:click={closeMobileMenu}
                class="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 {item.isActive
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            {/each}
            
            <!-- User info and logout -->
            <div class="border-t border-gray-200 pt-3 mt-3">
              <div class="px-3 py-2">
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-gray-600">Ciao, {user?.name}</span>
                  <span class="badge {isTeacher ? 'badge-blue' : 'badge-green'}">
                    {isTeacher ? 'Insegnante' : 'Iscritto'}
                  </span>
                </div>
              </div>
              
              <form method="post" action="/logout" use:enhance>
                <button
                  type="submit"
                  class="w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      {/if}
    </nav>
  {/if}

  <!-- Main content -->
  <main class="flex-1">
    <slot />
  </main>
</div>

<style>
  /* Close mobile menu when clicking outside */
  :global(body) {
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  }
</style>
