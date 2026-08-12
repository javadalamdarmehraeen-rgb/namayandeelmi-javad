import { NextResponse, type NextRequest } from "next/server";
/**
 * CORS    .
 *
 *      ndcohub.ir  onrender.com ( )  
 *      /    .
 */
const ALLOWED = (process.env.NEXT_PUBLIC_ENDPOINTS || "https://ndcohub.ir,https://namayandeelmi-javad.onrender.com")

  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
function isAllowed(origin: string) {
  if (!origin) return false;
  const clean = origin.replace(/\/$/, "");
  if (ALLOWED.includes(clean)) return true;
  //       
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(clean) || /\.ndcohub\.ir$/.test(clean);
}
export default function proxy(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const isApi = req.nextUrl.pathname.startsWith("/api/") || req.nextUrl.pathname === "/ping";
  if (!isApi) return NextResponse.next();
  //   preflight
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    applyCors(res, origin);
    return res;
  }
  const res = NextResponse.next();
  applyCors(res, origin);
  return res;
}
function applyCors(res: NextResponse, origin: string) {
  if (isAllowed(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  } else if (!origin) {
    res.headers.set("Access-Control-Allow-Origin", "*");
  }
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, x-auth-token, x-sync-node, x-sync-timestamp, x-sync-signature, x-sync-key, x-proxy-secret",
  );
  res.headers.set("Access-Control-Max-Age", "86400");
}
export const config = {
  matcher: ["/api/:path*", "/ping"],
};
