importScripts('./appVersion.js');

const cacheVersionName = `app-version-cache`;
const precacheVersionAssets = ['/appVersion.js'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(cacheVersionName)
            .then((cache) => {
                return cache.keys()
                    .then((keys) => {
                        const deletionPromises = keys
                            .filter(key => key.url.includes('app-version-cache')) //
                            .map(key => cache.delete(key));
                            return Promise.all(deletionPromises);
            })
            .then(() => cache.addAll(precacheVersionAssets));
            })
            .then(() => {
                self.skipWaiting(); // Forces the waiting service worker to become the active service worker
            })
            .catch(error => {
                console.error('Cache update failed:', error);
            })
    );
});