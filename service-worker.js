const CACHE_NAME = "deutschapp-page-v2"; // Subimos versión para forzar actualización
const OFFLINE_URL = "pages/offline.html";

// Actualizamos las rutas a la nueva estructura src/js y src/css
const urlsToCache = [
  './',
  './index.html',
  './src/css/style.css',
  './src/js/app.js',
  './src/js/api.js',       
  './src/js/palabras.js',
  './src/js/core/config.js',
  './src/js/core/state.js',
  './src/js/core/ui.js',
  './src/js/core/racha.js',
  './pages/offline.html'
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Service Worker: Cacheando archivos esenciales...');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  // Limpiar caches antiguos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('🧹 Service Worker: Borrando cache antiguo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// El resto del código de 'fetch' está perfecto, no hace falta tocarlo.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      })
  );
});