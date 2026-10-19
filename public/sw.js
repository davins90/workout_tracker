// Service worker: opens the app with weak or no signal and never caches the login flow or the API.
// The app sits behind IAP: an expired login answers with a redirect to Google, which is passed through untouched.

const SHELL_CACHE = "workout-shell-v1";
const STATIC_CACHE = "workout-static-v1";
const NAVIGATION_TIMEOUT_MS = 5000;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = [SHELL_CACHE, STATIC_CACHE];
      for (const key of await caches.keys()) {
        if (!keep.includes(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })()
  );
});

// Only real pages of this app are worth keeping: no redirects, no login pages
function cacheable(response) {
  return response && response.ok && response.type === "basic" && !response.redirected;
}

// Page: network first, so a fresh login always goes through; the saved copy only when the network does not answer
async function handleNavigation(request) {
  const network = fetch(request).then(async (response) => {
    if (cacheable(response)) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put("/", response.clone());
    }
    return response;
  });

  const timeout = new Promise((resolve) => setTimeout(resolve, NAVIGATION_TIMEOUT_MS));
  const first = await Promise.race([network.catch(() => null), timeout]);
  if (first) return first;

  const cached = await caches.match("/");
  if (cached) return cached;
  return network;
}

// Build files have a hash in the name and never change: the saved copy is enough
async function handleStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (cacheable(response)) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Login steps carry query parameters and always go straight to the network
  if (request.mode === "navigate" && url.pathname === "/" && !url.search) {
    event.respondWith(handleNavigation(request));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(handleStatic(request));
  }
});
