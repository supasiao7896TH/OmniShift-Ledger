// ShiftPro Tracker — Service Worker (offline support)
// bump CACHE เมื่อปล่อยเวอร์ชันใหม่ เพื่อล้าง cache เก่า
const CACHE = 'shiftpro-v11-16';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js',
  'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap'
];

function isCrossOrigin(url) {
  return /^https?:\/\//.test(url) && new URL(url).origin !== self.location.origin;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // allSettled: ถ้า CDN ตัวใดโหลดไม่สำเร็จ จะไม่ทำให้ install ทั้งหมดล้ม
    // cross-origin (CDN) ใช้ no-cors เพื่อให้แคช opaque response ได้ -> offline ใช้ได้จริง
    await Promise.allSettled(ASSETS.map(async (url) => {
      try {
        const req = isCrossOrigin(url) ? new Request(url, { mode: 'no-cors' }) : new Request(url);
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) await cache.put(req, res);
      } catch (e) { /* ข้ามไฟล์ที่โหลดไม่ได้ */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // ไม่แคชการเรียก Gemini API (ต้องสดเสมอ)
  if (url.hostname.includes('generativelanguage.googleapis.com')) return;

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) {
      // stale-while-revalidate: คืน cache ทันที แล้วอัปเดตเบื้องหลัง
      event.waitUntil(fetchAndCache(req).catch(() => {}));
      return cached;
    }
    try {
      return await fetchAndCache(req);
    } catch (err) {
      if (req.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});

async function fetchAndCache(req) {
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) {
    const cache = await caches.open(CACHE);
    cache.put(req, res.clone());
  }
  return res;
}
