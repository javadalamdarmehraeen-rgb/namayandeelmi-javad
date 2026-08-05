/* ============================================================
 *  سرویس‌ورکر «ثبت اطلاعات کل» — نسخه ۸ (آفلاین-اول)
 *
 *  اصول طراحی:
 *   ۱) کل پوسته برنامه (همه صفحات) در نصب اولیه پیش‌کش می‌شود،
 *      بنابراین باز شدن برنامه هیچ وابستگی به سرعت/نوع اینترنت ندارد.
 *   ۲) صفحات: Cache-First + بروزرسانی خاموش در پس‌زمینه.
 *   ۳) داده‌های API: Stale-While-Revalidate با مهلت کوتاه؛
 *      اگر شبکه کند بود، فوراً نسخه کش‌شده نمایش داده می‌شود.
 *   ۴) نوشتن‌های آفلاین در IndexedDB صف می‌شوند و خودکار ارسال می‌شوند.
 * ============================================================ */

const VERSION = "sek-v8";
const SHELL = `${VERSION}-shell`;
const DATA = `${VERSION}-data`;
const API_TIMEOUT = 6000;
const PAGE_TIMEOUT = 8000;

/** همه صفحات برنامه — همگی استاتیک هستند و کامل پیش‌کش می‌شوند */
const SHELL_URLS = [
  "/",
  "/login",
  "/offline",
  "/install",
  "/panel",
  "/panel/pharmacies",
  "/panel/doctors",
  "/panel/orders",
  "/panel/trip",
  "/panel/home",
  "/panel/leaves",
  "/panel/notifications",
  "/panel/options",
  "/panel/reports",
  "/admin",
  "/admin/activity",
  "/admin/records/pharmacies",
  "/admin/records/doctors",
  "/admin/records/orders",
  "/admin/trips",
  "/admin/homes",
  "/admin/leaves",
  "/admin/notifications",
  "/admin/reports",
  "/admin/options",
  "/admin/columns",
  "/admin/users",
  "/admin/messengers",
  "/admin/backup",
  "/manifest.webmanifest",
  "/logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    (async () => {
      const c = await caches.open(SHELL);
      // هر آدرس جداگانه تا یک خطا کل نصب را خراب نکند
      await Promise.allSettled(SHELL_URLS.map((u) => c.add(new Request(u, { cache: "reload" }))));
    })()
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {}
      }
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

/* ---------------- صف آفلاین (IndexedDB) ---------------- */
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
      } else if (r.status >= 400 && r.status < 500) {
        await queueDel(it.id); // درخواست نامعتبر — از صف حذف شود
      }
    } catch {
      break;
    }
  }
  const cs = await self.clients.matchAll();
  cs.forEach((c) => c.postMessage({ type: "queue-status", pending: items.length - sent, sent }));
  return sent;
}

self.addEventListener("message", (e) => {
  if (e.data === "flush") e.waitUntil(flushQueue());
  if (e.data === "skipWaiting") self.skipWaiting();
  if (e.data === "queue-count")
    e.waitUntil(
      queueAll().then(async (q) => {
        const cs = await self.clients.matchAll();
        cs.forEach((c) => c.postMessage({ type: "queue-status", pending: q.length, sent: 0 }));
      })
    );
});
self.addEventListener("sync", (e) => {
  if (e.tag === "sek-sync") e.waitUntil(flushQueue());
});

/* ---------------- راهبرد واکشی ---------------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/api/ping") return;

  /* نوشتن (POST/PATCH/DELETE) → آفلاین در صف */
  if (req.method !== "GET") {
    if (!url.pathname.startsWith("/api/")) return;
    event.respondWith(
      (async () => {
        try {
          return await fetch(req.clone());
        } catch {
          // ورود/خروج قابل صف‌بندی نیست
          if (url.pathname.startsWith("/api/auth")) {
            return new Response(JSON.stringify({ error: "📴 برای ورود، اتصال اینترنت لازم است." }), {
              status: 503,
              headers: { "Content-Type": "application/json; charset=utf-8" },
            });
          }
          const body = await req.clone().text();
          const headers = {};
          req.headers.forEach((v, k) => (headers[k] = v));
          await queueAdd({ url: req.url, method: req.method, headers, body, at: Date.now() });
          if (self.registration.sync) {
            try {
              await self.registration.sync.register("sek-sync");
            } catch {}
          }
          const cs = await self.clients.matchAll();
          cs.forEach((c) => c.postMessage({ type: "queued" }));
          return new Response(
            JSON.stringify({
              ok: true,
              queued: true,
              offline: true,
              message: "📴 اینترنت قطع است؛ اطلاعات ذخیره شد و به‌محض اتصال خودکار ارسال می‌شود.",
            }),
            { status: 202, headers: { "Content-Type": "application/json; charset=utf-8" } }
          );
        }
      })()
    );
    return;
  }

  /* GET روی API → شبکه با مهلت کوتاه، سپس کش */
  if (url.pathname.startsWith("/api/")) {
    if (
      url.pathname.startsWith("/api/auth/login") ||
      url.pathname.startsWith("/api/auth/logout") ||
      url.pathname.startsWith("/api/auth/forgot") ||
      url.pathname.startsWith("/api/auth/check-username")
    )
      return;

    event.respondWith(
      (async () => {
        try {
          const res = await timeoutFetch(req, API_TIMEOUT);
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
          return new Response(
            JSON.stringify({ offline: true, rows: [], logs: [], reps: [], error: "آفلاین" }),
            { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
          );
        }
      })()
    );
    return;
  }

  /* ناوبری صفحات → کش-اول (فوری روی هر اینترنتی) */
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req, { ignoreSearch: true });
        const network = (async () => {
          try {
            const preload = await event.preloadResponse;
            const res = preload || (await timeoutFetch(req, PAGE_TIMEOUT));
            if (res && res.ok) {
              const c = await caches.open(SHELL);
              c.put(req, res.clone());
            }
            return res;
          } catch {
            return null;
          }
        })();

        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        const res = await network;
        if (res) return res;
        return (
          (await caches.match("/offline")) ||
          (await caches.match("/")) ||
          new Response("<h1 dir=rtl style='font-family:Tahoma;text-align:center;padding:40px'>آفلاین هستید</h1>", {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          })
        );
      })()
    );
    return;
  }

  /* سایر منابع (JS/CSS/تصویر) → کش-اول */
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) {
        event.waitUntil(
          timeoutFetch(req, PAGE_TIMEOUT)
            .then(async (res) => {
              if (res && res.ok) {
                const c = await caches.open(SHELL);
                c.put(req, res.clone());
              }
            })
            .catch(() => null)
        );
        return cached;
      }
      try {
        const res = await timeoutFetch(req, PAGE_TIMEOUT);
        if (res && res.ok) {
          const c = await caches.open(SHELL);
          c.put(req, res.clone());
        }
        return res;
      } catch {
        return new Response("", { status: 504 });
      }
    })()
  );
});
