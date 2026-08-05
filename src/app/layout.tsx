import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "ثبت اطلاعات کل",
  description: "سامانه ثبت اطلاعات داروخانه، پزشک، سفارشات و تردد نمایندگان علمی",
  manifest: "/manifest.webmanifest",
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
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
