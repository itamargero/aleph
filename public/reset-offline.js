/* This recovery page stays outside the game worker's asset list, so even an
 * older installed game must fetch it from the network. Progress is untouched. */
(() => {
  const button = document.getElementById('reset-download');
  const status = document.getElementById('reset-status');
  const next = document.getElementById('reset-next');
  const cachePrefix = 'hebrew-heroes-assets-';
  let resetting = false;

  function isGameRegistration(registration) {
    try {
      const scope = new URL(registration.scope);
      if (scope.origin !== window.location.origin || scope.pathname !== '/') return false;
      return [registration.active, registration.waiting, registration.installing].some(worker => {
        if (!worker) return false;
        const script = new URL(worker.scriptURL);
        return script.origin === window.location.origin && script.pathname === '/sw.js';
      });
    } catch { return false; }
  }

  window.resetAirplaneDownload = async () => {
    if (resetting) return false;
    resetting = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    next.hidden = true;
    const expires = Date.now() + 20000;
    let networkVerified = false;
    let completed = false;

    // One shared deadline bounds network headers, body and native storage calls.
    // Each operation is awaited separately: a late native result cannot begin a
    // later unregister/delete batch, and Promise.race observes late rejections.
    async function bounded(operation, message) {
      const remaining = expires - Date.now();
      if (remaining <= 0) throw new Error(message);
      let timer;
      try {
        return await Promise.race([
          Promise.resolve().then(operation),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), remaining); }),
        ]);
      } finally { clearTimeout(timer); }
    }

    try {
      if (navigator.onLine === false) throw new Error('This device is offline.');
      status.textContent = 'Checking the connection before removing the old download…';
      const controller = new AbortController();
      try {
        await bounded(async () => {
          const response = await fetch('/reset-offline.html?check=' + Date.now(), {
            cache: 'no-store', credentials: 'same-origin', signal: controller.signal,
          });
          if (!response.ok || !(await response.text()).includes('data-offline-reset')) {
            throw new Error('The live game could not be reached.');
          }
        }, 'The connection check took too long.');
      } finally { controller.abort(); }
      networkVerified = true;
      if (!navigator.serviceWorker?.getRegistrations || !window.caches) {
        throw new Error('Offline storage is unavailable in this browser.');
      }
      status.textContent = 'Removing the old airplane download. Your progress stays saved…';
      const registrations = await bounded(() => navigator.serviceWorker.getRegistrations(), 'Offline storage did not respond.');
      for (const registration of registrations.filter(isGameRegistration)) {
        await bounded(() => registration.unregister(), 'The old game worker did not respond.');
      }
      const names = await bounded(() => caches.keys(), 'Saved downloads did not respond.');
      for (const name of names.filter(name => name.startsWith(cachePrefix))) {
        await bounded(() => caches.delete(name), 'A saved download could not be removed.');
      }
      completed = true;
      status.textContent = 'The old airplane download is removed. Open the latest game while online to save it again.';
      next.hidden = false;
      return true;
    } catch {
      status.textContent = networkVerified
        ? 'The reset could not finish. Close other game tabs and try again while connected to Wi-Fi. Your lesson progress stays saved.'
        : 'Connect to Wi-Fi, turn off airplane mode, then try again. The saved game has not been removed.';
      return false;
    } finally {
      resetting = false;
      button.disabled = completed;
      button.setAttribute('aria-busy', 'false');
    }
  };
  button.addEventListener('click', () => { void window.resetAirplaneDownload(); });
})();
