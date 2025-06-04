/* eslint-env service-worker */

const cacheName = 'v2024.8/ffconf/details';

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== cacheName)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('install', (e) => {
  // once the SW is installed, go ahead and fetch the resources
  // to make this work offline
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache
        .addAll([
          '/details/',
          '/details/speaking/',
          '/covid/',
          '/code-of-conduct/',

          // css
          '/assets/css/base.css',
          '/assets/css/article.css',
          '/assets/css/mq.css',
          '/assets/css/details.css',

          // images
          '/assets/images/leftlogic.svg',
          '/assets/images/external.svg',
          '/assets/images/logo.svg',
          '/assets/images/favicons/favicon-16.png',

          // fonts
          '/assets/fonts/BasierSquare-Medium-custom.woff2',
          '/assets/fonts/BasierSquare-Medium-custom.woff',
          '/assets/fonts/BasierSquare-Regular-custom.woff2',
          '/assets/fonts/BasierSquare-Regular-custom.woff',
        ])
        .then(() => self.skipWaiting());
    })
  );
});

// when the browser fetches a url, either response with
// the cached object or go ahead and fetch the actual url
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // ensure we check the *right* cache to match against
    caches.open(cacheName).then((cache) => {
      return cache
        .match(event.request)
        .then((res) => {
          return res || fetch(event.request);
        })
        .catch((e) => {
          console.log('failed to fetch', event.request.url);
        });
    })
  );
});
