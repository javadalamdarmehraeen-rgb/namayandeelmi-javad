"use client";

import React, { useEffect } from "react";

/**
 * Next.js Login & CRM Portal Page (/login)
 * هماهنگ با آدرس‌های دائم namayandeelmi-javad.onrender.com/login و ndcohub.ir
 * این صفحه برنامه جامع مدیریت و ویزیت علمی (CRM PWA) را با تمامی دسترسی‌ها بارگذاری می‌کند.
 */
export default function LoginPage() {
  useEffect(() => {
    document.title = "ورود به سامانه مدیریت ویزیت علمی و شبکه درمان (CRM)";
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", margin: 0, padding: 0, overflow: "hidden", backgroundColor: "#0f766e" }}>
      <iframe
        src="/index.html#login"
        title="CRM Medical Representative Portal"
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
