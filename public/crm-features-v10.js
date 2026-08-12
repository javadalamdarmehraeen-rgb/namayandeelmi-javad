// v10 — ورود جدا، ویجت داشبورد، تارگت، عیب‌یابی تصویری، افزودن لحظه‌ای، پنهان‌سازی دسترسی
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function ensure() {
    if (!window.state) return;
    if (!state.settings) state.settings = {};
    if (!state.settings.dashWidgets) {
      state.settings.dashWidgets = ["stats", "salesBar", "visitPie", "orders", "leaves"];
    }
  }

  function keepAlive() {
    const ping = function () {
      fetch("/api/health").then(function (r) { return r.json(); }).then(function (j) {
        window.__lastHealth = j;
        var el = $("globalOnlineStatusBadge");
        if (el) { el.textContent = "🟢 آنلاین"; el.style.background = "#10b981"; }
      }).catch(function () {
        var el = $("globalOnlineStatusBadge");
        if (el) { el.textContent = "🔴 آفلاین / صف محلی"; el.style.background = "#ef4444"; }
      });
    };
    ping();
    setInterval(ping, 4 * 60 * 1000);
  }

  function applySessionUser() {
    var name = sessionStorage.getItem("crmUserName");
    var role = sessionStorage.getItem("crmUserRole");
    if (name) {
      try { currentUserName = name; } catch (e) {}
      var lab = $("currentUserRoleLabel");
      if (lab) lab.textContent = role + " — " + name;
    }
    if (role && role.indexOf("نماینده") !== -1) {
      document.querySelectorAll(".nav-item, .side-menu-item").forEach(function (b) {
        var t = b.getAttribute("data-target") || b.getAttribute("data-side-target") || "";
        if (t === "tab-users-permissions" || t === "tab-messengers" || t === "tab-backup") {
          b.style.display = "none";
        }
      });
    }
  }

  function setupInstantAdd() {
    ["pharmacyName", "pharmacyManager", "doctorName", "doctorSpecialty", "orderPharmacyName", "productName", "productCategory"].forEach(function (id) {
      var el = $(id);
      if (!el || el.dataset.fly === "1") return;
      el.dataset.fly = "1";
      var listId = id + "FlyList";
      if (!document.getElementById(listId)) {
        var dl = document.createElement("datalist");
        dl.id = listId;
        el.setAttribute("list", listId);
        el.parentNode.appendChild(dl);
      }
      var fill = function () {
        var dl = document.getElementById(listId);
        if (!dl || !state) return;
        var vals = [];
        if (id.indexOf("pharmacyName") === 0 || id === "orderPharmacyName") vals = (state.pharmacies || []).map(function (p) { return p.name; });
        else if (id === "doctorName") vals = (state.doctors || []).map(function (d) { return d.name; });
        else if (id === "doctorSpecialty") vals = (state.doctors || []).map(function (d) { return d.specialty; });
        else if (id === "productName") vals = (state.products || []).map(function (p) { return p.name; });
        else if (id === "productCategory") vals = (state.products || []).map(function (p) { return p.category; });
        else if (id === "pharmacyManager") vals = (state.pharmacies || []).map(function (p) { return p.manager; }).filter(Boolean);
        dl.innerHTML = "";
        vals.filter(function (v, i, a) { return v && a.indexOf(v) === i; }).forEach(function (v) {
          var o = document.createElement("option");
          o.value = v;
          dl.appendChild(o);
        });
      };
      el.addEventListener("focus", fill);
      el.addEventListener("blur", function () {
        if (el.value.trim()) fill();
      });
    });
  }

  var WIDGET_DEFS = [
    { id: "stats", title: "آمار کلی کارت‌ها" },
    { id: "salesBar", title: "نمودار میله‌ای فروش نمایندگان" },
    { id: "visitPie", title: "نمودار دایره‌ای ویزیت" },
    { id: "orders", title: "سفارشات اخیر" },
    { id: "leaves", title: "مرخصی‌های جاری" },
    { id: "activity", title: "فعالیت لحظه‌ای" }
  ];

  function renderWidgetPicker() {
    var box = $("dashboardWidgetPicker");
    if (!box || !state) return;
    var on = state.settings.dashWidgets || [];
    box.innerHTML = WIDGET_DEFS.map(function (w) {
      var chk = on.indexOf(w.id) !== -1 ? "checked" : "";
      return '<label class="widget-chip"><input type="checkbox" data-w="' + w.id + '" ' + chk + '> ' + w.title + "</label>";
    }).join("");
    box.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var id = inp.getAttribute("data-w");
        var arr = state.settings.dashWidgets.slice();
        if (inp.checked && arr.indexOf(id) === -1) arr.push(id);
        if (!inp.checked) arr = arr.filter(function (x) { return x !== id; });
        state.settings.dashWidgets = arr;
        if (typeof saveState === "function") saveState(false);
        renderDashWidgets();
      });
    });
    var addBtn = $("btnAddDashWidget");
    if (addBtn && !addBtn.dataset.b) {
      addBtn.dataset.b = "1";
      addBtn.addEventListener("click", function () {
        alert("گزارش‌ها را از چک‌لیست بالا تیک بزنید یا بردارید.");
      });
    }
  }

  function barHtml(items) {
    var max = 1;
    items.forEach(function (it) { if (it.v > max) max = it.v; });
    return '<div class="mini-bars">' + items.map(function (it) {
      var h = Math.max(8, Math.round((it.v / max) * 110));
      return '<div class="mini-bar"><div class="mini-bar-fill" style="height:' + h + 'px"></div><span>' + it.l + "</span></div>";
    }).join("") + "</div>";
  }

  function renderDashWidgets() {
    var host = $("dashboardWidgetsHost");
    if (!host || !state) return;
    var on = state.settings.dashWidgets || [];
    var html = "";
    if (on.indexOf("salesBar") !== -1) {
      var sales = (state.reps || []).map(function (r) {
        var sum = (state.orders || []).filter(function (o) { return o.repName === r.name; }).reduce(function (s, o) { return s + (o.totalAmount || 0); }, 0);
        return { l: r.name.split(" ")[0], v: sum || 1 };
      });
      html += '<div class="card"><div class="card-header"><div class="card-title">📊 فروش نمایندگان</div></div>' + barHtml(sales) + "</div>";
    }
    if (on.indexOf("visitPie") !== -1) {
      var ph = (state.pharmacies || []).length;
      var doc = (state.doctors || []).length;
      var tot = Math.max(1, ph + doc);
      var a = Math.round((ph / tot) * 100);
      html += '<div class="card"><div class="card-header"><div class="card-title">🥧 نسبت مراکز</div></div><div class="pie-row"><div class="pie" style="background:conic-gradient(#0d9488 0 ' + a + '%,#2563eb ' + a + '% 100%)"></div><div>داروخانه ' + ph + ' / پزشک ' + doc + "</div></div></div>";
    }
    if (on.indexOf("orders") !== -1) {
      html += '<div class="card"><div class="card-header"><div class="card-title">📦 سفارشات اخیر</div></div><ul class="plain-list">' +
        (state.orders || []).slice(0, 5).map(function (o) {
          return "<li>" + o.pharmacyName + " — " + Number(o.totalAmount || 0).toLocaleString("fa-IR") + " ریال</li>";
        }).join("") + "</ul></div>";
    }
    if (on.indexOf("leaves") !== -1) {
      html += '<div class="card"><div class="card-header"><div class="card-title">📝 مرخصی جاری</div></div><ul class="plain-list">' +
        (state.leaves || []).map(function (l) { return "<li>" + l.repName + " (" + (l.status || "") + ")</li>"; }).join("") + "</ul></div>";
    }
    if (on.indexOf("activity") !== -1) {
      html += '<div class="card"><div class="card-header"><div class="card-title">⏱️ فعالیت</div></div><ul class="plain-list">' +
        (state.activityLog || []).slice(0, 6).map(function (a) { return "<li>" + a.repName + " — " + a.action + "</li>"; }).join("") + "</ul></div>";
    }
    host.innerHTML = html;
    var builtIn = $("dashboardChartsWidget");
    if (builtIn) builtIn.style.display = on.indexOf("salesBar") !== -1 ? "" : "none";
  }

  function enhanceSalesTargets() {
    var year = $("tgtYearInput");
    if (year && year.tagName === "INPUT") {
      var sel = document.createElement("select");
      sel.id = "tgtYearInput";
      sel.className = "form-select";
      ["1403", "1404", "1405", "1406", "1407"].forEach(function (y) {
        var o = document.createElement("option");
        o.value = y; o.textContent = y;
        if (y === "1405") o.selected = true;
        sel.appendChild(o);
      });
      year.parentNode.replaceChild(sel, year);
    }
    var prod = $("tgtProductSelect");
    var cnt = $("tgtCountInput");
    if (prod && cnt) {
      var recalc = function () {
        var p = (state.products || []).find(function (x) { return x.name === prod.value; });
        var n = parseInt(cnt.value, 10) || 0;
        var d = n * (p ? (p.distributorPrice || p.price || 40000) : 0);
        var h = n * (p ? (p.pharmacyPrice || p.price || 45000) : 0);
        if ($("tgtCalcDistPrice")) $("tgtCalcDistPrice").textContent = d.toLocaleString("fa-IR") + " ریال";
        if ($("tgtCalcPhPrice")) $("tgtCalcPhPrice").textContent = h.toLocaleString("fa-IR") + " ریال";
      };
      prod.addEventListener("change", recalc);
      cnt.addEventListener("input", recalc);
    }
    renderTgtSummary();
  }

  function renderTgtSummary() {
    var box = $("tgtSummaryBox");
    if (!box || !state) return;
    var map = {};
    (state.salesTargets || []).forEach(function (t) {
      if (!map[t.repName]) map[t.repName] = { t: 0, a: 0 };
      map[t.repName].t += t.targetAmount || 0;
      map[t.repName].a += t.achievedAmount || 0;
    });
    box.innerHTML = "<h4>گزارش تجمیعی نمایندگان</h4>" + Object.keys(map).map(function (n) {
      var x = map[n];
      var p = x.t ? Math.round(x.a / x.t * 100) : 0;
      return "<div>" + n + " — هدف " + x.t.toLocaleString("fa-IR") + " / تحقق " + x.a.toLocaleString("fa-IR") + " (" + p + "٪)</div>";
    }).join("") || "<div>هنوز تارگتی ثبت نشده.</div>";
  }

  function renderDiagnostics() {
    var box = $("diagnosticsVisual");
    var st = $("diagnosticsStatusBox");
    if (!box) return;
    var rows = [
      ["مرورگر آنلاین", navigator.onLine],
      ["ورود نشست", sessionStorage.getItem("crmLoggedIn") === "1"],
      ["Leaflet", typeof L !== "undefined"],
      ["حافظه محلی", !!localStorage.getItem("CRM_APP_STATE_V2")],
      ["Service Worker", "serviceWorker" in navigator],
      ["تعداد داروخانه", (state && state.pharmacies || []).length],
      ["تعداد پزشک", (state && state.doctors || []).length],
      ["مراکز مرجع ایران", (window.IRAN_FACILITIES || []).length]
    ];
    box.innerHTML = rows.map(function (r) {
      var ok = r[1] === true || (typeof r[1] === "number" && r[1] >= 0);
      return '<div class="diag-row"><span class="diag-dot ' + (r[1] ? "ok" : "bad") + '"></span><strong>' + r[0] + "</strong><span>" + r[1] + "</span></div>";
    }).join("");
    fetch("/api/health").then(function (r) { return r.json(); }).then(function (j) {
      if (st) { st.style.background = "#f0fdf4"; st.style.color = "#166534"; st.textContent = "سرور سالم است — نسخه " + (j.version || "") + " — " + j.timestamp; }
      box.innerHTML += '<div class="diag-row"><span class="diag-dot ok"></span><strong>سلامت سرور</strong><span>' + (j.status || "ok") + "</span></div>";
    }).catch(function () {
      if (st) { st.style.background = "#fef2f2"; st.style.color = "#b91c1c"; st.textContent = "سرور پاسخ نداد. کار آفلاین روی حافظه محلی ادامه دارد."; }
    });
  }

  function mergeFacilitiesIntoSearch() {
    if (!window.IRAN_FACILITIES || !state) return;
    if (!state.hospitals) state.hospitals = [];
    window.IRAN_FACILITIES.filter(function (f) { return f.kind === "بیمارستان" || f.kind === "درمانگاه"; }).forEach(function (f) {
      if (!state.hospitals.some(function (h) { return h.name === f.name; })) {
        state.hospitals.push({
          id: "fac-" + f.name, name: f.name, type: f.kind, specialty: f.specialty,
          province: f.province, city: f.city, district: f.district, address: f.address,
          lat: f.lat, lng: f.lng, hours: f.hours
        });
      }
    });
  }

  function forceListsVisible() {
    ["cardPhForm", "cardPhList", "cardDocForm", "cardDocList", "cardOrdForm", "cardOrdList"].forEach(function (id) {
      var el = $(id);
      if (el) el.style.setProperty("display", "block", "important");
    });
  }

  function boot() {
    try { ensure(); } catch (e) {}
    try { keepAlive(); } catch (e) {}
    try { applySessionUser(); } catch (e) {}
    try { setupInstantAdd(); } catch (e) {}
    try { renderWidgetPicker(); renderDashWidgets(); } catch (e) {}
    try { enhanceSalesTargets(); } catch (e) {}
    try { renderDiagnostics(); } catch (e) {}
    try { mergeFacilitiesIntoSearch(); } catch (e) {}
    try { forceListsVisible(); } catch (e) {}
    var orig = window.switchTab;
    if (typeof orig === "function") {
      window.switchTab = function (id) {
        orig(id);
        setTimeout(function () {
          forceListsVisible();
          if (id === "tab-troubleshooting") renderDiagnostics();
          if (id === "tab-sales-targets") renderTgtSummary();
          if (id === "tab-dashboard") renderDashWidgets();
        }, 80);
      };
    }
    console.log("v10 ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
