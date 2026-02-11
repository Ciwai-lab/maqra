const cacheName = 'maqra-v1';
const assets = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/assets/favicon.png'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll(assets);
        })
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(res => {
            return res || fetch(e.request);
        })
    );
});