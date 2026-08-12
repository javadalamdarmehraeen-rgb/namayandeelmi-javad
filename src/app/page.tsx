"use client";

import React, { useEffect } from "react";

/**
 * Next.js Root Dashboard Page (/)
 * هماهنگ با آدرس‌های دائم namayandeelmi-javad.onrender.com و ndcohub.ir
 * اجرای مستقیم سامانه مدیریت ویزیت علمی، داروخانه‌ها، پزشکان و سفارشات (CRM PWA)
 */
export default function HomePage() {
  useEffect(() => {
    document.title = "سیستم جامع مدیریت و ویزیت علمی، داروخانه‌ها و پزشکان (CRM)";
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", margin: 0, padding: 0, overflow: "hidden", backgroundColor: "#0f766e" }}>
      <iframe
        src="/index.html"
        title="CRM Medical Representative Application"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        allow="geolocation; microphone; camera"
      />
    </div>
  );
}
