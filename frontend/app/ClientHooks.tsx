"use client";
import Script from "next/script";
import { useScrollTracking } from "@/hooks/useScrollTracking";
import { useDwellTime } from "@/hooks/useDwellTime";

export default function ClientHooks() {
  useScrollTracking();
  useDwellTime();

  return (
    <>
      {/* Register Service Worker */}
      <Script id="register-sw" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', async function() {
              try {
                const registration = await navigator.serviceWorker.register(
                  '/service-worker.js',
                  { updateViaCache: 'none' }
                );

                // Only reload on genuine updates — not on first install.
                // Capture whether the page was already controlled BEFORE controllerchange fires.
                const wasControlled = !!navigator.serviceWorker.controller;
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  if (!refreshing && wasControlled) {
                    refreshing = true;
                    window.location.reload();
                  }
                });

                // If a new version is already waiting, activate it immediately
                if (registration.waiting) {
                  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }

                // When a new version is found, activate it as soon as it installs
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
