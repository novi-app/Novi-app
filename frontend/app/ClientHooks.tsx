"use client"

import Script from "next/script"
import { useScrollTracking } from "@/hooks/useScrollTracking"
import { useDwellTime } from "@/hooks/useDwellTime"

export default function ClientHooks() {
  useScrollTracking()
  useDwellTime()

  return (
    <>
      {/* Register Service Worker */}
      <Script id="register-sw" strategy="afterInteractive">
        {`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', async function() {
              try {
                // Clear legacy Novi caches that may contain stale route HTML.
                if ('caches' in window) {
                  const keys = await caches.keys();
                  await Promise.all(
                    keys
                      .filter((key) => key.startsWith('novi-') && key !== 'novi-static-v2')
                      .map((key) => caches.delete(key))
                  );
                }

                const registration = await navigator.serviceWorker.register('/sw.js', {
                  updateViaCache: 'none',
                });

                await registration.update();

                if (registration.waiting) {
                  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }

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
                console.error('Service worker registration failed:', error);
              }
            });
          }
        `}
      </Script>
    </>
  )
}
