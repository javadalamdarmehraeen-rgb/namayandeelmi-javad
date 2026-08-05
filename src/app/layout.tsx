import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";
import ConfirmProvider from "@/components/Confirm";

export const metadata: Metadata = {
  title: "ثبت اطلاعات کل",
  description: "سامانه ثبت اطلاعات داروخانه، پزشک، سفارشات و تردد نمایندگان علمی",
  applicationName: "ثبت اطلاعات کل",
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
  appleWebApp: { capable: true, title: "ثبت اطلاعات کل", statusBarStyle: "default" },
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
        {/* ثبت فوری سرویس‌ورکر تا ابزارهایی مثل PWABuilder آن را تشخیص دهند */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(function(){});}",
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        <ConfirmProvider>{children}</ConfirmProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
