const CACHE_NAME = "maqra-v1";
const ASSETS = [
    "/",
    "/index.html",
    "/css/style.css",
    "/js/app.js",
    "/assets/favicon.png",
    "/assets/logo_ai.webp",
    "/assets/audio/adzan.mp3",
    "/assets/audio/zikir-pagi.mp3",
    "/assets/audio/zikir-petang.mp3",
];

// Install: resilient caching (gagal 1 file gak matiin SW)
self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            const results = await Promise.allSettled(
                ASSETS.map(async (url) => {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`Failed: ${url}`);
                    await cache.put(url, res);
                })
            );
            console.log("SW install cache results:", results);
        })
    );
});

// Activate: cleanup + claim clients
self.addEventListener("activate", (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) =>
                Promise.all(keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                }))
            ),
            self.clients.claim()
        ])
    );
});

// Fetch strategy:
// - Network-first for navigations (HTML)
// - Cache-first for static assets
self.addEventListener("fetch", (event) => {
    const req = event.request;

    // Filter: hanya GET + same-origin
    if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
        return;
    }

    // Navigations: network-first (biar update UI cepat)
    if (req.mode === "navigate") {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (res && res.ok) {
                        const resClone = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", resClone));
                    }
                    return res;
                })
                .catch(() => caches.match("/index.html"))
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req).then((res) => {
                if (res && res.ok) {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
                }
                return res;
            });
        })
    );
});
