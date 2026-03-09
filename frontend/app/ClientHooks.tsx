"use client";
import Script from "next/script";
import { useScrollTracking } from "@/hooks/useScrollTracking";
import { useDwellTime } from "@/hooks/useDwellTime";

export default function ClientHooks() {
  useScrollTracking();
  useDwellTime();

  return (
    <>
      {/* Register Service Worker with cache-busting */}
      <Script id="register-sw" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', async function() {
              try {
                // Step 1: Unregister ALL old service workers
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(reg => reg.unregister()));

                // Step 2: Clear all caches
                if ('caches' in window) {
                  const cacheNames = await caches.keys();
                  await Promise.all(cacheNames.map(name => caches.delete(name)));
                }

                // Step 3: Register new service worker with cache-busting timestamp
                const timestamp = Date.now();
                const registration = await navigator.serviceWorker.register(
                  '/sw.js?v=' + timestamp,
                  { updateViaCache: 'none' }
                );

                // Step 4: Handle updates - reload page when new worker takes control
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                  }
                });

                // Step 5: If there's a waiting worker, activate it immediately
                if (registration.waiting) {
                  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }

                // Step 6: Listen for new workers becoming available
                registration.addEventListener('updatefound', () => {
                  const newWorker = registration.installing;
                  if (!newWorker) return;

                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                  });
                });
              } catch (error) {
                console.error('Service worker error:', error);
              }
            });
          }
        `}
      </Script>
    </>
  );
}
