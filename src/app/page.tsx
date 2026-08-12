
"use client";
import React, { useEffect } from "react";
/**
 * Next.js Root Dashboard Page (/)
 *     namayandeelmi-javad.onrender.com  ndcohub.ir
 *           (CRM PWA)
 */
export default function HomePage() {
  useEffect(() => {
    document.title = "         (CRM)";
  }, []);
  return (
    <div style={{ width: "100%", height: "100vh", margin: 0, padding: 0, overflow: "hidden", backgroundColor: "#0f766e" 
}}>
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
