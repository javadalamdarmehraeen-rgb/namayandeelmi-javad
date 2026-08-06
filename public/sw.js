/* ============================================================
 *  سرویس‌ورکر «ثبت اطلاعات کل» — نسخه ۹ (آفلاین کامل)
 *
 *  نکته کلیدی: علاوه بر صفحات HTML، *همه فایل‌های جاوااسکریپت و CSS*
 *  برنامه هم پیش‌کش می‌شوند. بدون این کار، روی اینترنت موبایل صفحه
 *  باز می‌شد ولی چانک‌های JS تایم‌اوت می‌کردند و صفحه سفید می‌ماند.
 *  این فایل توسط scripts/build-sw.mjs پس از هر build تولید می‌شود.
 * ============================================================ */

const BUILD = "msi5u5oc-42";
const SHELL = `sek-shell-${BUILD}`;
const DATA = `sek-data-${BUILD}`;

const API_TIMEOUT = 6000;
const ASSET_TIMEOUT = 20000;
const NAV_TIMEOUT = 5000; // مهلت کوتاه برای HTML تا کاربر روی اینترنت کند معطل نماند

/** پاسخ کش‌شده را با هدر نشانه‌گذاری می‌کند تا رابط کاربری بداند آفلاین است */
function offlineFlagged(res) {
  const h = new Headers(res.headers);
  h.set("x-sek-offline", "1");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

const PAGES = [
  "/",
  "/login",
  "/offline",
  "/install",
  "/diagnostics",
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
  "/admin/backup"
];
const ASSETS = [
  "/_next/static/L4lXmtELE5sjJmil-uq0u/_buildManifest.js",
  "/_next/static/L4lXmtELE5sjJmil-uq0u/_clientMiddlewareManifest.js",
  "/_next/static/L4lXmtELE5sjJmil-uq0u/_ssgManifest.js",
  "/_next/static/chunks/0.__2~vg1zfx-.js",
  "/_next/static/chunks/00bwe0zb6r87f.js",
  "/_next/static/chunks/00j8bzodjupn6.js",
  "/_next/static/chunks/01xlw8hd842-c.js",
  "/_next/static/chunks/02t_wxwzroaiz.js",
  "/_next/static/chunks/03h9eo09svijh.js",
  "/_next/static/chunks/03~yq9q893hmn.js",
  "/_next/static/chunks/04z2e~awa-gwd.js",
  "/_next/static/chunks/06r9_3ub2r-4z.js",
  "/_next/static/chunks/07lhk_q6pmm3r.js",
  "/_next/static/chunks/07ol~8c6r993t.js",
  "/_next/static/chunks/07uz2g0_38qia.js",
  "/_next/static/chunks/08_1ijbg-ui3o.js",
  "/_next/static/chunks/08g-5kea7g6.h.js",
  "/_next/static/chunks/08g4dhgfb3-g1.js",
  "/_next/static/chunks/08~kq0~0qge7..js",
  "/_next/static/chunks/0_qnuoctlpv-a.js",
  "/_next/static/chunks/0a6fznmb06a1s.js",
  "/_next/static/chunks/0an995q9rgmye.js",
  "/_next/static/chunks/0d3shmwh5_nmn.js",
  "/_next/static/chunks/0gyt0px_yi~~h.js",
  "/_next/static/chunks/0h7njwe2.s3ht.js",
  "/_next/static/chunks/0l98~kyohy8t1.css",
  "/_next/static/chunks/0m2e7ej6xszm4.js",
  "/_next/static/chunks/0m7-1y0haw-6y.js",
  "/_next/static/chunks/0mkdhkpipl3ae.js",
  "/_next/static/chunks/0n1bpogj.il~n.js",
  "/_next/static/chunks/0rmdnecqpagy~.js",
  "/_next/static/chunks/0t.kl08cbz2tx.js",
  "/_next/static/chunks/0t48hzs_6fshe.css",
  "/_next/static/chunks/0uh4e2v8-yv0m.js",
  "/_next/static/chunks/0wxhwo2i~7vvo.js",
  "/_next/static/chunks/0xzq36uuc.mb-.js",
  "/_next/static/chunks/0ze4gu236oq96.js",
  "/_next/static/chunks/0zy7uf.6ktaeh.js",
  "/_next/static/chunks/0~e6i9nwvxzzi.js",
  "/_next/static/chunks/11vlk_b7odc0i.js",
  "/_next/static/chunks/176ztuhghbfr1.js",
  "/_next/static/chunks/turbopack-0ngnbt.drh_yz.js"
];
const EXTRAS = [
  "/manifest.webmanifest",
  "/logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png"
];
const RSC_PAGES = [
  "/?_rsc=offline",
  "/login?_rsc=offline",
  "/offline?_rsc=offline",
  "/install?_rsc=offline",
  "/diagnostics?_rsc=offline",
  "/panel?_rsc=offline",
  "/panel/pharmacies?_rsc=offline",
  "/panel/doctors?_rsc=offline",
  "/panel/orders?_rsc=offline",
  "/panel/trip?_rsc=offline",
  "/panel/home?_rsc=offline",
  "/panel/leaves?_rsc=offline",
  "/panel/notifications?_rsc=offline",
  "/panel/options?_rsc=offline",
  "/panel/reports?_rsc=offline",
  "/admin?_rsc=offline",
  "/admin/activity?_rsc=offline",
  "/admin/records/pharmacies?_rsc=offline",
  "/admin/records/doctors?_rsc=offline",
  "/admin/records/orders?_rsc=offline",
  "/admin/trips?_rsc=offline",
  "/admin/homes?_rsc=offline",
  "/admin/leaves?_rsc=offline",
  "/admin/notifications?_rsc=offline",
  "/admin/reports?_rsc=offline",
  "/admin/options?_rsc=offline",
  "/admin/columns?_rsc=offline",
  "/admin/users?_rsc=offline",
  "/admin/messengers?_rsc=offline",
  "/admin/backup?_rsc=offline"
];
void RSC_PAGES;

/* ---------------- نصب: پیش‌کش کامل ---------------- */
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // فایل‌های حیاتی (JS/CSS) اول — بدون اینها برنامه اجرا نمی‌شود
      await addAll(cache, ASSETS, 6);
      await addAll(cache, PAGES, 4);
      await addAll(cache, EXTRAS, 3);
      const cs = await self.clients.matchAll();
      cs.forEach((c) => c.postMessage({ type: "precache-done", assets: ASSETS.length, pages: PAGES.length }));
    })()
  );
});

async function addAll(cache, urls, concurrency) {
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < urls.length) {
      const url = urls[i++];
      try {
        const res = await fetch(new Request(url, { cache: "reload", credentials: "same-origin" }));
        if (res && (res.ok || res.type === "opaque")) await cache.put(url, res.clone());
      } catch {
        /* بعداً هنگام استفاده کش می‌شود */
      }
    }
  });
  await Promise.all(workers);
}

/* ---------------- فعال‌سازی ---------------- */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch {}
      }
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.endsWith(BUILD)).map((k) => caches.delete(k)));
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

/* ---------------- صف آفلاین ---------------- */
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
      const r = await fetch(it.url, { method: it.method, headers: it.headers, body: it.body, credentials: "include" });
      if (r.ok || (r.status >= 400 && r.status < 500)) {
        await queueDel(it.id);
        if (r.ok) sent++;
      }
    } catch {
      break;
    }
  }
  const rest = await queueAll();
  const cs = await self.clients.matchAll();
  cs.forEach((c) => c.postMessage({ type: "queue-status", pending: rest.length, sent }));
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
  if (e.data === "cache-status")
    e.waitUntil(
      caches.open(SHELL).then(async (c) => {
        const keys = await c.keys();
        const cs = await self.clients.matchAll();
        cs.forEach((x) =>
          x.postMessage({ type: "cache-status", cached: keys.length, expected: ASSETS.length + PAGES.length + EXTRAS.length })
        );
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

  /* نوشتن → صف آفلاین */
  if (req.method !== "GET") {
    if (!url.pathname.startsWith("/api/")) return;
    event.respondWith(
      (async () => {
        try {
          return await fetch(req.clone());
        } catch {
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

  /* درخواست‌های RSC (ناوبری داخلی Next) → شبکه با مهلت، سپس کش
   * بدون این بخش، جابه‌جایی بین صفحات در حالت آفلاین کار نمی‌کند. */
  const isRsc = url.searchParams.has("_rsc") || req.headers.get("RSC") === "1";
  if (isRsc) {
    event.respondWith(
      (async () => {
        try {
          const res = await timeoutFetch(req, NAV_TIMEOUT);
          if (res && res.ok) {
            const c = await caches.open(SHELL);
            c.put(req, res.clone());
          }
          return res;
        } catch {
          const cached = await caches.match(req);
          if (cached) return cached;
          // بدون RSC، Next خودش به ناوبری کامل صفحه برمی‌گردد (که از کش سرو می‌شود)
          return new Response("", { status: 504 });
        }
      })()
    );
    return;
  }

  /* فایل‌های استاتیک Next → کش-اول و همیشگی (نسخه‌دار هستند) */
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        try {
          const res = await timeoutFetch(req, ASSET_TIMEOUT);
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
    return;
  }

  /* API → شبکه با مهلت کوتاه، سپس کش */
  if (url.pathname.startsWith("/api/")) {
    if (
      url.pathname.startsWith("/api/auth/login") ||
      url.pathname.startsWith("/api/auth/logout") ||
      url.pathname.startsWith("/api/auth/forgot") ||
      url.pathname.startsWith("/api/auth/otp") ||
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
            JSON.stringify({
              offline: true,
              rows: [],
              logs: [],
              reps: [],
              error: "ارتباط با سرور برقرار نیست",
            }),
            { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "x-sek-offline": "1" } }
          );
        }
      })()
    );
    return;
  }

  /* ============================================================
   *  ناوبری صفحات → «شبکه-اول» (Network First)
   *
   *  چرا؟ اگر HTML کش‌شده را زودتر برگردانیم، کاربر ممکن است نسخه
   *  قدیمی برنامه را ببیند. پس همیشه اول شبکه امتحان می‌شود؛
   *  فقط اگر شبکه در دسترس نبود، پوسته اپ از کش برمی‌گردد تا
   *  برنامه آفلاین هم کامل بالا بیاید (نه صفحه بن‌بست).
   * ============================================================ */
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        // ❶ تلاش برای شبکه با مهلت کوتاه
        try {
          const preload = await event.preloadResponse;
          const res = preload || (await timeoutFetch(new Request(req, { cache: "no-store" }), NAV_TIMEOUT));
          if (res && res.ok) {
            const c = await caches.open(SHELL);
            c.put(url.pathname, res.clone()); // فقط به‌عنوان پشتیبان آفلاین
            return res;
          }
          if (res) return res; // خطای واقعی سرور (۴۰۴/۵۰۰) را همان‌طور نشان بده
        } catch {
          /* شبکه در دسترس نیست → ادامه به کش */
        }

        // ❷ آفلاین: همان صفحه از کش (برنامه کامل کار می‌کند)
        const cachedPage =
          (await caches.match(url.pathname, { ignoreSearch: true })) ||
          (await caches.match(req, { ignoreSearch: true }));
        if (cachedPage) return offlineFlagged(cachedPage);

        // ❸ اگر آن صفحه کش نشده، پوسته اپ را بده تا مسیریابی سمت کلاینت ادامه یابد
        const shell =
          (await caches.match("/panel")) || (await caches.match("/")) || (await caches.match("/login"));
        if (shell) return offlineFlagged(shell);

        // ❹ آخرین راه: صفحه راهنمای آفلاین
        return (
          (await caches.match("/offline")) ||
          new Response(
            "<html dir=rtl><meta charset=utf-8><body style='font-family:Tahoma;text-align:center;padding:40px'>" +
              "<h2>ارتباط با سرور برقرار نیست</h2><p>لطفاً اتصال اینترنت خود را بررسی کنید.</p>" +
              "<button onclick='location.reload()' style='padding:10px 24px;border-radius:10px;background:#0f766e;color:#fff;border:0'>تلاش مجدد</button>" +
              "</body></html>",
            { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
          )
        );
      })()
    );
    return;
  }

  /* سایر منابع → کش-اول */
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await timeoutFetch(req, ASSET_TIMEOUT);
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
