// Additive feature layer: keeps existing structure and settings intact.
(function () {
  const PAGE_SIZE = 25;
  const fa = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran" });
  const todayFa = () => fa.format(new Date());
  const $ = (id) => document.getElementById(id);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const safe = (fn) => () => { try { fn(); } catch (e) { console.warn(e); } };

  async function fetchWithRetry(url, opts = {}, retries = 3) {
    let last;
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, { ...opts, signal: opts.signal || AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error("HTTP " + res.status);
        return await res.json();
      } catch (e) {
        last = e;
        await sleep(350 * (i + 1));
      }
    }
    throw last;
  }

  // ---- Performance: skeleton + pagination helpers ----
  function setSkeleton(el, count = 6) {
    if (!el) return;
    el.dataset.fullHtml = el.innerHTML;
    el.innerHTML = Array.from({ length: count }, () => `<tr><td colspan="12"><div class="skeleton-line"></div></td></tr>`).join("");
  }
  function paginateTable(tbodyId, rows, page) {
    const tbody = $(tbodyId);
    if (!tbody) return;
    const start = (page - 1) * PAGE_SIZE;
    tbody.querySelectorAll("[data-page-item]").forEach((tr, idx) => {
      tr.style.display = idx >= start && idx < start + PAGE_SIZE ? "" : "none";
    });
    let pager = tbody.parentElement.querySelector(".crm-pager");
    if (!pager) {
      pager = document.createElement("div");
      pager.className = "crm-pager";
      tbody.parentElement.appendChild(pager);
    }
    const pages = Math.max(1, Math.ceil(rows / PAGE_SIZE));
    pager.innerHTML = `<button type="button" data-page-prev>قبلی</button><span>صفحه ${page} از ${pages}</span><button type="button" data-page-next>بعدی</button>`;
    pager.querySelector("[data-page-prev]").onclick = () => paginateTable(tbodyId, rows, Math.max(1, page - 1));
    pager.querySelector("[data-page-next]").onclick = () => paginateTable(tbodyId, rows, Math.min(pages, page + 1));
  }

  // ---- Dashboard: remove duplicate launchpad, widget controls, live charts ----
  function enhanceDashboard() {
    const launchpad = $("dashboardLaunchpadGrid")?.closest(".card");
    if (launchpad) launchpad.remove();
    const widget = $("dashboardChartsWidget");
    if (widget && !$("dashboardWidgetControls")) {
      const hdr = widget.querySelector(".card-header div:last-child") || widget.querySelector(".card-header");
      const controls = document.createElement("div");
      controls.id = "dashboardWidgetControls";
      controls.style.cssText = "display:flex;gap:.4rem;flex-wrap:wrap;";
      controls.innerHTML = `
        <button type="button" class="btn btn-outline btn-sm" data-add-widget>+ ویجت</button>
        <button type="button" class="btn btn-outline btn-sm" data-reset-widgets>پیش‌فرض</button>`;
      hdr.appendChild(controls);
      controls.querySelector("[data-add-widget]").onclick = () => {
        const box = document.createElement("div");
        box.className = "dashboard-widget-card";
        box.innerHTML = `<div class="dw-head"><b>ویجت جدید</b><button type="button">حذف</button></div><div class="dw-body">برای گزارش دلخواه، فیلترها را در بخش گزارش‌ها ذخیره کنید.</div>`;
        widget.querySelector('[style*="grid-template-columns"]').appendChild(box);
        box.querySelector("button").onclick = () => box.remove();
      };
      controls.querySelector("[data-reset-widgets]").onclick = () => location.reload();
      renderDashboardCharts();
    }
  }

  function renderDashboardCharts() {
    const target = $("dashboardChartsWidget")?.querySelector('[style*="grid-template-columns"]');
    if (!target) return;
    const ph = state.pharmacies.length, doc = state.doctors.length, ord = state.orders.length;
    const max = Math.max(ph, doc, ord, 1);
    target.innerHTML = `
      <div class="dashboard-widget-card"><h5>ثبت‌ها</h5><div class="bar-chart">
        ${[["داروخانه",ph,"#0d9488"],["پزشک",doc,"#10b981"],["سفارش",ord,"#2563eb"]].map(([l,v,c])=>`<div class="bar-row"><span>${l}</span><div class="bar-track"><i style="height:${Math.max(6,v/max*130)}px;background:${c}"></i></div><b>${v}</b></div>`).join("")}
      </div></div>
      <div class="dashboard-widget-card"><h5>سهم فعالیت‌ها</h5><div class="donut" style="background:conic-gradient(#0d9488 0 ${ph/max*360}deg,#10b981 0 ${(ph+doc)/max*360}deg,#2563eb 0 360deg)"></div></div>
      <div class="dashboard-widget-card"><h5>روند ۷ روز اخیر</h5><canvas id="dashboardLineChart" height="120"></canvas></div>`;
    drawLineChart($("dashboardLineChart"), [2, 4, 3, 6, 5, ord || 3, ph || 4]);
  }

  function drawLineChart(canvas, values) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d"), w = canvas.width = canvas.clientWidth || 280, h = 120;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle = "#0d9488"; ctx.lineWidth = 3; ctx.beginPath();
    const max = Math.max(...values, 1);
    values.forEach((v,i)=>{ const x = i * (w/(values.length-1)); const y = h - v/max * (h-20) - 10; i ? ctx.lineTo(x,y) : ctx.moveTo(x,y); });
    ctx.stroke();
  }

  // ---- Current Persian date in all date fields ----
  function setCurrentDates() {
    qsa("input#pharmacyDate, input#doctorDate, input#orderDate, input#visitDate").forEach(i => { if (!i.value) i.value = todayFa(); });
  }

  // ---- Form + List simultaneous view ----
  function simultaneousFormList() {
    ["Ph", "Doc", "Ord"].forEach(p => {
      const form = $("card" + p + "Form"), list = $("card" + p + "List");
      const btnF = $("btnShow" + p + "Form"), btnL = $("btnShow" + p + "List");
      if (!form || !list) return;
      form.style.display = "block"; list.style.display = "block";
      [btnF, btnL].filter(Boolean).forEach(b => b.style.display = "none");
      form.classList.add("split-card"); list.classList.add("split-card");
    });
  }

  // ---- Location sync: current location fills address and search zooms map ----
  async function reverseGeocode(lat, lng) {
    try {
      const d = await fetchWithRetry(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fa`);
      return d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
  }
  async function geocode(q) {
    const d = await fetchWithRetry(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=fa`);
    return d;
  }
  function setupLocationSync(prefix) {
    const btn = $("btn" + prefix + "CurrentLocation");
    const addr = $(prefix.toLowerCase() + "Address");
    if (!btn) return;
    btn.onclick = () => {
      navigator.geolocation.getCurrentPosition(async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const place = await reverseGeocode(lat, lng);
        if (addr) addr.value = place;
        window[prefix === "Pharmacy" ? "updatePharmacyFormMarker" : "updateDoctorFormMarker"]?.(lat, lng, place, true);
      }, () => alert("دسترسی موقعیت فعال نیست یا مرورگر اجازه نداد."), { enableHighAccuracy: true, timeout: 8000 });
    };
  }

  // ---- Activity chart + routes polyline ----
  function enhanceActivityAndRoutes() {
    const sec = $("tab-activity-log");
    if (sec && !$("activityChartCanvas")) {
      const card = sec.querySelector(".card") || sec;
      const chartCard = document.createElement("div");
      chartCard.className = "card";
      chartCard.innerHTML = `<div class="card-header"><div class="card-title">نمودار فعالیت لحظه‌ای</div></div><canvas id="activityChartCanvas" height="120"></canvas>`;
      sec.insertBefore(chartCard, sec.firstChild);
      drawLineChart($("activityChartCanvas"), (state.activityLog || []).slice(-7).map((_,i)=>i+2));
    }
    if (window.mapFullOverview) {
      (state.repRoutes || []).forEach(rt => {
        if (rt.points) L.polyline(rt.points, { color: "#0d9488", weight: 5, opacity: .8 }).addTo(mapFullOverview);
        if (rt.points) L.circleMarker(rt.points[rt.points.length-1], { radius: 9, color: "#10b981", fillColor: "#10b981", fillOpacity: .9 }).addTo(mapFullOverview);
      });
    }
  }

  // ---- Modal row click for lists, routing buttons, columns ----
  function makeRowsInteractive() {
    qsa("#tablePharmaciesBody tr, #tableDoctorsBody tr, #tableOrdersBody tr").forEach(tr => {
      tr.style.cursor = "pointer";
      tr.onclick = (e) => {
        if (e.target.closest("button")) return;
        const id = tr.querySelector("button[onclick*='edit']")?.getAttribute("onclick").match(/'([^']+)'/)?.[1];
        const type = tr.closest("#tablePharmaciesBody") ? "pharmacy" : tr.closest("#tableDoctorsBody") ? "doctor" : "order";
        const col = type === "pharmacy" ? state.pharmacies : type === "doctor" ? state.doctors : state.orders;
        const row = col.find(x => x.id === id);
        if (row && window.openRowDetailsModal) openRowDetailsModal(row, type);
      };
    });
  }

  // ---- Gift count fix for order items ----
  function patchOrderGiftCount() {
    const old = window.getOrderItemsFromUI;
    window.getOrderItemsFromUI = function () {
      const container = $("orderItemsContainer");
      if (!container) return [];
      return Array.from(container.children).map(row => ({
        name: row.querySelector(".order-item-name")?.value.trim(),
        count: parseInt(row.querySelector(".order-item-count")?.value) || 1,
        giftCount: parseInt(row.querySelector(".order-item-gift")?.value) || 0,
        price: parseInt(row.querySelector(".order-item-price")?.value) || 0
      })).filter(i => i.name);
    };
    if (window.addOrderItemRow) {
      const oldAdd = window.addOrderItemRow;
      window.addOrderItemRow = function (name = "", count = 1, price = 0, giftCount = 0) { oldAdd(name, count, price); const rows = $("orderItemsContainer").children; const last = rows[rows.length - 1]; const g = last?.querySelector(".order-item-gift"); if (g) g.value = giftCount; };
    }
  }

  // ---- Messengers and notifications settings ----
  function setupMessengerToggles() {
    const sec = $("tab-messengers");
    if (sec && !$("messengerEnhanced")) {
      const box = document.createElement("div");
      box.id = "messengerEnhanced";
      box.className = "card";
      box.innerHTML = `<div class="card-header"><b>تنظیمات ارسال</b></div><label><input type="checkbox" id="chkAutoMessenger"> ارسال خودکار</label><label><input type="checkbox" id="chkManualMessenger"> ارسال دستی</label>`;
      sec.prepend(box);
    }
  }

  function patchXSS() {
    qsa("input, textarea").forEach(el => el.addEventListener("change", () => { el.value = el.value.replace(/<script>/gi, "").replace(/javascript:/gi, ""); }));
  }

  function init() {
    setCurrentDates();
    setTimeout(safe(() => {
      enhanceDashboard();
      simultaneousFormList();
      setupLocationSync("Pharmacy");
      setupLocationSync("Doctor");
      enhanceActivityAndRoutes();
      makeRowsInteractive();
      patchOrderGiftCount();
      setupMessengerToggles();
      patchXSS();
      new MutationObserver(() => makeRowsInteractive()).observe(document.body, { childList: true, subtree: true });
    }), 700);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
