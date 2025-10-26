const CACHE_NAME = 'frognbee-cache-v1';
const RECIPE_CACHE_NAME = 'frognbee-recipes-v1';

self.addEventListener('fetch', function(event) {
    const url = new URL(event.request.url);

    // Determine cache strategy based on URL
    const isFirebaseRequest = url.hostname.includes('firebaseio.com') ||
                             url.hostname.includes('googleapis.com') ||
                             url.hostname.includes('firestore.googleapis.com');

    const isRecipeRoute = url.pathname.startsWith('/recipes');

    if (isFirebaseRequest) {
        // Network-first strategy for Firebase/Firestore requests (recipe data)
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache successful Firebase responses
                    if (response.ok) {
                        const cache = caches.open(RECIPE_CACHE_NAME);
                        cache.then(c => c.put(event.request.url, response.clone()));
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
        event.respondWith(async function() {
            try {
                const res = await fetch(event.request);
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request.url, res.clone());
                return res;
            }
            catch(error) {
                console.error('Fetch failed; returning cached version.', error);
                return caches.match(event.request);
            }
        }());
    }
});
