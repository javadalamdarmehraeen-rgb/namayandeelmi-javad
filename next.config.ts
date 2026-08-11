import type { NextConfig } from "next";
/**
 *  :
 *  -  HTML  →    (no-store)      
 *  -  /_next/static →   (      build  )
 *  - sw.js →        

 */
const NO_STORE = "no-cache, no-store, must-revalidate, max-age=0";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["leaflet"],
  },
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        //   HTML:     
        // ( /_next/*        )
        source: "/:path((?!_next/).*)",
        headers: [
          { key: "Cache-Control", value: NO_STORE },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      // :  /_next/static     Next.js  
      //  immutable            .
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: NO_STORE },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=3600" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/logo.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/apple-touch-icon.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/screenshots/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/data/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=31536000" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        // API    
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: NO_STORE }],
      },
    ];
  },

};
export default nextConfig;
