
var CACHE_NAME = 'v1.0';  

var urlsToCache = [  
    './',
    './index.html',
    './app.js',
    './sw.js',
    './main.css',
    './puzzles.js',
    './manifest.json',
    './assets/ding.mp3',
    './assets/sweep.mp3'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            return cache.addAll(urlsToCache);
        })
        .then(self.skipWaiting())
    );
}); 

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
        .then(function(response) {
            if (response) {
                return response;
            } else {
                return fetch(event.request);
            }
        })
        .catch(function(err) {
            console.error(err);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if(cacheName !== CACHE_NAME){
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

