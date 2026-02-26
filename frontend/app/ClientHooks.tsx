"use client"

import React from "react"
import Script from "next/script"
import { useScrollTracking } from "@/hooks/useScrollTracking"
import { useDwellTime } from "@/hooks/useDwellTime"

export default function ClientHooks({ children }: { children: React.ReactNode }) {
  useScrollTracking()
  useDwellTime()

  return (
    <>
      {children}

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
