import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import ClientHooks from "./ClientHooks"
import "./globals.css"

const cormorantGaramond = Cormorant_Garamond({ 
  subsets: ['latin'], 
  variable: '--font-cormorant-garamond',
})
const dmSans = DM_Sans({ 
  subsets: ['latin'], 
  variable: '--font-dm-sans' 
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
      <body className={`${cormorantGaramond.variable} ${dmSans.variable} antialiased`}>
        {children}
        <ClientHooks/>
      </body>
    </html>
  );
}
