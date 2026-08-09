/* ============================================================
 *  سرویس‌ورکر «ثبت اطلاعات کل» — نسخه ۹ (آفلاین کامل)
 *
 *  نکته کلیدی: علاوه بر صفحات HTML، *همه فایل‌های جاوااسکریپت و CSS*
 *  برنامه هم پیش‌کش می‌شوند. بدون این کار، روی اینترنت موبایل صفحه
 *  باز می‌شد ولی چانک‌های JS تایم‌اوت می‌کردند و صفحه سفید می‌ماند.
 *  این فایل توسط scripts/build-sw.mjs پس از هر build تولید می‌شود.
 * ============================================================ */

const BUILD = "msmdifhz-48";
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
  "/panel/map",
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
  "/admin/map",
  "/admin/live",
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
  "/_next/static/chunks/0.f8o6x69lldq.js",
  "/_next/static/chunks/01xlw8hd842-c.js",
  "/_next/static/chunks/01yarxs5j9-pm.js",
  "/_next/static/chunks/025h39a4hxy-7.js",
  "/_next/static/chunks/02a3un8vt.4z0.js",
  "/_next/static/chunks/02es.zsatljwd.js",
  "/_next/static/chunks/03h9eo09svijh.js",
  "/_next/static/chunks/03~yq9q893hmn.js",
  "/_next/static/chunks/04zs0174xt4cf.js",
  "/_next/static/chunks/06in8m2ln4m7x.js",
  "/_next/static/chunks/06r9_3ub2r-4z.js",
  "/_next/static/chunks/07lhk_q6pmm3r.js",
  "/_next/static/chunks/07uz2g0_38qia.js",
  "/_next/static/chunks/08.gvqj-o7ww6.js",
  "/_next/static/chunks/09pnscjn-jklc.js",
  "/_next/static/chunks/09u-zy9mfz~2_.js",
  "/_next/static/chunks/0_uvbkl~ua0pn.js",
  "/_next/static/chunks/0a59dbudyzsi4.js",
  "/_next/static/chunks/0d3shmwh5_nmn.js",
  "/_next/static/chunks/0e8p5l2oiw7kt.js",
  "/_next/static/chunks/0evn0xx7qmz14.js",
  "/_next/static/chunks/0h7njwe2.s3ht.js",
  "/_next/static/chunks/0hoxp6v6.ghn5.js",
  "/_next/static/chunks/0n.0ufr5-u.u3.js",
  "/_next/static/chunks/0n1bpogj.il~n.js",
  "/_next/static/chunks/0o9kx41n71_k~.js",
  "/_next/static/chunks/0oudi9rq3kf0y.js",
  "/_next/static/chunks/0rjm_co8bzrp0.js",
  "/_next/static/chunks/0rz3o0743-gv3.js",
  "/_next/static/chunks/0t48hzs_6fshe.css",
  "/_next/static/chunks/0u~69.dj98a1y.js",
  "/_next/static/chunks/0v4dehhyglgch.js",
  "/_next/static/chunks/0v7ff1k50ig4a.js",
  "/_next/static/chunks/0vy~5p61tj63m.js",
  "/_next/static/chunks/0we42v7.l-4bo.js",
  "/_next/static/chunks/0wxhwo2i~7vvo.js",
  "/_next/static/chunks/0xnf3du~wj5.7.css",
  "/_next/static/chunks/0zafsylz7iub1.js",
  "/_next/static/chunks/0ze4gu236oq96.js",
  "/_next/static/chunks/11bf.0jc0_nuk.js",
  "/_next/static/chunks/11p2tj5w~k_4s.js",
  "/_next/static/chunks/13niyj-yq3tn-.js",
  "/_next/static/chunks/17ij8w.0v9eei.js",
  "/_next/static/chunks/17zu884hptsv9.js",
  "/_next/static/chunks/turbopack-0ngnbt.drh_yz.js",
  "/_next/static/mVg2gUquQcbk3idaW9VXG/_buildManifest.js",
  "/_next/static/mVg2gUquQcbk3idaW9VXG/_clientMiddlewareManifest.js",
  "/_next/static/mVg2gUquQcbk3idaW9VXG/_ssgManifest.js"
];
const EXTRAS = [
  "/manifest.webmanifest",
  "/logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/apple-touch-icon.png",
  "/data/iran-provinces.geojson"
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
  "/panel/map?_rsc=offline",
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
  "/admin/map?_rsc=offline",
  "/admin/live?_rsc=offline",
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

/* ---------------- کلیک روی نوتیفیکیشن ---------------- */
self.addEventListener("notificationclick", (event) => {
  const data = event.notification.data || {};
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // اگر برنامه باز است، همان پنجره را فوکوس کن
      for (const c of all) {
        c.postMessage({ type: "notification-click", id: data.id });
        if ("focus" in c) {
          await c.focus();
          if (data.link) c.navigate?.(data.link);
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(data.link || "/panel/notifications");
    })()
  );
});

/* ---------------- Web Push (در صورت پیکربندی) ---------------- */
self.addEventListener("push", (event) => {
  let payload = { title: "اعلان جدید", body: "", id: 0, link: "/panel/notifications" };
  try {
    payload = { ...payload, ...(event.data ? event.data.json() : {}) };
  } catch {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(`🔔 ${payload.title}`, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      dir: "rtl",
      lang: "fa",
      tag: `sek-${payload.id}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: payload,
    })
  );
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
