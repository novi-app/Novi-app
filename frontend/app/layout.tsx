import type { Metadata, Viewport } from "next"
import { Sora, Lora } from 'next/font/google'
import ClientHooks from "./ClientHooks"
import "./globals.css"

const sora = Sora({ 
  subsets: ['latin'], 
  variable: '--font-sora',
})
const lora = Lora({ 
  subsets: ['latin'], 
  variable: '--font-lora' 
})

export const metadata: Metadata = {
  title: "Novi - AI Travel Companion",
  description: "Solo travel decision support - eliminate decision paralysis",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Novi",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0B4F4A",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${lora.variable} antialiased`}>
        {children}
        <ClientHooks/>
      </body>
    </html>
  );
}
