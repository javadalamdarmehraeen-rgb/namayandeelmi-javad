// سرور سبک Node.js برای Render — ورود جدا، gzip، health، ژئوکد، محدودیت نرخ
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");

const PORT = process.env.PORT || 10000;
const SERVER_DATA_PATH = path.join(__dirname, "server-db.json");
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".csv": "text/csv; charset=utf-8",
  ".geojson": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff2": "font/woff2"
};

const loginHits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = loginHits.get(ip) || { n: 0, t: now };
  if (now - rec.t > 10 * 60 * 1000) { rec.n = 0; rec.t = now; }
  rec.n += 1;
  loginHits.set(ip, rec);
  return rec.n > 30;
}

function send(req, res, status, content, contentType, extra) {
  const headers = Object.assign({
    "Content-Type": contentType || "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "X-Frame-Options": "SAMEORIGIN",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  }, extra || {});
  const accept = String(req.headers["accept-encoding"] || "");
  const compressible = /text|javascript|json|svg|csv/.test(contentType || "");
  if (compressible && accept.includes("gzip") && Buffer.byteLength(content) > 512) {
    const gz = zlib.gzipSync(content);
    headers["Content-Encoding"] = "gzip";
    headers["Vary"] = "Accept-Encoding";
    res.writeHead(status, headers);
    return res.end(gz);
  }
  res.writeHead(status, headers);
  res.end(content);
}

function sendFile(req, res, filePath, maxAge) {
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    const extra = {
      "Cache-Control": maxAge
        ? ("public, max-age=" + maxAge)
        : "no-cache, no-store, must-revalidate"
    };
    send(req, res, 200, buf, type, extra);
  });
}

const server = http.createServer((req, res) => {
  const host = req.headers.host || ("localhost:" + PORT);
  const parsed = new URL(req.url, "http://" + host);
  const pathname = parsed.pathname;
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "0").toString().split(",")[0].trim();

  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }

  if (pathname === "/ping" || pathname === "/api/health" || pathname === "/api/ping" || pathname === "/healthz") {
    return send(req, res, 200, JSON.stringify({
      ok: true, status: "healthy", message: "OK",
      service: "namayandeelmi-javad-crm",
      version: "11.1.0",
      timestamp: new Date().toISOString()
    }), "application/json; charset=utf-8");
  }

  if ((pathname === "/api/geocode" || pathname === "/api/reverse") && req.method === "GET") {
    if (rateLimited(ip + ":geo")) {
      return send(req, res, 429, JSON.stringify({ status: "error", message: "too many requests" }), "application/json; charset=utf-8");
    }
    const q = parsed.searchParams.get("q") || "";
    const lat = parsed.searchParams.get("lat") || "";
    const lng = parsed.searchParams.get("lng") || parsed.searchParams.get("lon") || "";
    const limit = parsed.searchParams.get("limit") || "5";
    const target = pathname === "/api/reverse"
      ? "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + encodeURIComponent(lat) + "&lon=" + encodeURIComponent(lng) + "&zoom=18&addressdetails=1"
      : "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(q) + "&limit=" + encodeURIComponent(limit) + "&addressdetails=1&countrycodes=ir";
    fetch(target, {
      headers: { "Accept-Language": "fa,en", "User-Agent": "namayandeelmi-javad-crm/11.1" }
    }).then(async (up) => {
      const text = await up.text();
      send(req, res, up.ok ? 200 : up.status, text, "application/json; charset=utf-8", { "Cache-Control": "public, max-age=120" });
    }).catch((err) => {
      send(req, res, 502, JSON.stringify({ status: "error", message: String(err.message || err) }), "application/json; charset=utf-8");
    });
    return;
  }

  if (pathname === "/api/state" && req.method === "GET") {
    if (fs.existsSync(SERVER_DATA_PATH)) {
      return send(req, res, 200, JSON.stringify({ status: "success", data: JSON.parse(fs.readFileSync(SERVER_DATA_PATH, "utf8")) }), "application/json; charset=utf-8");
    }
    return send(req, res, 200, JSON.stringify({ status: "empty" }), "application/json; charset=utf-8");
  }

  if (pathname === "/api/state" && req.method === "POST") {
    if (rateLimited(ip + ":state")) {
      return send(req, res, 429, JSON.stringify({ status: "error", message: "too many requests" }), "application/json; charset=utf-8");
    }
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 8 * 1024 * 1024) req.destroy(); });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(SERVER_DATA_PATH, JSON.stringify(data), "utf8");
        send(req, res, 200, JSON.stringify({ status: "success" }), "application/json; charset=utf-8");
      } catch (err) {
        send(req, res, 400, JSON.stringify({ status: "error", message: err.message }), "application/json; charset=utf-8");
      }
    });
    return;
  }

  if (pathname === "/api/backup" && req.method === "GET") {
    if (!fs.existsSync(SERVER_DATA_PATH)) {
      return send(req, res, 404, JSON.stringify({ status: "error" }), "application/json; charset=utf-8");
    }
    res.writeHead(200, {
      "Content-Disposition": "attachment; filename=\"crm-backup-latest.json\"",
      "Content-Type": "application/json; charset=utf-8"
    });
    return fs.createReadStream(SERVER_DATA_PATH).pipe(res);
  }

  // ورود سبک — اولین صفحه برنامه
  if (pathname === "/login" || pathname === "/login/") {
    return sendFile(req, res, path.join(PUBLIC_DIR, "login.html"), 0);
  }

  // پنل اصلی بعد از ورود
  if (pathname === "/" || pathname === "/panel" || pathname === "/panel/" || pathname === "/admin") {
    return sendFile(req, res, path.join(PUBLIC_DIR, "index.html"), 0);
  }

  let rel = pathname.replace(/^\/+/, "");
  if (!rel || rel.indexOf("..") !== -1) {
    return sendFile(req, res, path.join(PUBLIC_DIR, "login.html"), 0);
  }
  const filePath = path.join(PUBLIC_DIR, rel);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  const ext = path.extname(filePath).toLowerCase();
  const longCache = [".png", ".jpg", ".jpeg", ".css", ".js", ".woff2"].indexOf(ext) !== -1 && rel.indexOf("vendor/") === 0;
  const assetCache = [".png", ".jpg", ".jpeg", ".ico"].indexOf(ext) !== -1 ? 86400 : (rel.indexOf("vendor/") === 0 ? 604800 : 0);
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return sendFile(req, res, path.join(PUBLIC_DIR, "login.html"), 0);
    }
    sendFile(req, res, filePath, assetCache);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("CRM v11.1 listening on 0.0.0.0:" + PORT);
});
