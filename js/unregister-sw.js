/**
 * Service Worker Unregistration
 * Run this to clear cached pages and unregister Service Worker
 */

async function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service Workers not supported');
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Found ${registrations.length} Service Worker(s)`);
    
    for (const registration of registrations) {
      console.log(`Unregistering: ${registration.scope}`);
      await registration.unregister();
    }

    // Clear all caches
    const cacheNames = await caches.keys();
    console.log(`Found ${cacheNames.length} cache(s): ${cacheNames.join(', ')}`);
    
    for (const cacheName of cacheNames) {
      console.log(`Deleting cache: ${cacheName}`);
      await caches.delete(cacheName);
    }

    console.log('✅ All Service Workers unregistered');
    console.log('✅ All caches cleared');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', unregisterServiceWorkers);
} else {
  unregisterServiceWorkers();
}
