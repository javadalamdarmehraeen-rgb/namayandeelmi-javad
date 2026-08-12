import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";
import ConfirmProvider from "@/components/Confirm";
import ConnectionStatus from "@/components/ConnectionStatus";
export const metadata: Metadata = {
  title: "  ",
  description: "         ",
  applicationName: "  ",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-32.png"],
  },
  appleWebApp: { capable: true, title: "  ", statusBarStyle: "default" },
  other: { "mobile-web-app-capable": "yes", "format-detection": "telephone=no" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f766e",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/*       PWABuilder     */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(){
});}",
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <ConfirmProvider>{children}</ConfirmProvider>
        <ServiceWorker />
        <ConnectionStatus />
      </body>
    </html>
  );
}
