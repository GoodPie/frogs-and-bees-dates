const CACHE_NAME = 'frognbee-cache-v1';
const RECIPE_CACHE_NAME = 'frognbee-recipes-v1';

self.addEventListener('fetch', function(event) {
    const url = new URL(event.request.url);

    // Determine cache strategy based on URL
    const isFirebaseRequest = url.hostname.includes('firebaseio.com') ||
                             url.hostname.includes('googleapis.com') ||
                             url.hostname.includes('firestore.googleapis.com');

    if (isFirebaseRequest) {
        // Network-first strategy for Firebase/Firestore requests (recipe data)
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache successful Firebase responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(RECIPE_CACHE_NAME).then(c => c.put(event.request.url, responseClone));
                    }
                    return response;
                })
                .catch(async () => {
                    // Fall back to cache when offline
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    throw new Error('Offline and no cached data available');
                })
        );
    } else {
        // Cache-first strategy for static assets
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If not in cache, fetch from network and cache it
                    return fetch(event.request)
                        .then(response => {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request.url, responseClone);
                            });
                            return response;
                        })
                        .catch(error => {
                            console.error('Fetch failed and no cached version available:', error);
                            throw error;
                        });
                })
        );
    }
});
