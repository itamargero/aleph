/* The service worker reports readiness only after every bundled asset is verified.
 * No localStorage flag can promise offline availability: Safari may evict a cache. */
(() => {
  let registration;
  let preparing;
  let lastWorkerMessage = Date.now();
  const obsoleteVersions = new Set();
  const observedRegistrations = new WeakSet();
  const observedWorkers = new WeakSet();
  window.HH_OFFLINE = { status: 'preparing', completed: 0, total: 0, error: '', version: '' };

  function publish(state) {
    if (state.version && obsoleteVersions.has(state.version)) return;
    if (state.version && window.HH_OFFLINE.version && state.version !== window.HH_OFFLINE.version) {
      // While an update downloads, an older active worker may finish a status
      // reply. Keep that reply from replacing the newer download's progress.
      if (state.status !== 'preparing') return;
      obsoleteVersions.add(window.HH_OFFLINE.version);
    }
    window.HH_OFFLINE = { ...window.HH_OFFLINE, ...state };
    window.dispatchEvent(new CustomEvent('hh-offline', { detail: window.HH_OFFLINE }));
  }
  function requestStatus(worker, type = 'HH_STATUS') {
    if (!worker || worker.state === 'redundant') return;
    const channel = new MessageChannel();
    const timeout = setTimeout(() => {
      channel.port1.close();
      if (window.HH_OFFLINE.status === 'preparing' && Date.now() - lastWorkerMessage >= 45000) {
        publish({ status: 'error', error: 'Offline download stopped responding. Connect to Wi-Fi and tap retry.' });
      }
    }, 45000);
    channel.port1.onmessage = event => {
      clearTimeout(timeout);
      channel.port1.close();
      if (event.data?.type === 'HH_OFFLINE') { lastWorkerMessage = Date.now(); publish(event.data.state); }
    };
    worker.postMessage({ type }, [channel.port2]);
  }
  function observe(worker, requestType = 'HH_STATUS') {
    if (!worker) return;
    requestStatus(worker, requestType);
    if (observedWorkers.has(worker)) return;
    observedWorkers.add(worker);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' || worker.state === 'activated') requestStatus(worker);
      if (worker.state === 'redundant' && window.HH_OFFLINE.status === 'preparing') {
        publish({ status: 'error', error: 'Download interrupted. Connect to Wi-Fi and tap retry.' });
      }
    });
  }
  function completion() {
    return new Promise(resolve => {
      if (['ready', 'error', 'unsupported'].includes(window.HH_OFFLINE.status)) {
        resolve(window.HH_OFFLINE);
        return;
      }
      const finish = event => {
        if (['ready', 'error', 'unsupported'].includes(event.detail.status)) {
          window.removeEventListener('hh-offline', finish);
          clearTimeout(timeout);
          resolve(event.detail);
        }
      };
      const timeout = setTimeout(() => {
        publish({ status: 'error', error: 'Download is taking too long. Stay online and tap retry.' });
      }, 180000);
      window.addEventListener('hh-offline', finish);
    });
  }
  window.prepareOffline = () => {
    if (preparing) return preparing;
    preparing = (async () => {
      if (!('serviceWorker' in navigator) || !window.isSecureContext) {
        publish({ status: 'unsupported', error: 'Offline play needs Safari over a secure connection.' });
        return window.HH_OFFLINE;
      }
      publish({ status: 'preparing', completed: 0, error: '' });
      lastWorkerMessage = Date.now();
      try {
        if (navigator.storage?.persist) {
          // A denied persistence request is normal on iOS; it never blocks downloading.
          navigator.storage.persist().catch(() => false);
        }
        const online = navigator.onLine !== false;
        // An offline cold launch already has an installed worker. Looking it up
        // avoids requesting sw.js (or an update) while the iPad has no connection.
        registration = online
          ? await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
          : await navigator.serviceWorker.getRegistration('/');
        if (!registration) throw new Error('Visit this game on Wi-Fi first and wait for the airplane checkmark.');
        if (!observedRegistrations.has(registration)) {
          observedRegistrations.add(registration);
          const observedRegistration = registration;
          registration.addEventListener('updatefound', () => observe(observedRegistration.installing));
        }
        observe(registration.installing);
        observe(registration.waiting);
        observe(registration.active, online && !registration.installing && !registration.waiting ? 'HH_PREPARE' : 'HH_STATUS');
        // A new version downloads in the background and waits for this game to close.
        // We deliberately never send skipWaiting or reload a child mid-lesson.
        if (online) registration.update().catch(() => { /* Installed assets continue working without Wi-Fi. */ });
        return await completion();
      } catch (error) {
        publish({ status: 'error', error: error.message || 'Offline download failed. Connect to Wi-Fi and tap retry.' });
        return window.HH_OFFLINE;
      }
    })().finally(() => { preparing = null; });
    return preparing;
  };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'HH_OFFLINE') { lastWorkerMessage = Date.now(); publish(event.data.state); }
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => requestStatus(navigator.serviceWorker.controller));
  }
  window.addEventListener('online', () => window.prepareOffline());
  window.addEventListener('offline', () => requestStatus(navigator.serviceWorker?.controller || registration?.active));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestStatus(navigator.serviceWorker?.controller || registration?.active);
  });
  window.prepareOffline();
})();
