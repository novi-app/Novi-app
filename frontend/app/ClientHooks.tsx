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
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}
      </Script>
    </>
  )
}
