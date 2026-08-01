// ===== TahajjudY Service Worker =====
// MUHIM: JS/CSS o'zgartirilganda CACHE_VERSION'ni oshiring, aks holda
// eski nusxa keshdan qaytaveradi (bu bug oldingi loyihalarda ham chiqqan).
const CACHE_VERSION = 'tahajjudy-v2';

const CORE_ASSETS = [
  'index.html',
  'dashboard.html',
  'settings.html',
  'css/styles.css',
  'js/firebase-config.js',
  'js/auth.js',
  'js/dashboard.js',
  'js/pwa.js',
  'js/settings.js',
  'manifest.json',
  'assets/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first: internet bo'lsa eng yangi versiyani oladi,
// bo'lmasa keshdagi oxirgi saqlangan nusxani ko'rsatadi (offline rejim).
self.addEventListener('fetch', (event) => {
  // Tashqi API so'rovlarini (masalan Aladhan, Firestore) keshlamaymiz
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
