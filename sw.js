const cacheName = 'maqra-v1';
const assets = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/assets/favicon.png',
    '/assets/audio/adzan.mp3',
    '/assets/audio/zikir-pagi.mp3',
    '/assets/audio/zikir-petang.mp3'
];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            console.log('Caching kenceng bro...');
            return cache.addAll(assets);
        })
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== cacheName).map(key => caches.delete(key))
            );
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