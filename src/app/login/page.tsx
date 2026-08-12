
"use client";
import React, { useEffect } from "react";
/**
 * Next.js Login & CRM Portal Page (/login)
 *     namayandeelmi-javad.onrender.com/login  ndcohub.ir
 *         (CRM PWA)      .
 */
export default function LoginPage() {
  useEffect(() => {
    document.title = "         (CRM)";
  }, []);
  return (
    <div style={{ width: "100%", height: "100vh", margin: 0, padding: 0, overflow: "hidden", backgroundColor: "#0f766e" 
}}>
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
