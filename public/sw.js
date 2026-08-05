/* سرویس‌ورکر آفلاین-محور برای «ثبت اطلاعات کل»
   - کار با هر نوع اینترنت (موبایل، وای‌فای، اینترنت ملی، VPN روشن/خاموش)
   - صفحات و فایل‌های استاتیک: cache-first با بروزرسانی پس‌زمینه
   - درخواست‌های GET سرور: network-first با تایم‌اوت و برگشت به کش
   - درخواست‌های POST/PATCH آفلاین: در صف ذخیره و بعداً خودکار ارسال می‌شوند
*/
const VERSION = "sek-v5";
const SHELL = `${VERSION}-shell`;
const DATA = `${VERSION}-data`;
const NET_TIMEOUT = 12000;

const SHELL_URLS = [
  "/",
  "/login",
  "/panel",
  "/admin",
  "/offline",
  "/manifest.webmanifest",
  "/logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/apple-touch-icon.png",
  "/screenshots/desktop-1280x720.png",
  "/screenshots/mobile-720x1280.png",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(SHELL).then((c) => Promise.allSettled(SHELL_URLS.map((u) => c.add(u))))
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function timeoutFetch(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(req).then(
      (r) => {
        clearTimeout(t);
        resolve(r);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      }
    );
  });
}

// ---- صف درخواست‌های آفلاین (IndexedDB) ----
const DB_NAME = "sek-queue";
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("q", { keyPath: "id", autoIncrement: true });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function queueAdd(item) {
  const db = await idb();
  return new Promise((res) => {
    const tx = db.transaction("q", "readwrite");
    tx.objectStore("q").add(item);
    tx.oncomplete = () => res(true);
    tx.onerror = () => res(false);
  });
}
async function queueAll() {
  const db = await idb();
  return new Promise((res) => {
    const tx = db.transaction("q", "readonly");
    const rq = tx.objectStore("q").getAll();
    rq.onsuccess = () => res(rq.result || []);
    rq.onerror = () => res([]);
  });
}
async function queueDel(id) {
  const db = await idb();
  return new Promise((res) => {
    const tx = db.transaction("q", "readwrite");
    tx.objectStore("q").delete(id);
    tx.oncomplete = () => res(true);
    tx.onerror = () => res(false);
  });
}

async function flushQueue() {
  const items = await queueAll();
  let sent = 0;
  for (const it of items) {
    try {
      const r = await fetch(it.url, {
        method: it.method,
        headers: it.headers,
        body: it.body,
        credentials: "include",
      });
      if (r.ok) {
        await queueDel(it.id);
        sent++;
      }
    } catch {
      break; // هنوز آفلاین است
    }
  }
  if (sent > 0) {
    const cs = await self.clients.matchAll();
    cs.forEach((c) => c.postMessage({ type: "queue-flushed", count: sent }));
  }
  return sent;
}

self.addEventListener("message", (e) => {
  if (e.data === "flush") e.waitUntil(flushQueue());
  if (e.data === "skipWaiting") self.skipWaiting();
});
self.addEventListener("sync", (e) => {
  if (e.tag === "sek-sync") e.waitUntil(flushQueue());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // نوشتن آفلاین → صف
  if (req.method !== "GET") {
    if (url.pathname.startsWith("/api/")) {
      event.respondWith(
        (async () => {
          try {
            return await fetch(req.clone());
          } catch {
            const body = await req.clone().text();
            const headers = {};
            req.headers.forEach((v, k) => (headers[k] = v));
            await queueAdd({ url: req.url, method: req.method, headers, body, at: Date.now() });
            if ("sync" in self.registration) {
              try {
                await self.registration.sync.register("sek-sync");
              } catch {}
            }
            return new Response(
              JSON.stringify({
                queued: true,
                ok: true,
                offline: true,
                message: "به دلیل قطع اینترنت، اطلاعات ذخیره شد و به‌محض اتصال خودکار ارسال می‌شود.",
              }),
              { status: 202, headers: { "Content-Type": "application/json; charset=utf-8" } }
            );
          }
        })()
      );
    }
    return;
  }

  // GET های API: شبکه با تایم‌اوت، سپس کش
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname.startsWith("/api/auth")) return; // احراز هویت همیشه آنلاین
    event.respondWith(
      (async () => {
        try {
          const res = await timeoutFetch(req, NET_TIMEOUT);
          if (res.ok) {
            const c = await caches.open(DATA);
            c.put(req, res.clone());
          }
          return res;
        } catch {
          const cached = await caches.match(req);
          if (cached) {
            const h = new Headers(cached.headers);
            h.set("x-from-cache", "1");
            return new Response(await cached.blob(), { status: 200, headers: h });
          }
          return new Response(JSON.stringify({ offline: true, rows: [], error: "آفلاین" }), {
            status: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
          });
        }
      })()
    );
    return;
  }

  // صفحات و استاتیک: کش-اول + بروزرسانی پس‌زمینه
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      const network = timeoutFetch(req, NET_TIMEOUT)
        .then(async (res) => {
          if (res && res.ok) {
            const c = await caches.open(SHELL);
            c.put(req, res.clone());
          }
          return res;
        })
        .catch(() => null);
      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      const res = await network;
      if (res) return res;
      if (req.mode === "navigate") {
        return (await caches.match("/offline")) || (await caches.match("/")) ||
          new Response("<h1 dir=rtl>آفلاین هستید</h1>", { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      return new Response("", { status: 504 });
    })()
  );
});
