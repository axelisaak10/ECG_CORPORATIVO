// Service Worker para PWA Checador de Asistencia ECG Corporativo
const CACHE_NAME = 'ecg-asistencia-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/asistencia',
  '/kiosco',
  '/manifest.json',
  '/assets/logos/Corporativo.png',
  '/assets/logos/centro.png',
  '/assets/logos/Dictaminacion.png',
  '/assets/logos/Capacitacion.png',
  '/assets/miembros/adelfo.jpeg',
  '/assets/miembros/erasmo_cuaya.jpeg',
  '/assets/miembros/axel.jpeg'
];

// Instalación: cachear archivos base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Algunos recursos estáticos no pudieron cachearse en install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación: limpiar cachés viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepción de peticiones (Offline First para vistas y recursos)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Peticiones a la API: intentar red primero, si falla no romper la app
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ offline: true, message: 'Operando en modo sin conexión.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Peticiones de navegación y recursos estáticos: Network first con fallback a caché
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Si navega a una ruta en offline, devolver el index.html cacheado
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
          return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
