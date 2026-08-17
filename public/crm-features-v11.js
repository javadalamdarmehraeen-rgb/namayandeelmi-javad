// v11 — تغییر رمز، ردیف واقعی، اکسل خط‌کشی، ویزیت زنده، تارگت، ستون‌ها، دسترسی ریز
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function logOp(msg) {
    if (!window.state) return;
    if (!state.diagLog) state.diagLog = [];
    var t = new Date().toLocaleString("fa-IR", { timeZone: "Asia/Tehran" });
    state.diagLog.unshift({ t: t, msg: String(msg), user: (typeof currentUserName === "string" ? currentUserName : "سیستم") });
    if (state.diagLog.length > 200) state.diagLog.length = 200;
    try { localStorage.setItem("CRM_DIAG_LOG", JSON.stringify(state.diagLog)); } catch (e) {}
  }

  function persistUsersToAuth() {
    try {
      var map = {};
      (state.users || []).forEach(function (u) {
        map[u.username] = { password: u.password, phone: u.phone, name: u.fullName, role: u.role, id: u.id };
      });
      localStorage.setItem("CRM_USERS_AUTH", JSON.stringify(map));
    } catch (e) {}
  }

  window.changeUserPassword = function (userId) {
    var u = (state.users || []).find(function (x) { return x.id === userId; });
    if (!u) return;
    var cur = prompt("رمز فعلی «" + u.fullName + "» را وارد کنید:");
    if (cur === null) return;
    if (cur !== u.password) { alert("رمز فعلی نادرست است."); return; }
    var nw = prompt("رمز عبور جدید:");
    if (!nw || !String(nw).trim()) { alert("رمز جدید خالی است."); return; }
    var nw2 = prompt("تکرار رمز جدید:");
    if (nw !== nw2) { alert("دو رمز جدید یکسان نیستند."); return; }
    u.password = String(nw).trim();
    saveState();
    persistUsersToAuth();
    logOp("تغییر رمز کاربر " + u.username);
    if (typeof renderUserCardsList === "function") renderUserCardsList();
    alert("رمز «" + u.fullName + "» در سیستم اصلی ذخیره شد. از ورود بعدی همین رمز معتبر است.");
  };

  function patchUserCardsWithPasswordChange() {
    if (typeof renderUserCardsList !== "function") return;
    var orig = renderUserCardsList;
    window.renderUserCardsList = function () {
      orig();
      var cards = document.querySelectorAll("#userCardsContainer > div");
      (state.users || []).forEach(function (u, i) {
        var card = cards[i];
        if (!card || card.querySelector(".btn-change-pass")) return;
        var row = card.querySelector("div[style*='f8fafc']") || card.lastElementChild;
        if (!row) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-primary btn-sm btn-change-pass";
        btn.style.background = "#0d9488";
        btn.textContent = "🔑 تغییر رمز عبور";
        btn.addEventListener("click", function () { changeUserPassword(u.id); });
        var holder = row.querySelector("div") || row;
        holder.appendChild(btn);
      });
    };
    renderUserCardsList();
  }

  function gregorianNow() {
    if (window.CRMJalali && typeof window.CRMJalali.gregorianBadge === "function") {
      var gb = window.CRMJalali.gregorianBadge();
      return { m: gb.mon, d: gb.day };
    }
    var GMON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", month: "numeric", day: "numeric" }).formatToParts(new Date());
    var mi = 8, d = "13";
    parts.forEach(function (p) {
      if (p.type === "month") mi = parseInt(p.value, 10);
      if (p.type === "day") d = String(parseInt(p.value, 10));
    });
    return { m: GMON[mi - 1] || "AUG", d: d };
  }

  function refreshAllDateBadges() {
    var g = gregorianNow();
    document.querySelectorAll(".jalali-badge-header").forEach(function (el) { el.textContent = g.m; });
    document.querySelectorAll(".jalali-badge-day").forEach(function (el) { el.textContent = g.d; });
  }

  function setupInstantAddAll() {
    document.querySelectorAll("input.form-input[type='text'], input.form-input:not([type])").forEach(function (el) {
      if (el.dataset.flyAll === "1") return;
      if (el.id && /Date|Lat|Lng|Phone|password|Password|username|Username/.test(el.id)) return;
      el.dataset.flyAll = "1";
      var listId = (el.id || ("fly" + Math.random().toString(36).slice(2))) + "AllList";
      if (!document.getElementById(listId)) {
        var dl = document.createElement("datalist");
        dl.id = listId;
        el.setAttribute("list", listId);
        el.parentNode.appendChild(dl);
      }
      el.addEventListener("blur", function () {
        var v = el.value.trim();
        if (!v) return;
        var dl = document.getElementById(listId);
        if (!dl) return;
        var exists = false;
        Array.prototype.forEach.call(dl.options, function (o) { if (o.value === v) exists = true; });
        if (!exists) {
          var o = document.createElement("option");
          o.value = v;
          dl.appendChild(o);
        }
        if (!state.typedOptions) state.typedOptions = {};
        var key = el.id || "misc";
        if (!state.typedOptions[key]) state.typedOptions[key] = [];
        if (state.typedOptions[key].indexOf(v) === -1) state.typedOptions[key].push(v);
        try { saveState(false); } catch (e) {}
      });
      el.addEventListener("focus", function () {
        var dl = document.getElementById(listId);
        if (!dl || !state || !state.typedOptions) return;
        var arr = state.typedOptions[el.id] || [];
        dl.innerHTML = "";
        arr.forEach(function (v) {
          var o = document.createElement("option");
          o.value = v;
          dl.appendChild(o);
        });
      });
    });
  }

  function realRowLists() {
    function numberTable(tbodyId) {
      var tb = $(tbodyId);
      if (!tb) return;
      Array.prototype.forEach.call(tb.rows, function (tr, i) {
        if (tr.cells[0]) tr.cells[0].textContent = String(i + 1);
      });
    }
    numberTable("tablePharmaciesBody");
    numberTable("tableDoctorsBody");
    numberTable("tableOrdersBody");
  }

  function downloadExcelBordered(filename, headers, rows) {
    var esc = function (v) {
      return String(v == null ? "" : v)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body>';
    html += '<table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;border:1px solid #000">';
    html += "<tr>" + headers.map(function (h) {
      return '<th style="border:1px solid #000;background:#0d9488;color:#fff">' + esc(h) + "</th>";
    }).join("") + "</tr>";
    rows.forEach(function (r) {
      html += "<tr>" + r.map(function (c) {
        return '<td style="border:1px solid #000">' + esc(c) + "</td>";
      }).join("") + "</tr>";
    });
    html += "</table></body></html>";
    var blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename.replace(/\.csv$/i, ".xls");
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function patchExcel() {
    if (typeof downloadCSVFile !== "function") return;
    var orig = downloadCSVFile;
    window.downloadCSVFile = function (filename, headers, rows) {
      var hdrs = headers.slice();
      var rws = rows.map(function (r) { return r.slice(); });
      if (hdrs[0] !== "ردیف") {
        hdrs = ["ردیف"].concat(hdrs);
        rws = rws.map(function (r, i) { return [i + 1].concat(r); });
      }
      // قانون سراسری اکسل: ستون اول «ردیف» و ستون دوم «نام نماینده» باشد.
      var repAt = hdrs.findIndex(function (h) { return /نام نماینده|نماینده علمی|نماینده/.test(String(h)); });
      if (repAt < 0) {
        hdrs.splice(1, 0, "نام نماینده");
        rws = rws.map(function (r) { var x = r.slice(); x.splice(1, 0, (typeof currentUserName === "string" ? currentUserName : "—")); return x; });
      } else if (repAt !== 1) {
        var repHeader = hdrs.splice(repAt, 1)[0]; hdrs.splice(1, 0, repHeader);
        rws = rws.map(function (r) { var x = r.slice(), v = x.splice(repAt, 1)[0]; x.splice(1, 0, v); return x; });
      }
      // فقط یک فایل اکسل دریافت شود؛ اجرای orig قبلاً همان گزارش را دوباره با پسوند CSV دانلود می‌کرد.
      downloadExcelBordered(filename, hdrs, rws);
    };
  }

  var visitWatchId = null;
  var visitSession = null;

  function lastKnownFix() {
    try { return JSON.parse(localStorage.getItem("CRM_LAST_GPS") || "null"); } catch (e) { return null; }
  }
  function saveLastFix(lat, lng, acc) {
    try { localStorage.setItem("CRM_LAST_GPS", JSON.stringify({ lat: lat, lng: lng, acc: acc, t: Date.now() })); } catch (e) {}
  }

  function startVisitTracking() {
    if (!state) return;
    if (!state.visitTracks) state.visitTracks = [];
    var name = (typeof currentUserName === "string" && currentUserName) ? currentUserName : "نماینده";
    visitSession = {
      id: "vt-" + Date.now(),
      repName: name,
      startTime: new Date().toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" }),
      endTime: "",
      points: [],
      stops: [],
      active: true
    };
    state.visitTracks.push(visitSession);
    saveState();
    logOp("شروع ویزیت " + name);
    var lastStopAt = Date.now();
    var lastLat = null, lastLng = null;
    var pushPoint = function (lat, lng, acc, source) {
      if (!visitSession || !visitSession.active) return;
      var pt = { lat: Number(lat), lng: Number(lng), acc: acc || 0, t: Date.now(), source: source || "gps" };
      visitSession.points.push(pt);
      saveLastFix(pt.lat, pt.lng, pt.acc);
      if (lastLat != null) {
        var d = Math.hypot(pt.lat - lastLat, pt.lng - lastLng);
        if (d < 0.00015 && Date.now() - lastStopAt > 45000) {
          visitSession.stops.push({ lat: pt.lat, lng: pt.lng, time: new Date().toLocaleTimeString("fa-IR"), name: "توقف" });
          lastStopAt = Date.now();
        }
      }
      lastLat = pt.lat; lastLng = pt.lng;
      saveState(false);
      drawVisitOnMaps();
      updateVisitUi();
    };
    if (navigator.geolocation) {
      visitWatchId = navigator.geolocation.watchPosition(
        function (pos) { pushPoint(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, "gps"); },
        function () {
          var lk = lastKnownFix();
          if (lk) pushPoint(lk.lat, lk.lng, lk.acc, "last-known");
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 }
      );
    }
    if (window._visitKeepAlive) clearInterval(window._visitKeepAlive);
    window._visitKeepAlive = setInterval(function () {
      if (!visitSession || !visitSession.active) return;
      var lk = lastKnownFix();
      if (lk) pushPoint(lk.lat, lk.lng, lk.acc, "hold");
    }, 20000);
    updateVisitUi();
    alert("ویزیت شروع شد. مسیر حتی در نقطه کور با آخرین موقعیت معتبر ادامه می‌یابد تا پایان ویزیت.");
  }

  function stopVisitTracking() {
    if (visitWatchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(visitWatchId);
      visitWatchId = null;
    }
    if (window._visitKeepAlive) { clearInterval(window._visitKeepAlive); window._visitKeepAlive = null; }
    if (visitSession) {
      visitSession.active = false;
      visitSession.endTime = new Date().toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran" });
      saveState();
      logOp("پایان ویزیت " + visitSession.repName + " — " + (visitSession.points || []).length + " نقطه");
    }
    updateVisitUi();
    drawVisitOnMaps();
    alert("ویزیت پایان یافت و مسیر در رصد تردد ذخیره شد.");
  }

  function updateVisitUi() {
    var st = $("visitStatusBox");
    if (!st) return;
    if (visitSession && visitSession.active) {
      st.innerHTML = "در حال ویزیت — " + (visitSession.points || []).length + " نقطه ثبت شده از " + visitSession.startTime;
      st.style.background = "#ecfdf5";
    } else if (visitSession) {
      st.innerHTML = "ویزیت قبلی پایان یافت: " + visitSession.startTime + " تا " + visitSession.endTime;
      st.style.background = "#f8fafc";
    } else {
      st.innerHTML = "ویزیتی فعال نیست. برای شروع مسیر دکمه شروع ویزیت را بزنید.";
    }
  }

  var visitMap = null;
  function drawVisitOnMaps() {
    if (typeof L === "undefined") return;
    var el = $("map-my-visit");
    if (el && !visitMap) {
      visitMap = L.map("map-my-visit").setView([35.72, 51.42], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(visitMap);
    }
    if (visitMap && visitSession && visitSession.points.length) {
      if (visitMap._line) visitMap.removeLayer(visitMap._line);
      if (visitMap._marks) visitMap._marks.forEach(function (m) { visitMap.removeLayer(m); });
      visitMap._marks = [];
      var latlngs = visitSession.points.map(function (p) { return [p.lat, p.lng]; });
      visitMap._line = L.polyline(latlngs, { color: "#0d9488", weight: 4 }).addTo(visitMap);
      (visitSession.stops || []).forEach(function (s) {
        var mk = L.circleMarker([s.lat, s.lng], { radius: 7, color: "#ea580c", fillColor: "#ea580c", fillOpacity: 1 }).bindTooltip("توقف " + (s.time || ""));
        mk.addTo(visitMap);
        visitMap._marks.push(mk);
      });
      visitMap.fitBounds(latlngs, { padding: [30, 30] });
    }
  }

  function setupVisitButtons() {
    var b1 = $("btnStartVisit");
    var b2 = $("btnEndVisit");
    if (b1) b1.addEventListener("click", startVisitTracking);
    if (b2) b2.addEventListener("click", stopVisitTracking);
    updateVisitUi();
  }

  function renderActivityMapAndChart() {
    var box = $("activityChartBox");
    if (box && state) {
      var counts = {};
      (state.activityLog || []).forEach(function (a) { counts[a.repName] = (counts[a.repName] || 0) + 1; });
      var max = 1;
      Object.keys(counts).forEach(function (k) { if (counts[k] > max) max = counts[k]; });
      box.innerHTML = Object.keys(counts).map(function (n) {
        var pct = Math.round(counts[n] / max * 100);
        return '<div class="activity-bar-card"><strong>' + n + "</strong><div>" + counts[n] + ' فعالیت</div><div class="activity-bar-track"><div class="activity-bar-fill" style="width:' + pct + '%"></div></div></div>';
      }).join("") || "<div>فعالیتی نیست</div>";
    }
    var el = $("map-activity-log");
    if (el && typeof L !== "undefined") {
      if (!window._actMap) {
        window._actMap = L.map("map-activity-log").setView([35.72, 51.42], 11);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(window._actMap);
      }
      if (window._actMarks) window._actMarks.forEach(function (m) { window._actMap.removeLayer(m); });
      window._actMarks = [];
      (state.reps || []).forEach(function (r) {
        if (!r.lat) return;
        var m = L.marker([r.lat, r.lng]).bindTooltip(r.name + " — " + (r.currentVisit || ""));
        m.addTo(window._actMap);
        window._actMarks.push(m);
      });
    }
  }

  var COL_TAB_KEYS = {
    "tab-dashboard": "dashboard",
    "tab-pharmacies": "pharmacy",
    "tab-doctors": "doctor",
    "tab-orders": "order",
    "tab-activity-log": "activity",
    "tab-overview-map": "overview",
    "tab-live-location": "live",
    "tab-snapp-corporate": "snapp",
    "tab-search-info": "search",
    "tab-rep-routes": "routes",
    "tab-my-visit": "visit",
    "tab-rep-homes": "homes",
    "tab-leaves": "leave",
    "tab-notifications": "notifications",
    "tab-monthly-reports": "reports",
    "tab-sales-targets": "target",
    "tab-custom-fields": "additions",
    "tab-columns-products": "products",
    "tab-manual-design": "manualdesign",
    "tab-users-permissions": "users",
    "tab-messengers": "messengers",
    "tab-backup": "backup",
    "tab-install-app": "install",
    "tab-troubleshooting": "diagnostics"
  };
  var COL_KNOWN_HOSTS = {
    pharmacy: "pharmacyCustomFieldsContainer",
    doctor: "doctorCustomFieldsContainer",
    order: "orderCustomFieldsContainer"
  };
  var DEFAULT_LIST_ON = {
    pharmacy: ["pharmacyDate", "pharmacyProvince", "pharmacyCity", "pharmacyName", "pharmacyPhone", "pharmacyIsPercentage", "phMapSearchInput"],
    doctor: ["doctorDate", "doctorName", "doctorSpecialty", "doctorProvince", "doctorIsPercentage", "docMapSearchInput"],
    order: ["orderRepName", "orderPharmacyName", "orderProvince", "orderDate", "orderStatus"]
  };
  var KEY_TO_TAB = {};
  Object.keys(COL_TAB_KEYS).forEach(function (tab) { KEY_TO_TAB[COL_TAB_KEYS[tab]] = tab; });

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fieldKeyForTab(tabId) {
    try {
      var ut = ((typeof state !== "undefined" && state && state.userTabs) || []).filter(function (t) {
        return t.id === tabId;
      })[0];
      if (ut && ut.key) return ut.key;
    } catch (e) {}
    return COL_TAB_KEYS[tabId] || String(tabId || "").replace(/^tab-/, "") || "misc";
  }

  function containerIdForKey(key) {
    return COL_KNOWN_HOSTS[key] || ("cfHost-" + key);
  }

  function getFieldList(key) {
    if (typeof state === "undefined" || !state) return [];
    if (!state.customFields) state.customFields = {};
    if (!state.customFields[key]) state.customFields[key] = [];
    return state.customFields[key];
  }

  function sortedFields(key) {
    return getFieldList(key).slice().sort(function (a, b) {
      var ao = a.order == null || a.order === "" ? 999 : Number(a.order);
      var bo = b.order == null || b.order === "" ? 999 : Number(b.order);
      if (ao !== bo) return ao - bo;
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  }

  function ensureMeta(key) {
    if (typeof state === "undefined" || !state) return {};
    if (!state.formFieldMeta) state.formFieldMeta = {};
    if (!state.formFieldMeta[key]) state.formFieldMeta[key] = {};
    return state.formFieldMeta[key];
  }

  function getTabForm(tabId) {
    var pane = $(tabId);
    if (!pane) return null;
    return pane.querySelector("form") || pane.querySelector(".card");
  }

  function getMainGrid(tabId) {
    var form = getTabForm(tabId);
    if (!form) return null;
    var direct = form.querySelector(":scope > .form-grid");
    if (direct) return direct;
    var pane = $(tabId);
    if (pane) {
      var card = pane.querySelector(".card");
      if (card) {
        var g = card.querySelector(":scope > form > .form-grid") || card.querySelector(":scope > .form-grid");
        if (g) return g;
      }
    }
    return form.querySelector(".form-grid");
  }

  function ensureFieldHost(tabId, key) {
    var cid = containerIdForKey(key);
    if ($(cid)) return cid;
    var pane = $(tabId);
    if (!pane) return null;
    var card = pane.querySelector(".card") || pane;
    var form = card.querySelector("form");
    var grid = form && form.querySelector(".form-grid");
    var host = document.createElement("div");
    host.id = cid;
    host.className = "form-group full-width form-grid extra-cf-host";
    host.setAttribute("data-cf-host", key);
    if (grid) grid.appendChild(host);
    else if (form) form.appendChild(host);
    else {
      var header = card.querySelector(".card-header");
      if (header && header.nextSibling) card.insertBefore(host, header.nextSibling);
      else card.appendChild(host);
    }
    return cid;
  }

  function isHostGroup(ch) {
    if (!ch) return false;
    if (ch.id && /CustomFieldsContainer|cfHost-/.test(ch.id)) return true;
    if (ch.classList && ch.classList.contains("extra-cf-host")) return true;
    return false;
  }

  function slugLabel(s) {
    return String(s || "").replace(/\s+/g, "-").replace(/[^\w\u0600-\u06FF\-]/g, "").slice(0, 40) || "field";
  }

  function fieldLabelOf(el, group) {
    if (el && el.id) {
      var lab = group.querySelector('label[for="' + el.id + '"]');
      if (lab) return String(lab.textContent || "").replace(/\s+/g, " ").trim();
    }
    var l = group.querySelector(".form-label, label, h4");
    if (l) return String(l.textContent || "").replace(/\s+/g, " ").trim();
    if (el && el.placeholder) return String(el.placeholder).replace(/\s+/g, " ").trim();
    return (el && el.id) || "فیلد";
  }

  function scanBuiltinFields(tabId) {
    var pane = $(tabId);
    if (!pane) return [];
    var fields = [];
    var seen = {};
    var idx = 0;
    var FA_LABELS = {
      pharmacyLat: "عرض جغرافیایی",
      pharmacyLng: "طول جغرافیایی",
      doctorLat: "عرض جغرافیایی",
      doctorLng: "طول جغرافیایی",
      phFileInput: "فایل داروخانه",
      docFileInput: "فایل پزشک",
      phMapSearchInput: "جستجوی لوکیشن داروخانه",
      docMapSearchInput: "جستجوی لوکیشن مطب",
      pharmacyLocationText: "متن لوکیشن داروخانه",
      doctorLocationText: "متن لوکیشن مطب",
      pharmacyIsPercentage: "داروخانه درصدی",
      doctorIsPercentage: "پزشک درصدی",
      btnSavePharmacy: "ثبت اطلاعات داروخانه",
      btnSaveDoctor: "ثبت اطلاعات پزشک",
      btnSaveOrder: "ثبت و ذخیره سفارش",
      btnResetPharmacyForm: "بازنشانی فرم داروخانه",
      btnResetDoctorForm: "بازنشانی فرم پزشک",
      btnResetOrderForm: "سفارش جدید",
      btnPharmacyCurrentLocation: "موقعیت فعلی داروخانه",
      btnDoctorCurrentLocation: "موقعیت فعلی مطب",
      btnPharmacyGetAddressFromPoint: "دریافت آدرس این نقطه",
      btnDoctorGetAddressFromPoint: "دریافت آدرس این نقطه",
      btnPhMapSearch: "جستجوی نقشه داروخانه",
      btnDocMapSearch: "جستجوی نقشه مطب",
      btnPhPercentageNo: "درصدی: خیر",
      btnPhPercentageYes: "درصدی: بله",
      btnDocPercentageNo: "درصدی: خیر",
      btnDocPercentageYes: "درصدی: بله",
      btnShowPhForm: "فرم ثبت داروخانه",
      btnShowPhList: "لیست داروخانه‌ها",
      btnShowDocForm: "فرم ثبت پزشک",
      btnShowDocList: "لیست پزشکان",
      btnShowOrdForm: "فرم ثبت سفارش",
      btnShowOrdList: "لیست سفارشات",
      btnExportPharmaciesCSV: "خروجی اکسل داروخانه‌ها",
      btnExportDoctorsCSV: "خروجی اکسل پزشکان",
      btnExportOrdersCSV: "خروجی اکسل سفارشات",
      btnAddOrderItemRow: "افزودن قلم دارویی",
      "map-pharmacy-form": "نقشه داروخانه",
      "map-doctor-form": "نقشه مطب",
      "map-dashboard-overview": "نقشه داشبورد",
      "map-full-overview": "نقشه جامع",
      "map-live-reps": "نقشه موقعیت زنده",
      "map-my-visit": "نقشه ویزیت",
      "map-search-info": "نقشه جستجو",
      "map-rep-routes-full": "نقشه رصد تردد",
      "map-rep-homes": "نقشه منزل نمایندگان",
      "map-activity-log": "نقشه فعالیت",
      searchPharmacyInput: "جستجوی داروخانه",
      searchDoctorInput: "جستجوی پزشک",
      searchOrderInput: "جستجوی سفارش",
      phMonthFilter: "فیلتر ماه داروخانه",
      pharmacyEditId: "شناسه ویرایش داروخانه",
      doctorEditId: "شناسه ویرایش پزشک",
      orderEditId: "شناسه ویرایش سفارش",
      orderPharmacyMatchedId: "شناسه داروخانه سفارش"
    };
    window.FA_FIELD_LABELS = FA_LABELS;
    function pushField(id, labelText, type, group, full, kind) {
      if (!id || seen[id]) return;
      seen[id] = true;
      idx += 1;
      if (FA_LABELS[id]) labelText = FA_LABELS[id];
      else if (labelText && /^[A-Za-z][A-Za-z0-9_\-]*$/.test(String(labelText).trim())) {
        labelText = FA_LABELS[id] || labelText;
      }
      if (labelText && labelText.length > 80) labelText = labelText.slice(0, 77) + "…";
      if (group && !group.getAttribute("data-col-fid")) group.setAttribute("data-col-fid", id);
      fields.push({
        id: id,
        label: labelText || id,
        type: type || "simple",
        scanOrder: idx,
        el: group,
        full: !!full,
        kind: kind || "field"
      });
    }

    var groups = pane.querySelectorAll(".form-group");
    Array.prototype.forEach.call(groups, function (g) {
      if (isHostGroup(g)) return;
      if (g.closest("#columnsDesignerHost") || g.closest("#colDesignerPanel") || g.closest(".modal-overlay") || g.closest("#jalaliCalendarPopup")) return;
      if (g.querySelector("[data-custom-field-id]")) return;
      if (g.id === "orderItemsContainer" || g.closest("#orderItemsContainer") || g.querySelector("#orderItemsContainer")) return;

      var inputs = [];
      Array.prototype.forEach.call(g.querySelectorAll("input, select, textarea"), function (el) {
        if (el.type === "hidden") return;
        if (el.closest(".form-group") !== g) return;
        if (el.closest("#columnsDesignerHost")) return;
        if (el.closest("#orderItemsContainer") || el.closest(".order-item-row")) return;
        inputs.push(el);
      });

      if (!inputs.length) {
        var hid = g.querySelector('input[type="hidden"][id]');
        var title = g.querySelector(":scope > .form-label, :scope > label, :scope > h4");
        if (hid && hid.id) {
          pushField(hid.id, fieldLabelOf(hid, g) || (title ? title.textContent : hid.id), "block", g, true, "block");
        }
        return;
      }

      inputs.forEach(function (el) {
        if (!el.id) return;
        var type = "simple";
        if (el.tagName === "SELECT") type = "select";
        else if (el.type === "number") type = "number";
        else if (el.type === "file") type = "file";
        else if ((el.id || "").toLowerCase().indexOf("date") !== -1) type = "date";
        var ownLab = el.id && g.querySelector('label[for="' + el.id + '"]');
        var labelText = ownLab ? String(ownLab.textContent || "").replace(/\s+/g, " ").trim() : (el.placeholder || el.id);
        if ((!ownLab || /^[A-Za-z][A-Za-z0-9_\-]*$/.test(labelText)) && FA_LABELS[el.id]) labelText = FA_LABELS[el.id];
        pushField(el.id, labelText, type, g, g.classList.contains("full-width") && inputs.length === 1, "field");
      });
    });

    if (tabId === "tab-orders" && $("orderItemsContainer")) {
      var boxG = $("orderItemsContainer").closest(".form-group");
      pushField("orderItemsBox", "کادر اقلام سفارش", "box", boxG, true, "box");
      pushField("orderItemName", "نام کالا (داخل کادر اقلام)", "simple", boxG, false, "ordercol");
      pushField("orderItemCount", "تعداد کالا (داخل کادر اقلام)", "number", boxG, false, "ordercol");
      pushField("orderItemGift", "تعداد جایزه (داخل کادر اقلام)", "number", boxG, false, "ordercol");
      pushField("orderItemPrice", "قیمت واحد (داخل کادر اقلام)", "number", boxG, false, "ordercol");
    }

    function wrapWidget(el) {
      if (!el) return null;
      if (el.classList && el.classList.contains("form-group")) return el;
      if (el.parentNode && el.parentNode.classList && el.parentNode.classList.contains("col-widget-wrap")) {
        return el.parentNode;
      }
      return el;
    }
    var skipBtn = {
      btnToggleSideMenu: 1, btnCloseSideMenu: 1, btnNotificationBellHeader: 1,
      btnOpenLoginModal: 1, btnLogoutSystem: 1, btnAddDashWidget: 1
    };
    Array.prototype.forEach.call(pane.querySelectorAll("button[id], .btn-toggle-option[id]"), function (btn) {
      if (!btn.id || seen[btn.id] || skipBtn[btn.id]) return;
      if (btn.closest("#columnsDesignerHost") || btn.closest(".modal-overlay") || btn.closest("#jalaliCalendarPopup")) return;
      if (btn.closest(".app-header") || btn.closest(".app-nav") || btn.closest(".side-menu-drawer")) return;
      if (btn.closest(".col-widget-wrap")) return;
      if (btn.closest("#tab-manual-design")) return;
      var label = (FA_LABELS[btn.id] || String(btn.textContent || btn.title || btn.id)).replace(/\s+/g, " ").trim();
      var wrap = wrapWidget(btn);
      pushField(btn.id, label, "widget", wrap, false, "widget");
    });
    Array.prototype.forEach.call(pane.querySelectorAll(".map-container[id]"), function (mapEl) {
      if (!mapEl.id || seen[mapEl.id]) return;
      if (mapEl.closest("#columnsDesignerHost") || mapEl.closest(".modal-overlay")) return;
      var wrap = wrapWidget(mapEl);
      pushField(mapEl.id, FA_LABELS[mapEl.id] || "نقشه", "widget", wrap, true, "widget");
    });
    return fields;
  }

  function getUnifiedFieldList(tabId) {
    var key = fieldKeyForTab(tabId);
    var meta = ensureMeta(key);
    var list = [];
    var listDefaults = DEFAULT_LIST_ON[key] || [];
    scanBuiltinFields(tabId).forEach(function (b) {
      if (!b.id || /^auto-tab-orders-/.test(b.id)) return;
      if (b.label && /اقلام دارویی سفارش/.test(b.label) && b.kind !== "box" && b.id !== "orderItemsBox") return;
      if (!meta[b.id]) meta[b.id] = {};
      if (meta[b.id].deleted) return;
      if (meta[b.id].order == null || meta[b.id].order === "") meta[b.id].order = b.scanOrder;
      var showForm = meta[b.id].showInForm !== false && meta[b.id].hidden !== true;
      var showList = meta[b.id].showInList;
      if (showList !== true && showList !== false) showList = listDefaults.indexOf(b.id) !== -1;
      list.push({
        id: b.id,
        builtin: true,
        label: meta[b.id].label || b.label,
        type: b.type,
        order: Number(meta[b.id].order) || b.scanOrder,
        listOrder: (meta[b.id].listOrder != null && meta[b.id].listOrder !== "") ? Number(meta[b.id].listOrder) : (Number(meta[b.id].order) || b.scanOrder),
        size: meta[b.id].size,
        height: meta[b.id].height,
        hidden: !showForm,
        showInForm: showForm,
        showInList: showList === true,
        full: b.full,
        kind: b.kind || "field",
        place: meta[b.id].place || (b.full || b.kind === "box" ? "under" : "beside"),
        required: meta[b.id].required === true || (meta[b.id].required == null && window._v18DefaultReq && window._v18DefaultReq[b.id]),
        allowAddOption: meta[b.id].allowAddOption !== false,
        exportExcel: meta[b.id].exportExcel === true,
        labelFontFamily: meta[b.id].labelFontFamily || "",
        labelFontWeight: meta[b.id].labelFontWeight || "",
        labelFontSize: meta[b.id].labelFontSize || "",
        fieldFontFamily: meta[b.id].fieldFontFamily || "",
        fieldFontWeight: meta[b.id].fieldFontWeight || "",
        fieldFontSize: meta[b.id].fieldFontSize || "",
        boxId: meta[b.id].boxId || ""
      });
    });
    sortedFields(key).forEach(function (c) {
      list.push({
        id: c.id,
        builtin: false,
        label: c.label,
        type: c.inputKind || c.type || "simple",
        order: Number(c.order) || 999,
        listOrder: (c.listOrder != null && c.listOrder !== "") ? Number(c.listOrder) : (Number(c.order) || 999),
        size: c.size,
        height: c.height,
        hidden: c.showInForm === false,
        showInForm: c.showInForm !== false,
        showInList: c.showInList !== false,
        options: c.options,
        allowAddOption: c.allowAddOption,
        dependsOn: c.dependsOn,
        inputKind: c.inputKind,
        kind: "custom",
        place: c.place || "beside",
        required: c.required === true,
        exportExcel: c.exportExcel === true,
        labelFontFamily: c.labelFontFamily || "",
        labelFontWeight: c.labelFontWeight || "",
        labelFontSize: c.labelFontSize || "",
        fieldFontFamily: c.fieldFontFamily || "",
        fieldFontWeight: c.fieldFontWeight || "",
        fieldFontSize: c.fieldFontSize || "",
        boxId: c.boxId || ""
      });
    });
    list.sort(function (a, b) {
      var ao = Number(a.order) || 999;
      var bo = Number(b.order) || 999;
      if (ao !== bo) return ao - bo;
      if (a.builtin !== b.builtin) return a.builtin ? -1 : 1;
      return String(a.id).localeCompare(String(b.id));
    });
    return list;
  }

  window.cleanupOrphanCustomFields = function (entityType, containerId, removeValidOutside) {
    var container = document.getElementById(containerId);
    var form = container ? container.closest("form") : null;
    var root = form || document;
    var valid = {};
    ((state.customFields || {})[entityType] || []).forEach(function (f) { valid[f.id] = true; });
    Array.prototype.slice.call(root.querySelectorAll("[data-custom-field-id]")).forEach(function (inp) {
      var id = inp.getAttribute("data-custom-field-id");
      if (valid[id]) return;
      var g = inp.closest(".form-group");
      if (g) g.remove();
      else inp.remove();
    });
  };

  function findFieldGroup(tabId, field) {
    var grid = getMainGrid(tabId);
    var form = getTabForm(tabId);
    var root = form || grid || document;
    if (!field.builtin) {
      var inp = root.querySelector('[data-custom-field-id="' + field.id + '"]') ||
        document.querySelector('[data-custom-field-id="' + field.id + '"]');
      return inp ? inp.closest(".form-group") : null;
    }
    var el = document.getElementById(field.id) ||
      document.querySelector('[data-col-fid="' + field.id + '"]');
    if (!el) return null;
    if (field.kind === "widget") {
      if (el.parentNode && el.parentNode.classList && el.parentNode.classList.contains("col-widget-wrap")) return el.parentNode;
      return el;
    }
    var g = el.classList && el.classList.contains("form-group") ? el : el.closest(".form-group");
    return g;
  }

  function groupIsShared(group, fieldId) {
    if (!group || !fieldId) return false;
    if (group.querySelector(".form-group")) return true;
    var extra = 0;
    Array.prototype.forEach.call(group.querySelectorAll("input[id], select[id], textarea[id]"), function (el) {
      if (el.type === "hidden") return;
      if (el.id && el.id !== fieldId) extra += 1;
    });
    return extra > 0;
  }

  function stripLabelStarText(lab) {
    if (!lab) return;
    var nodes = lab.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.nodeType === 3) {
        n.nodeValue = String(n.nodeValue || "")
          .replace(/\s*\*+\s*$/g, "")
          .replace(/\s+\*\s+/g, " ")
          .replace(/^\s*\*\s*/, "");
      }
    }
    Array.prototype.forEach.call(lab.querySelectorAll("span"), function (sp) {
      if (sp.classList && sp.classList.contains("req-star")) return;
      var t = String(sp.textContent || "");
      if (t.replace(/\s/g, "") === "*") {
        if (sp.parentNode) sp.parentNode.removeChild(sp);
      } else if (/\*/.test(t) && !sp.querySelector("input")) {
        sp.textContent = t.replace(/\s*\*+\s*/g, " ").replace(/\s+/g, " ").trim();
      }
    });
  }

  function paintRequiredStar(group, f) {
    if (!group || !f) return;
    var lab = (f.id && group.querySelector('label[for="' + f.id + '"]')) ||
      group.querySelector(".form-label, label, h4");
    if (!lab || lab.querySelector("input")) return;
    stripLabelStarText(lab);
    var star = lab.querySelector(".req-star");
    if (f.required && f.showInForm && !f.hidden) {
      if (!star) {
        star = document.createElement("span");
        star.className = "req-star";
        star.setAttribute("aria-hidden", "true");
        star.textContent = "*";
        lab.appendChild(star);
      } else {
        star.textContent = "*";
      }
      star.style.color = "#dc2626";
      star.style.fontWeight = "900";
      star.style.margin = "0";
      star.style.padding = "0";
      star.style.marginInlineStart = "1px";
    } else if (star) {
      star.parentNode.removeChild(star);
    }
    var inp = (f.id && document.getElementById(f.id)) ||
      group.querySelector("input:not([type=hidden]), select, textarea");
    if (inp && inp.tagName !== "BUTTON") {
      if (f.required && f.showInForm && !f.hidden) {
        inp.setAttribute("data-req", "1");
        inp.removeAttribute("required");
      } else {
        inp.removeAttribute("data-req");
        inp.removeAttribute("required");
      }
    }
  }

  function paintFieldBox(group, f) {
    if (!group || !f) return;
    var hide = !f.showInForm || f.hidden;
    var shared = groupIsShared(group, f.id);
    var targetInp = (f.id && group.contains(document.getElementById(f.id)) && document.getElementById(f.id)) ||
      group.querySelector("input:not([type=hidden]), select, textarea");
    if (hide) {
      if (shared && targetInp) {
        var hidLab = f.id && group.querySelector('label[for="' + f.id + '"]');
        if (hidLab) hidLab.style.display = "none";
        targetInp.style.display = "none";
        targetInp.setAttribute("data-col-hidden", "1");
        var hidCombo = targetInp.closest ? targetInp.closest(".crm-combo") : null;
        if (hidCombo) hidCombo.style.display = "none";
      } else {
        group.classList.toggle("col-hide-form", true);
        group.style.display = "none";
        group.setAttribute("data-col-hidden", "1");
      }
      return;
    }
    group.classList.remove("col-hide-form");
    group.style.display = "";
    group.removeAttribute("data-col-hidden");
    if (targetInp) {
      targetInp.style.display = "";
      targetInp.removeAttribute("data-col-hidden");
      var showLab = f.id && group.querySelector('label[for="' + f.id + '"]');
      if (showLab) showLab.style.display = "";
      var showCombo = targetInp.closest ? targetInp.closest(".crm-combo") : null;
      if (showCombo) showCombo.style.display = "";
    }
    var size = parseInt(f.size, 10);
    var place = f.place || (f.full ? "under" : "beside");
    group.classList.toggle("col-place-under", place === "under");
    group.classList.toggle("col-place-beside", place !== "under");
    if (place === "under") {
      group.style.setProperty("flex", "1 1 100%", "important");
      group.style.setProperty("max-width", "100%", "important");
      group.style.setProperty("min-width", "100%", "important");
      group.style.setProperty("width", "100%", "important");
    } else if (!shared) {
      var w = size > 40 ? size : 260;
      group.style.setProperty("flex", "0 0 " + w + "px", "important");
      group.style.setProperty("max-width", w + "px", "important");
      group.style.setProperty("min-width", Math.min(140, w) + "px", "important");
      group.style.setProperty("width", w + "px", "important");
    }
    var hgt = parseInt(f.height, 10);
    if (hgt > 20) {
      var hInp = targetInp || group.querySelector(".form-input, .form-select, .form-textarea, input:not([type=hidden]), select, textarea");
      if (hInp && hInp.tagName !== "BUTTON") {
        hInp.style.setProperty("height", hgt + "px", "important");
        hInp.style.setProperty("min-height", hgt + "px", "important");
      }
      if (f.kind === "widget" || (group.classList && (group.classList.contains("col-user-box") || group.classList.contains("col-widget-wrap")))) {
        group.style.setProperty("min-height", hgt + "px", "important");
      }
    }
    if (size > 40) {
      var sizedInp = targetInp || group.querySelector(".form-input, .form-select, .form-textarea, input:not([type=hidden]), select, textarea");
      if (sizedInp) {
        sizedInp.style.setProperty("width", size + "px", "important");
        sizedInp.style.setProperty("max-width", size + "px", "important");
        sizedInp.style.setProperty("min-width", Math.min(120, size) + "px", "important");
      }
      var combo = sizedInp && sizedInp.closest ? sizedInp.closest(".crm-combo") : group.querySelector(".crm-combo");
      if (combo) {
        combo.style.setProperty("width", size + "px", "important");
        combo.style.setProperty("max-width", size + "px", "important");
      }
    }
    var lab = group.querySelector(".form-label, label, h4");
    var inp = group.querySelector(".form-input, .form-select, .form-textarea, input, select, textarea, button");
    function applyFont(el, fam, weight, size) {
      if (!el) return;
      if (fam) el.style.fontFamily = fam;
      else el.style.removeProperty("font-family");
      if (weight === "bold") el.style.fontWeight = "800";
      else if (weight === "normal") el.style.fontWeight = "400";
      else el.style.removeProperty("font-weight");
      var px = parseInt(size, 10);
      if (px) {
        if (px > 28) px = 28;
        if (px < 10) px = 10;
        el.style.fontSize = px + "px";
      } else if (size) el.style.fontSize = size;
      else el.style.removeProperty("font-size");
    }
    applyFont(lab, f.labelFontFamily || f.fontFamily, f.labelFontWeight || f.fontWeight, f.labelFontSize || f.fontSize);
    applyFont(inp, f.fieldFontFamily || f.fontFamily, f.fieldFontWeight || f.fontWeight, f.fieldFontSize || f.fontSize);
    if (f.kind === "widget" && group.querySelector(".map-container")) {
      group.classList.add("col-place-under");
      group.style.setProperty("width", "100%", "important");
      group.style.setProperty("max-width", "100%", "important");
    }
  }

  function applyOrderItemLayout() {
    var meta = ensureMeta("order");
    var specs = [
      { id: "orderItemName", def: "2.2fr" },
      { id: "orderItemCount", def: "0.7fr" },
      { id: "orderItemGift", def: "0.9fr" },
      { id: "orderItemPrice", def: "1.1fr" }
    ];
    var underCount = 0;
    var parts = specs.map(function (s) {
      var m = meta[s.id] || {};
      if (m.showInForm === false || m.hidden) return "0px";
      if ((m.place || "beside") === "under") { underCount += 1; return "1fr"; }
      var size = parseInt(m.size, 10);
      return size > 40 ? (size + "px") : s.def;
    });
    parts.push("auto");
    var tpl = underCount === specs.length ? "1fr" : parts.join(" ");
    document.querySelectorAll(".order-item-row, .order-item-head").forEach(function (el) {
      el.style.gridTemplateColumns = tpl;
    });
  }

  function getBoxes(key) {
    if (!state.formBoxes) state.formBoxes = {};
    if (!state.formBoxes[key]) state.formBoxes[key] = [];
    return state.formBoxes[key];
  }

  function applyUserBoxes(tabId, key, grid, placed) {
    if (!grid) return;
    var boxes = getBoxes(key);
    boxes.forEach(function (box) {
      if (!box || !box.id) return;
      var wrap = document.getElementById(box.id);
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.id = box.id;
        wrap.className = "col-user-box";
        wrap.innerHTML = '<div class="col-user-box-title"></div><div class="col-user-box-body form-grid form-grid-sized"></div>';
        grid.appendChild(wrap);
      }
      var title = wrap.querySelector(".col-user-box-title");
      if (title) title.textContent = box.label || "کادر";
      var body = wrap.querySelector(".col-user-box-body") || wrap;
      (box.fieldIds || []).forEach(function (fid) {
        if (fid === "orderItemsBox" || fid.indexOf("orderItem") === 0) return;
        var item = null;
        placed.forEach(function (p) { if (p.f.id === fid) item = p; });
        if (item && item.group && item.group !== wrap) {
          var g = item.group;
          if (g.tagName === "BUTTON" || (g.classList && g.classList.contains("map-container"))) {
            if (g.parentNode && g.parentNode.classList && g.parentNode.classList.contains("col-widget-wrap")) {
              g = g.parentNode;
            } else if (g.parentNode) {
              var ww = document.createElement("div");
              ww.className = "form-group col-widget-wrap";
              ww.setAttribute("data-col-fid", fid);
              g.parentNode.insertBefore(ww, g);
              ww.appendChild(g);
              g = ww;
            }
          }
          if (g !== wrap) body.appendChild(g);
        }
      });
    });
  }

  window.validateRequiredFields = function (tabId) {
    var list = [];
    try { list = getUnifiedFieldList(tabId); } catch (e) { return true; }
    var missing = [];
    list.forEach(function (f) {
      if (!f.required || !f.showInForm || f.hidden) return;
      if (f.kind === "ordercol" || f.kind === "box") return;
      var el = document.getElementById(f.id);
      if (!el) {
        var g = findFieldGroup(tabId, f);
        el = g && g.querySelector("input:not([type=hidden]), select, textarea");
      }
      if (!el) return;
      if (!(String(el.value || "").trim())) missing.push(f.label || f.id);
    });
    if (missing.length) {
      alert(missing.map(function (n) {
        return "فیلد «" + n + "» خالی است و باید پر شود.";
      }).join("\n"));
      return false;
    }
    return true;
  };

  function applyFullFormLayout(tabId) {
    if (!tabId || window._layoutBusy) return;
    var key = fieldKeyForTab(tabId);
    var cid = ensureFieldHost(tabId, key);
    var grid = getMainGrid(tabId);
    var container = cid ? $(cid) : null;
    if (cid && typeof renderCustomFieldsInForm === "function") {
      window._layoutBusy = true;
      var skip = window.applyCustomFieldOrderInForm;
      try {
        window.applyCustomFieldOrderInForm = function () {};
        renderCustomFieldsInForm(key, cid);
      } catch (e) { console.error("renderCustomFieldsInForm", e); }
      window.applyCustomFieldOrderInForm = skip;
      window._layoutBusy = false;
    }
    var unified = getUnifiedFieldList(tabId);
    var meta = ensureMeta(key);
    if (grid) grid.classList.add("form-grid-sized");
    var placed = [];
    unified.forEach(function (f) {
      if (f.kind === "ordercol") return;
      var group = findFieldGroup(tabId, f);
      if (!group && !f.builtin && container) {
        group = container.querySelector('[data-custom-field-id="' + f.id + '"]');
        if (group) group = group.closest(".form-group");
      }
      if (!group) return;
      if (f.builtin && meta[f.id] && meta[f.id].label) {
        var lab = group.querySelector(".form-label, label");
        if (lab && !lab.querySelector("input")) lab.textContent = meta[f.id].label;
      }
      paintFieldBox(group, f);
      paintRequiredStar(group, f);
      placed.push({ f: f, group: group });
    });
    if (grid) {
      placed.forEach(function (item) {
        if (!item.f.showInForm || item.f.hidden) return;
        if (item.f.kind === "widget") return;
        if (item.group.parentNode !== grid) grid.appendChild(item.group);
        else grid.appendChild(item.group);
      });
      placed.forEach(function (item) {
        if (item.f.showInForm && !item.f.hidden) return;
        if (groupIsShared(item.group, item.f.id)) return;
        if (item.group.parentNode === grid) grid.appendChild(item.group);
      });
      if (container && container.parentNode === grid) grid.appendChild(container);
      applyUserBoxes(tabId, key, grid, placed);
    }
    if (tabId === "tab-orders") applyOrderItemLayout();
    try {
      if (tabId === "tab-pharmacies" && typeof mapPharmacyForm !== "undefined" && mapPharmacyForm) {
        setTimeout(function () { mapPharmacyForm.invalidateSize(); }, 160);
      }
      if (tabId === "tab-doctors" && typeof mapDoctorForm !== "undefined" && mapDoctorForm) {
        setTimeout(function () { mapDoctorForm.invalidateSize(); }, 160);
      }
    } catch (e) {}
  }

  window.applyFullFormLayout = applyFullFormLayout;
  window.getMainGrid = getMainGrid;
  window.getAllMenuSections = function () {
    var base = (typeof MENU_SECTIONS_LIST !== "undefined" ? MENU_SECTIONS_LIST.slice() : []);
    try {
      ((state && state.userTabs) || []).forEach(function (t) {
        if (!t || !t.id) return;
        var exists = false;
        base.forEach(function (s) { if (s.id === t.id) exists = true; });
        if (!exists) base.push({ id: t.id, label: t.label, icon: t.icon || "📋", badgeId: t.badgeId });
      });
      if (!state.tabOrder) state.tabOrder = {};
      base.forEach(function (s, i) {
        if (state.tabOrder[s.id] == null || state.tabOrder[s.id] === "") state.tabOrder[s.id] = i + 1;
      });
      base.sort(function (a, b) {
        return (Number(state.tabOrder[a.id]) || 999) - (Number(state.tabOrder[b.id]) || 999);
      });
    } catch (e) {}
    return base;
  };

  window.applyAllFormLayouts = function () {
    window.getAllMenuSections().forEach(function (sec) {
      try { applyFullFormLayout(sec.id); } catch (e) { console.error("layout", sec.id, e); }
    });
  };

  window.applyCustomFieldOrderInForm = function (entityType, containerId) {
    window.cleanupOrphanCustomFields(entityType, containerId, false);
    var tabId = KEY_TO_TAB[entityType] || ("tab-" + entityType);
    applyFullFormLayout(tabId);
  };

  function bindFieldDependencies(entityType, containerId) {
    var container = document.getElementById(containerId);
    var form = container ? container.closest("form") : null;
    var root = form || container;
    if (!root) return;
    var fields = (state.customFields && state.customFields[entityType]) || [];
    function applyDeps() {
      fields.forEach(function (f) {
        if (!f.dependsOn) return;
        var input = root.querySelector('[data-custom-field-id="' + f.id + '"]');
        var parent = root.querySelector('[data-custom-field-id="' + f.dependsOn + '"]');
        if (!input) return;
        var group = input.closest(".form-group");
        if (!group) return;
        var parentVal = parent ? String(parent.value || "").trim() : "";
        group.style.display = parentVal ? "" : "none";
      });
    }
    fields.forEach(function (f) {
      if (!f.dependsOn) return;
      var parent = root.querySelector('[data-custom-field-id="' + f.dependsOn + '"]');
      if (parent && parent.dataset.depBound !== "1") {
        parent.dataset.depBound = "1";
        parent.addEventListener("change", applyDeps);
        parent.addEventListener("input", applyDeps);
      }
    });
    applyDeps();
  }

  window.renderExtraTabCustomFields = function () {
    var secs = typeof window.getAllMenuSections === "function" ? window.getAllMenuSections() : (typeof MENU_SECTIONS_LIST !== "undefined" ? MENU_SECTIONS_LIST : []);
    secs.forEach(function (sec) {
      var key = fieldKeyForTab(sec.id);
      if (key === "pharmacy" || key === "doctor" || key === "order") return;
      var cid = ensureFieldHost(sec.id, key);
      if (cid && typeof renderCustomFieldsInForm === "function") {
        renderCustomFieldsInForm(key, cid);
      }
    });
  };

  window.refreshColumnsDesigner = function () {
    renderColTabGrid();
    if (window._activeColTab) renderColDesignerPanel();
  };

  function setupColumnsDesigner() {
    var host = $("columnsDesignerHost");
    if (!host) return;
    host.dataset.v112 = "1";
    host.dataset.v111 = "1";
    host.dataset.ready = "1";
    if (!$("colTabGrid") || !host.querySelector(".col-tab-grid")) {
      host.innerHTML =
        '<p class="col-tab-hint">همه تب‌ها مثل داشبورد اینجاست. روی یک تب بزنید تا <strong>همه فیلدهای همان فرم</strong> (ثابت + اضافه‌شده) را ببینید، ویرایش یا حذف کنید.</p>' +
        '<div class="col-tab-grid" id="colTabGrid"></div>' +
        '<div class="col-designer-panel" id="colDesignerPanel" hidden></div>';
    }
    try { renderColTabGrid(); } catch (e) { console.error("renderColTabGrid", e); }
    if (window._activeColTab) {
      try { renderColDesignerPanel(); } catch (e) { console.error("renderColDesignerPanel", e); }
    }
  }

  function renderColTabGrid() {
    var grid = $("colTabGrid");
    if (!grid) {
      var host = $("columnsDesignerHost");
      if (!host) return;
      host.innerHTML =
        '<p class="col-tab-hint">همه تب‌ها مثل داشبورد اینجاست. روی یک تب بزنید تا فیلدهای همان تب را ببینید.</p>' +
        '<div class="col-tab-grid" id="colTabGrid"></div>' +
        '<div class="col-designer-panel" id="colDesignerPanel" hidden></div>';
      grid = $("colTabGrid");
    }
    if (!grid || typeof window.getAllMenuSections !== "function") return;
    var html = "";
    window.getAllMenuSections().forEach(function (sec) {
      var n = 0;
      try { n = getUnifiedFieldList(sec.id).length; } catch (e) { n = 0; }
      var active = window._activeColTab === sec.id ? " active" : "";
      html += '<button type="button" class="nav-item col-designer-tab col-tab-card' + active + '" data-col-tab="' + sec.id + '">' +
        "<span>" + sec.icon + " " + escHtml(sec.label) + "</span>" +
        '<span class="nav-badge">' + n + "</span></button>";
    });
    grid.innerHTML = html;
    Array.prototype.forEach.call(grid.querySelectorAll(".col-designer-tab"), function (btn) {
      btn.addEventListener("click", function () {
        window._activeColTab = btn.getAttribute("data-col-tab");
        window._editingColField = null;
        renderColTabGrid();
        renderColDesignerPanel();
        var panel = $("colDesignerPanel");
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function fillDesignerForm(field) {
    if (!$("colFieldLabel")) return;
    $("colFieldLabel").value = field ? (field.label || "") : "";
    var type = field ? (field.inputKind || field.type || "simple") : "simple";
    if (type === "select" || type === "date" || type === "number" || type === "simple") $("colFieldType").value = type;
    else $("colFieldType").value = "simple";
    $("colFieldOrder").value = field && field.order ? field.order : (getUnifiedFieldList(window._activeColTab).length + 1);
    if ($("colFieldListOrder")) {
      $("colFieldListOrder").value = field && field.listOrder ? field.listOrder : (getUnifiedFieldList(window._activeColTab).length + 1);
    }
    var shownSize = field && parseInt(field.size, 10) > 40 ? parseInt(field.size, 10) : 0;
    var shownH = field && parseInt(field.height, 10) > 20 ? parseInt(field.height, 10) : 0;
    if (field) {
      var liveEl = document.getElementById(field.id);
      var liveG = null;
      if (liveEl) {
        liveG = liveEl.closest(".form-group") || liveEl;
        var rw = Math.round(liveEl.getBoundingClientRect().width);
        var rh = Math.round(liveEl.getBoundingClientRect().height);
        if (!(shownSize > 40) && rw > 40) shownSize = rw;
        if (!(shownH > 20) && rh > 16) shownH = rh;
      }
      if (!(shownSize > 40) && liveG) {
        var gw = Math.round(liveG.getBoundingClientRect().width);
        if (gw > 40) shownSize = gw;
      }
      if (!(shownSize > 40) && (field.full || field.place === "under" || /Address|address|آدرس/.test((field.label || "") + (field.id || "")))) shownSize = 560;
    }
    $("colFieldSize").value = shownSize > 40 ? shownSize : 220;
    if ($("colFieldHeight")) $("colFieldHeight").value = shownH > 20 ? shownH : 42;
    if ($("colAddKind")) $("colAddKind").value = (field && (field.kind === "widget" || String(field.inputKind || "").indexOf("widget-") === 0)) ? "button" : (field && field.kind === "box" ? "box" : "field");
    if ($("colFieldPlace")) $("colFieldPlace").value = field && field.place ? field.place : (field && field.full ? "under" : "beside");
    $("colFieldOpts").value = field && field.options ? field.options.join("، ") : "";
    $("colFieldDep").value = field && field.dependsOn ? field.dependsOn : "";
    $("colFieldFly").checked = !field || field.allowAddOption !== false;
    $("colFieldInForm").checked = !field || field.showInForm !== false;
    $("colFieldInList").checked = !field || field.showInList !== false;
    if ($("colFieldReq")) $("colFieldReq").checked = !!(field && field.required);
    if ($("colFieldExcel")) $("colFieldExcel").checked = !!(field && field.exportExcel);
    var btn = $("btnSaveColField");
    if (btn) btn.textContent = field ? ("ذخیره ویرایش «" + field.label + "»") : "ثبت فیلد در این تب";
    var optsWrap = $("colFieldOptsWrap");
    if (optsWrap) optsWrap.style.display = $("colFieldType").value === "select" ? "" : "none";
    var typeSel = $("colFieldType");
    if (typeSel) typeSel.disabled = !!(field && field.builtin);
  }

  function renderColDesignerPanel() {
    var panel = $("colDesignerPanel");
    if (!panel) return;
    var tabId = window._activeColTab;
    if (!tabId) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }
    var sec = ((typeof window.getAllMenuSections === "function" ? window.getAllMenuSections() : []).filter(function (s) {
      return s.id === tabId;
    })[0]) || { label: tabId, icon: "🧱" };
    var key = fieldKeyForTab(tabId);
    ensureFieldHost(tabId, key);
    try { ensureSequentialOrders(tabId); } catch (e) {}
    var list = [];
    try { list = getUnifiedFieldList(tabId); } catch (e) { console.error(e); list = []; }
    panel.hidden = false;
    panel.innerHTML =
      '<div class="col-panel-head">' +
        "<div><strong>" + sec.icon + " " + escHtml(sec.label) + "</strong>" +
        '<div class="col-panel-sub">شماره ترتیب = شماره ردیف. اگر ۴ بگذارید همان فیلد ردیف ۴ فرم می‌شود. ▲▼ یکی‌یکی جابه‌جا می‌کند. اندازه به پیکسل عرض فیلد را عوض می‌کند. تیک نمایش در فرم/لیست برای همه فیلدهاست.</div></div>' +
        '<div class="col-panel-actions">' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnColOpenTab" style="background:#0d9488">باز کردن فرم این تب</button>' +
          '<button type="button" class="btn btn-outline btn-sm" id="btnColBackToGrid">بازگشت به لیست تب‌ها</button>' +
        "</div>" +
      "</div>" +
      '<div class="form-grid col-add-grid">' +
        '<div class="form-group"><label class="form-label">چه چیزی اضافه شود؟</label><select id="colAddKind" class="form-select"><option value="field">فیلد</option><option value="box">کادر</option><option value="button">کلید</option></select><small class="col-help">فیلد، کادر یا کلید در جای خودش می‌نشیند</small></div>' +
        '<div class="form-group"><label class="form-label" id="colFieldLabelCap">عنوان فیلد</label><input id="colFieldLabel" class="form-input" placeholder="مثلاً کد اقتصادی"></div>' +
        '<div class="form-group" id="colFieldTypeWrap"><label class="form-label">نوع</label><select id="colFieldType" class="form-select"><option value="simple">ساده (متنی)</option><option value="select">کشویی</option><option value="date">تاریخ</option><option value="number">عددی</option></select></div>' +
        '<div class="form-group" id="colBtnKindWrap" style="display:none"><label class="form-label">نوع کلید</label><select id="colBtnKind" class="form-select"><option value="widget-save">ثبت / ذخیره</option><option value="widget-edit">ویرایش</option><option value="widget-delete">حذف</option><option value="widget-reset">بازنشانی</option><option value="widget-excel">خروجی اکسل</option><option value="widget-print">چاپ</option><option value="widget-search">جستجو</option><option value="widget-myloc">موقعیت کنونی</option><option value="widget-getaddr">دریافت آدرس</option><option value="widget-map">نقشه</option></select></div>' +
        '<div class="form-group"><label class="form-label">شماره ترتیب در فرم</label><input id="colFieldOrder" class="form-input" type="number" min="1" value="' + (list.length + 1) + '"><small class="col-help">فقط جای فیلد در فرم ثبت</small></div>' +
        '<div class="form-group"><label class="form-label">شماره ترتیب در لیست</label><input id="colFieldListOrder" class="form-input" type="number" min="1" value="' + (list.length + 1) + '"><small class="col-help">جای ستون در جدول لیست — جدا از فرم</small></div>' +
        '<div class="form-group"><label class="form-label">عرض (پیکسل)</label><input id="colFieldSize" class="form-input" type="number" min="40" max="1200" value="220"><small class="col-help">عدد واقعی عرض همان فیلد/کادر/کلید</small></div>' +
        '<div class="form-group"><label class="form-label">ارتفاع (پیکسل)</label><input id="colFieldHeight" class="form-input" type="number" min="24" max="800" value="42"><small class="col-help">عدد واقعی ارتفاع همان مورد</small></div>' +
        '<div class="form-group"><label class="form-label">جای فیلد در صفحه</label><select id="colFieldPlace" class="form-select"><option value="beside">روبرو (کنار فیلدها)</option><option value="under">زیر هم (سطر جدا)</option></select></div>' +
        '<div class="form-group"><label class="form-label">داخل کدام کادر؟</label><select id="colFieldBoxTarget" class="form-select"><option value="">روی خود فرم (بدون کادر)</option></select></div>' +
        '<div class="form-group" id="colFieldOptsWrap"><label class="form-label">گزینه‌های کشویی</label><input id="colFieldOpts" class="form-input" placeholder="با ویرگول جدا کنید"></div>' +
        '<div class="form-group"><label class="form-label">وابسته به فیلد (شناسه اختیاری)</label><input id="colFieldDep" class="form-input" placeholder="خالی بماند اگر مستقل است"></div>' +
        '<div class="form-group"><label><input type="checkbox" id="colFieldFly" checked> افزودن لحظه‌ای گزینه</label></div>' +
        '<div class="form-group"><label><input type="checkbox" id="colFieldInForm" checked> نمایش در فرم</label></div>' +
        '<div class="form-group"><label><input type="checkbox" id="colFieldInList" checked> نمایش در لیست</label></div>' +
        '<div class="form-group"><label><input type="checkbox" id="colFieldReq"> ستاره‌دار (الزامی)</label></div>' +
        '<div class="form-group"><label><input type="checkbox" id="colFieldExcel"> خروجی اکسل</label></div>' +
      "</div>" +
      '<div class="col-add-actions"><button type="button" id="btnSaveColField" class="btn btn-primary" style="background:#0d9488">ثبت فیلد در تب «' + escHtml(sec.label) + "»</button></div>" +
      '<div class="col-box-maker">' +
        "<strong>ایجاد کادر گروهی</strong>" +
        '<div class="form-grid" style="margin-top:.5rem">' +
          '<div class="form-group"><label class="form-label">نام کادر</label><input id="colBoxLabel" class="form-input" placeholder="مثلاً اطلاعات تماس"></div>' +
        "</div>" +
        '<button type="button" id="btnAddColBox" class="btn btn-outline btn-sm">➕ ثبت کادر</button>' +
        '<div id="colBoxList"></div>' +
      "</div>" +
      '<div class="col-preview" id="colOrderPreview"></div>' +
      '<div id="colFieldList" class="table-responsive col-sticky-table" style="margin-top:1rem"></div>' +
      '<div id="colBoxInfoHost" class="col-info-extra" style="margin-top:1.25rem"><h4 style="margin:0 0 .5rem;color:#0f766e">اطلاعات کادرها</h4><div id="colBoxInfoList" class="table-responsive col-sticky-table"></div></div>' +
      '<div id="colBtnInfoHost" class="col-info-extra" style="margin-top:1.25rem"><h4 style="margin:0 0 .5rem;color:#0f766e">اطلاعات کلیدها</h4><div id="colBtnInfoList" class="table-responsive col-sticky-table"></div></div>';

    var typeSel = $("colFieldType");
    var optsWrap = $("colFieldOptsWrap");
    function toggleOpts() {
      if (optsWrap) optsWrap.style.display = typeSel && typeSel.value === "select" ? "" : "none";
    }
    if (typeSel) typeSel.addEventListener("change", toggleOpts);
    toggleOpts();
    function toggleAddKind() {
      var k = $("colAddKind") ? $("colAddKind").value : "field";
      var cap = $("colFieldLabelCap");
      if (cap) cap.textContent = k === "box" ? "عنوان کادر" : (k === "button" ? "عنوان کلید" : "عنوان فیلد");
      if ($("colFieldTypeWrap")) $("colFieldTypeWrap").style.display = k === "field" ? "" : "none";
      if ($("colBtnKindWrap")) $("colBtnKindWrap").style.display = k === "button" ? "" : "none";
      if ($("colFieldOptsWrap")) $("colFieldOptsWrap").style.display = (k === "field" && typeSel && typeSel.value === "select") ? "" : "none";
    }
    if ($("colAddKind")) $("colAddKind").addEventListener("change", toggleAddKind);
    toggleAddKind();

    if ($("btnColBackToGrid")) {
      $("btnColBackToGrid").addEventListener("click", function () {
        window._activeColTab = "";
        window._editingColField = null;
        renderColTabGrid();
        renderColDesignerPanel();
      });
    }
    if ($("btnColOpenTab")) {
      $("btnColOpenTab").addEventListener("click", function () {
        applyFullFormLayout(tabId);
        if (typeof switchTab === "function") switchTab(tabId);
      });
    }

    if ($("btnSaveColField")) {
      $("btnSaveColField").addEventListener("click", function () {
        saveDesignerField(tabId, key, sec);
      });
    }

    if (window._editingColField) fillDesignerForm(window._editingColField);
    renderColFieldList();
    renderColBoxList(tabId, key);
    if ($("btnAddColBox")) {
      $("btnAddColBox").addEventListener("click", function () {
        var name = ($("colBoxLabel").value || "").trim();
        if (!name) { alert("نام کادر را بنویسید."); return; }
        if (window._editingBoxId) {
          var box = getBoxes(key).filter(function (x) { return x.id === window._editingBoxId; })[0];
          if (box) box.label = name;
          window._editingBoxId = "";
          if ($("btnAddColBox")) $("btnAddColBox").textContent = "➕ ثبت کادر";
        } else {
          getBoxes(key).push({ id: "box-" + key + "-" + Date.now(), label: name, fieldIds: [] });
        }
        saveState();
        $("colBoxLabel").value = "";
        applyFullFormLayout(tabId);
        renderColBoxList(tabId, key);
      });
    }
  }

  window.renderColBoxList = renderColBoxList;
  function renderColBoxList(tabId, key) {
    var host = $("colBoxList");
    if (!host) return;
    var boxes = getBoxes(key);
    var fields = [];
    try { fields = getUnifiedFieldList(tabId); } catch (e) {}
    if (!boxes.length) {
      host.innerHTML = "<p class='col-help'>کادری نیست. با نام دلخواه یک کادر بسازید و بعد مشخص کنید کدام فیلدها داخلش باشند.</p>";
      return;
    }
    host.innerHTML = boxes.map(function (b) {
      var checks = fields.filter(function (f) { return f.kind !== "box"; }).map(function (f) {
        var on = (b.fieldIds || []).indexOf(f.id) !== -1;
        return "<label class='col-box-chk'><input type='checkbox' data-box='" + escHtml(b.id) + "' data-fid='" + escHtml(f.id) + "'" + (on ? " checked" : "") + "> " + escHtml(f.label) + "</label>";
      }).join("");
      return "<div class='col-user-box-admin'><div class='col-user-box-admin-head'><strong>" + escHtml(b.label) + "</strong>" +
        " <button type='button' class='btn btn-outline btn-sm col-edit-box' data-box='" + escHtml(b.id) + "'>✏️ ویرایش</button>" +
        " <button type='button' class='btn btn-danger btn-sm col-del-box' data-box='" + escHtml(b.id) + "'>حذف</button></div>" +
        "<div class='col-box-fields'>" + checks + "</div></div>";
    }).join("");
    Array.prototype.forEach.call(host.querySelectorAll("input[type=checkbox][data-box]"), function (chk) {
      chk.addEventListener("change", function () {
        var bid = chk.getAttribute("data-box");
        var fid = chk.getAttribute("data-fid");
        var box = getBoxes(key).filter(function (x) { return x.id === bid; })[0];
        if (!box) return;
        if (!box.fieldIds) box.fieldIds = [];
        var i = box.fieldIds.indexOf(fid);
        if (chk.checked && i === -1) box.fieldIds.push(fid);
        if (!chk.checked && i !== -1) box.fieldIds.splice(i, 1);
        writeFieldFlag(tabId, fid, "boxId", chk.checked ? bid : "");
        saveState();
        applyFullFormLayout(tabId);
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".col-edit-box"), function (btn) {
      btn.addEventListener("click", function () {
        var bid = btn.getAttribute("data-box");
        var box = getBoxes(key).filter(function (x) { return x.id === bid; })[0];
        if (!box) return;
        window._editingBoxId = bid;
        if ($("colBoxLabel")) $("colBoxLabel").value = box.label || "";
        if ($("btnAddColBox")) $("btnAddColBox").textContent = "💾 ذخیره ویرایش کادر";
        if ($("colBoxLabel")) $("colBoxLabel").focus();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".col-del-box"), function (btn) {
      btn.addEventListener("click", function () {
        var bid = btn.getAttribute("data-box");
        state.formBoxes[key] = getBoxes(key).filter(function (x) { return x.id !== bid; });
        var el = document.getElementById(bid);
        if (el) el.parentNode && el.parentNode.removeChild(el);
        saveState();
        applyFullFormLayout(tabId);
        renderColBoxList(tabId, key);
      });
    });
  }

  function saveDesignerField(tabId, key, sec) {
    var label = ($("colFieldLabel").value || "").trim();
    if (!label) { alert("عنوان فیلد را بنویسید."); return; }
    var type = $("colFieldType").value;
    var opts = ($("colFieldOpts").value || "").split(/[،,]/).map(function (s) { return s.trim(); }).filter(Boolean);
    var order = parseInt($("colFieldOrder").value, 10);
    if (!order || order < 1) order = getUnifiedFieldList(tabId).length + 1;
    var size = parseInt($("colFieldSize").value, 10) || 220;
    var heightVal = $("colFieldHeight") ? (parseInt($("colFieldHeight").value, 10) || 0) : 0;
    var listOrderVal = $("colFieldListOrder") ? (parseInt($("colFieldListOrder").value, 10) || 0) : 0;
    var addKind = $("colAddKind") ? $("colAddKind").value : "field";
    var placeVal = $("colFieldPlace") ? $("colFieldPlace").value : "beside";
    var reqVal = $("colFieldReq") ? $("colFieldReq").checked : false;
    var excelVal = $("colFieldExcel") ? $("colFieldExcel").checked : false;
    var editing = window._editingColField;

    if (addKind === "box" && !editing) {
      if (!label) { alert("عنوان کادر را بنویسید."); return; }
      getBoxes(key).push({ id: "box-" + key + "-" + Date.now(), label: label, fieldIds: [], order: order, size: size, height: heightVal });
      saveState();
      logOp("افزودن کادر «" + label + "» به تب " + sec.label);
      afterSaveStayOnList();
      if (typeof window.renderColBoxInfoTable === "function") window.renderColBoxInfoTable(tabId, key);
      alert("کادر «" + label + "» در تب «" + sec.label + "» ثبت شد.");
      return;
    }
    if (addKind === "button" && !editing) {
      var wkind = $("colBtnKind") ? $("colBtnKind").value : "widget-save";
      if (typeof window.addWidgetToActiveTab === "function") {
        var w = window.addWidgetToActiveTab(wkind, label || "کلید", { tabId: tabId, allowDup: true });
        if (w) {
          w.order = order;
          w.listOrder = listOrderVal || order;
          w.size = size;
          w.height = heightVal;
          w.place = placeVal;
        }
        saveState();
      }
      afterSaveStayOnList();
      if (typeof window.renderColBtnInfoTable === "function") window.renderColBtnInfoTable(tabId, key);
      return;
    }

    function afterSaveStayOnList() {
      window._editingColField = null;
      fillDesignerForm(null);
      var btn = $("btnSaveColField");
      if (btn) btn.textContent = "ثبت فیلد در تب «" + (sec.label || "") + "»";
      applyFullFormLayout(tabId);
      renderColFieldList();
      renderColTabGrid();
      var box = $("colFieldList");
      if (box) {
        box.scrollIntoView({ block: "start" });
        if (window._colEditScroll) box.scrollTop = window._colEditScroll.list || 0;
      }
      if (window._colEditScroll && window._colEditScroll.y != null) {
        try { window.scrollTo(0, window._colEditScroll.y); } catch (e) {}
      }
    }

    if (editing && editing.builtin) {
      var meta = ensureMeta(key);
      if (!meta[editing.id]) meta[editing.id] = {};
      meta[editing.id].label = label;
      meta[editing.id].size = size;
      if (heightVal > 20) meta[editing.id].height = heightVal;
      if (listOrderVal > 0) meta[editing.id].listOrder = listOrderVal;
      meta[editing.id].place = placeVal || "beside";
      meta[editing.id].showInForm = $("colFieldInForm").checked;
      meta[editing.id].showInList = $("colFieldInList").checked;
      meta[editing.id].hidden = !$("colFieldInForm").checked;
      meta[editing.id].required = reqVal;
      meta[editing.id].exportExcel = excelVal;
      meta[editing.id].allowAddOption = $("colFieldFly") ? $("colFieldFly").checked : true;
      saveState();
      logOp("ویرایش فیلد ثابت «" + label + "» در تب " + sec.label);
      setAnyFieldOrder(tabId, editing.id, order);
      afterSaveStayOnList();
      alert("تغییرات فیلد «" + label + "» ذخیره شد.");
      return;
    }

    if (editing && !editing.builtin) {
      var rec = null;
      getFieldList(key).forEach(function (f) { if (f.id === editing.id) rec = f; });
      if (rec) {
        rec.label = label;
        rec.type = type === "select" ? "select" : "simple";
        rec.inputKind = type;
        rec.options = opts;
        rec.allowAddOption = $("colFieldFly").checked;
        rec.showInForm = $("colFieldInForm").checked;
        rec.showInList = $("colFieldInList").checked;
        rec.size = size;
        if (heightVal > 20) rec.height = heightVal;
        if (listOrderVal > 0) rec.listOrder = listOrderVal;
        if ($("colFieldPlace")) rec.place = $("colFieldPlace").value || "beside";
        rec.dependsOn = ($("colFieldDep").value || "").trim();
        rec.required = reqVal;
        rec.exportExcel = excelVal;
        saveState();
        logOp("ویرایش فیلد «" + label + "» در تب " + sec.label);
        document.querySelectorAll('[data-custom-field-id="' + rec.id + '"]').forEach(function (inp) {
          var g = inp.closest(".form-group");
          if (g) g.remove();
        });
        if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable();
        if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
        setAnyFieldOrder(tabId, rec.id, order);
        afterSaveStayOnList();
        alert("ویرایش فیلد «" + label + "» ذخیره شد و روی فرم تب اعمال گردید.");
        return;
      }
    }

    var neu = {
      id: "cf-" + key + "-" + Date.now(),
      label: label,
      type: type === "select" ? "select" : "simple",
      inputKind: type,
      options: opts,
      allowAddOption: $("colFieldFly").checked,
      showInForm: $("colFieldInForm").checked,
      showInList: $("colFieldInList").checked,
      order: order,
      listOrder: listOrderVal || order,
      size: size,
      height: heightVal || 0,
      place: placeVal || "beside",
      required: reqVal,
      exportExcel: excelVal,
      dependsOn: ($("colFieldDep").value || "").trim()
    };
    getFieldList(key).push(neu);
    saveState();
    logOp("افزودن فیلد «" + label + "» به تب " + sec.label + " با ترتیب " + order);
    if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable();
    if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
    setAnyFieldOrder(tabId, neu.id, order);
    afterSaveStayOnList();
    alert("فیلد «" + label + "» در تب «" + sec.label + "» ثبت شد.");
  }

  function renderColFieldList() {
    var box = $("colFieldList");
    var preview = $("colOrderPreview");
    if (!window._activeColTab) return;
    var tabId = window._activeColTab;
    var key = fieldKeyForTab(tabId);
    var list = getUnifiedFieldList(tabId);
    if (preview) {
      preview.innerHTML = list.length
        ? ("<strong>ردیف‌های فرم این تب:</strong> " + list.map(function (f, i) {
          return (i + 1) + ". " + escHtml(f.label) + (f.hidden ? " (مخفی در فرم)" : "") + (f.showInList ? "" : " (بدون لیست)");
        }).join("  ←  "))
        : "فیلدی در این تب پیدا نشد.";
    }
    if (!box) return;
    if (!list.length) {
      box.innerHTML = "<div class='col-empty'>فیلدی در فرم این تب نیست.</div>";
      return;
    }
    var fontOpts = function (cur) {
      return "<option value=''" + (!cur ? " selected" : "") + ">پیش‌فرض</option>" +
        "<option value='Tahoma'" + (cur === "Tahoma" ? " selected" : "") + ">Tahoma</option>" +
        "<option value='Vazirmatn'" + (cur === "Vazirmatn" ? " selected" : "") + ">وزیر</option>" +
        "<option value='Tahoma, Arial'" + (cur && cur.indexOf("Arial") !== -1 ? " selected" : "") + ">Arial</option>" +
        "<option value='Georgia'" + (cur === "Georgia" ? " selected" : "") + ">Georgia</option>";
    };
    var html = "<table class='data-table'><thead><tr><th>ترتیب فرم</th><th>ترتیب لیست</th><th>عنوان</th><th>نوع</th><th>چینش</th><th>فونت لیبل</th><th>بولد لیبل</th><th>سایز فونت لیبل</th><th>فونت فیلد</th><th>بولد فیلد</th><th>سایز فونت فیلد</th><th>ستاره</th><th>فرم</th><th>لیست</th><th>اکسل</th><th>جابجایی</th><th>عملیات</th></tr></thead><tbody>";
    list.forEach(function (f, i) {
      if (f.kind === "box" || f.kind === "widget" || String(f.inputKind || f.type || "").indexOf("widget-") === 0) return;
      var src = (f.kind === "ordercol" ? "داخل کادر اقلام" : (f.builtin ? "ثابت فرم" : "اضافه‌شده"));
      var hid = f.hidden ? " col-row-hidden" : "";
      var rowNo = list.indexOf(f) + 1;
      var listNo = f.listOrder || rowNo;
      var place = f.place || "beside";
      var labFs = parseInt(f.labelFontSize, 10) || 14;
      var fldFs = parseInt(f.fieldFontSize, 10) || 14;
      if (labFs > 28) labFs = 28;
      if (labFs < 10) labFs = 10;
      if (fldFs > 28) fldFs = 28;
      if (fldFs < 10) fldFs = 10;
      html += "<tr class='" + hid + "' data-fid='" + escHtml(f.id) + "'>" +
        "<td><input type='number' min='1' class='form-input col-order-input' data-fid='" + escHtml(f.id) + "' value='" + rowNo + "' title='ترتیب در فرم ثبت'></td>" +
        "<td><input type='number' min='1' class='form-input col-listorder-input' data-fid='" + escHtml(f.id) + "' value='" + listNo + "' title='ترتیب در لیست'></td>" +
        "<td><strong>" + escHtml(f.label) + "</strong>" + (f.required ? " <span class='col-req-star'>*</span>" : "") + (f.hidden ? " <span class='col-hidden-badge'>مخفی</span>" : "") + "</td>" +
        "<td>" + src + "</td>" +
        "<td><select class='form-select col-place-sel' data-fid='" + escHtml(f.id) + "'><option value='beside'" + (place !== "under" ? " selected" : "") + ">روبرو</option><option value='under'" + (place === "under" ? " selected" : "") + ">زیر هم</option></select></td>" +
        "<td><select class='form-select col-labelfont-sel' data-fid='" + escHtml(f.id) + "'>" + fontOpts(f.labelFontFamily || "") + "</select></td>" +
        "<td style='text-align:center'><input type='checkbox' class='col-labelbold-chk' data-fid='" + escHtml(f.id) + "'" + (f.labelFontWeight === "bold" ? " checked" : "") + "></td>" +
        "<td><input type='number' min='10' max='28' class='form-input col-labelsize-inp' data-fid='" + escHtml(f.id) + "' value='" + labFs + "' title='سایز فونت لیبل ۱۰ تا ۲۸'></td>" +
        "<td><select class='form-select col-fieldfont-sel' data-fid='" + escHtml(f.id) + "'>" + fontOpts(f.fieldFontFamily || "") + "</select></td>" +
        "<td style='text-align:center'><input type='checkbox' class='col-fieldbold-chk' data-fid='" + escHtml(f.id) + "'" + (f.fieldFontWeight === "bold" ? " checked" : "") + "></td>" +
        "<td><input type='number' min='10' max='28' class='form-input col-fieldsize-inp' data-fid='" + escHtml(f.id) + "' value='" + fldFs + "' title='سایز فونت داخل فیلد ۱۰ تا ۲۸'></td>" +
        "<td style='text-align:center'><input type='checkbox' class='col-req-chk' data-fid='" + escHtml(f.id) + "'" + (f.required ? " checked" : "") + " title='الزامی'></td>" +
        "<td style='text-align:center'><input type='checkbox' class='col-flag-form' data-fid='" + escHtml(f.id) + "'" + (f.showInForm ? " checked" : "") + "></td>" +
        "<td style='text-align:center'><input type='checkbox' class='col-flag-list' data-fid='" + escHtml(f.id) + "'" + (f.showInList ? " checked" : "") + "></td>" +
        "<td style='text-align:center'><input type='checkbox' class='col-excel-chk' data-fid='" + escHtml(f.id) + "'" + (f.exportExcel ? " checked" : "") + " title='خروجی اکسل'></td>" +
        "<td><button type='button' class='btn btn-outline btn-sm col-move-up' data-fid='" + escHtml(f.id) + "'>▲ بالاتر</button> " +
        "<button type='button' class='btn btn-outline btn-sm col-move-down' data-fid='" + escHtml(f.id) + "'>▼ پایین‌تر</button></td>" +
        "<td class='col-ops'>";
      html += "<button type='button' class='btn btn-outline btn-sm col-edit-field' data-fid='" + escHtml(f.id) + "'>✏️ ویرایش</button> ";
      html += "<button type='button' class='btn btn-danger btn-sm col-del-field' data-fid='" + escHtml(f.id) + "'>حذف</button>";
      html += "</td></tr>";
    });
    html += "</tbody></table>";
    box.innerHTML = html;

    Array.prototype.forEach.call(box.querySelectorAll(".col-order-input"), function (inp) {
      inp.addEventListener("change", function () {
        setAnyFieldOrder(tabId, inp.getAttribute("data-fid"), parseInt(inp.value, 10));
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-listorder-input"), function (inp) {
      inp.addEventListener("change", function () {
        setListFieldOrder(tabId, inp.getAttribute("data-fid"), parseInt(inp.value, 10));
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-excel-chk"), function (inp) {
      inp.addEventListener("change", function () {
        writeFieldFlag(tabId, inp.getAttribute("data-fid"), "exportExcel", inp.checked);
        saveState();
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-place-sel"), function (sel) {
      sel.addEventListener("change", function () {
        writeFieldFlag(tabId, sel.getAttribute("data-fid"), "place", sel.value);
        saveState();
        applyFullFormLayout(tabId);
      });
    });
    function bindFlag(sel, flag, transform) {
      Array.prototype.forEach.call(box.querySelectorAll(sel), function (el) {
        el.addEventListener("change", function () {
          var v = el.type === "checkbox" ? el.checked : el.value;
          if (transform) v = transform(el);
          writeFieldFlag(tabId, el.getAttribute("data-fid"), flag, v);
          saveState();
          applyFullFormLayout(tabId);
        });
      });
    }
    bindFlag(".col-labelfont-sel", "labelFontFamily");
    bindFlag(".col-labelbold-chk", "labelFontWeight", function (el) { return el.checked ? "bold" : "normal"; });
    bindFlag(".col-labelsize-inp", "labelFontSize", function (el) {
      var n = parseInt(el.value, 10) || 14;
      if (n < 10) n = 10;
      if (n > 28) n = 28;
      el.value = n;
      return String(n);
    });
    bindFlag(".col-fieldfont-sel", "fieldFontFamily");
    bindFlag(".col-fieldbold-chk", "fieldFontWeight", function (el) { return el.checked ? "bold" : "normal"; });
    bindFlag(".col-fieldsize-inp", "fieldFontSize", function (el) {
      var n = parseInt(el.value, 10) || 14;
      if (n < 10) n = 10;
      if (n > 28) n = 28;
      el.value = n;
      return String(n);
    });
    bindFlag(".col-req-chk", "required", function (el) { return el.checked; });
    Array.prototype.forEach.call(box.querySelectorAll(".col-flag-form"), function (inp) {
      inp.addEventListener("change", function () {
        writeFieldFlag(tabId, inp.getAttribute("data-fid"), "showInForm", inp.checked);
        saveState();
        applyFullFormLayout(tabId);
        refreshEntityLists(tabId);
        renderColFieldList();
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-flag-list"), function (inp) {
      inp.addEventListener("change", function () {
        writeFieldFlag(tabId, inp.getAttribute("data-fid"), "showInList", inp.checked);
        saveState();
        refreshEntityLists(tabId);
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-move-up"), function (btn) {
      btn.addEventListener("click", function () { nudgeAnyField(tabId, btn.getAttribute("data-fid"), -1); });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-move-down"), function (btn) {
      btn.addEventListener("click", function () { nudgeAnyField(tabId, btn.getAttribute("data-fid"), 1); });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-edit-field"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-fid");
        var field = getUnifiedFieldList(tabId).filter(function (f) { return f.id === id; })[0];
        if (!field) return;
        window._colEditScroll = { y: window.scrollY, list: box.scrollTop || 0 };
        window._editingColField = field;
        fillDesignerForm(field);
        var lab = $("colFieldLabel");
        if (lab) {
          lab.focus();
          lab.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-del-field"), function (btn) {
      btn.addEventListener("click", function () {
        deleteAnyField(tabId, btn.getAttribute("data-fid"));
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-restore-field"), function (btn) {
      btn.addEventListener("click", function () {
        var meta = ensureMeta(key);
        var id = btn.getAttribute("data-fid");
        if (!meta[id]) meta[id] = {};
        meta[id].hidden = false;
        saveState();
        applyFullFormLayout(tabId);
        renderColFieldList();
        renderColTabGrid();
      });
    });
  }

  function writeFieldOrder(tabId, fieldId, newOrder) {
    var key = fieldKeyForTab(tabId);
    var custom = null;
    getFieldList(key).forEach(function (f) { if (f.id === fieldId) custom = f; });
    if (custom) {
      custom.order = newOrder;
      return;
    }
    var meta = ensureMeta(key);
    if (!meta[fieldId]) meta[fieldId] = {};
    meta[fieldId].order = newOrder;
  }

  function writeListFieldOrder(tabId, fieldId, newOrder) {
    var key = fieldKeyForTab(tabId);
    var custom = null;
    getFieldList(key).forEach(function (f) { if (f.id === fieldId) custom = f; });
    if (custom) {
      custom.listOrder = newOrder;
      return;
    }
    var meta = ensureMeta(key);
    if (!meta[fieldId]) meta[fieldId] = {};
    meta[fieldId].listOrder = newOrder;
  }

  window.writeFieldSize = writeFieldSize;
  function writeFieldSize(tabId, fieldId, size) {
    var key = fieldKeyForTab(tabId);
    var custom = null;
    getFieldList(key).forEach(function (f) { if (f.id === fieldId) custom = f; });
    size = parseInt(size, 10) || 220;
    if (custom) {
      custom.size = size;
      return;
    }
    var meta = ensureMeta(key);
    if (!meta[fieldId]) meta[fieldId] = {};
    meta[fieldId].size = size;
  }

  function writeFieldFlag(tabId, fieldId, flag, value) {
    var key = fieldKeyForTab(tabId);
    var custom = null;
    getFieldList(key).forEach(function (f) { if (f.id === fieldId) custom = f; });
    if (custom) {
      custom[flag] = value;
      if (flag === "showInForm") custom.showInForm = value;
      return;
    }
    var meta = ensureMeta(key);
    if (!meta[fieldId]) meta[fieldId] = {};
    meta[fieldId][flag] = value;
    if (flag === "showInForm") meta[fieldId].hidden = !value;
  }

  function refreshEntityLists(tabId) {
    var key = fieldKeyForTab(tabId);
    try {
      if (key === "pharmacy" && typeof renderPharmaciesList === "function") renderPharmaciesList();
      if (key === "doctor" && typeof renderDoctorsList === "function") renderDoctorsList();
      if (key === "order" && typeof renderOrdersList === "function") renderOrdersList();
    } catch (e) {}
  }

  function reindexOrders(tabId, orderedIds) {
    orderedIds.forEach(function (id, i) { writeFieldOrder(tabId, id, i + 1); });
  }

  function ensureSequentialOrders(tabId) {
    var list = getUnifiedFieldList(tabId);
    var ok = true;
    list.forEach(function (f, i) {
      if (Number(f.order) !== i + 1) ok = false;
    });
    if (ok) return;
    reindexOrders(tabId, list.map(function (f) { return f.id; }));
    try { saveState(false); } catch (e) {}
  }

  function setListFieldOrder(tabId, fieldId, newOrder) {
    var list = getUnifiedFieldList(tabId).slice().sort(function (a, b) {
      var ao = Number(a.listOrder) || Number(a.order) || 999;
      var bo = Number(b.listOrder) || Number(b.order) || 999;
      if (ao !== bo) return ao - bo;
      return String(a.id).localeCompare(String(b.id));
    });
    var ids = list.map(function (f) { return f.id; });
    var from = ids.indexOf(fieldId);
    if (from < 0) return;
    var rowNum = parseInt(newOrder, 10);
    if (!rowNum || rowNum < 1) rowNum = 1;
    if (rowNum > ids.length) rowNum = ids.length;
    ids.splice(from, 1);
    ids.splice(rowNum - 1, 0, fieldId);
    ids.forEach(function (id, i) { writeListFieldOrder(tabId, id, i + 1); });
    saveState();
    logOp("انتقال ستون لیست به ردیف " + rowNum);
    renderColFieldList();
    refreshEntityLists(tabId);
  }

  function setAnyFieldOrder(tabId, fieldId, newOrder) {
    var list = getUnifiedFieldList(tabId);
    var ids = list.map(function (f) { return f.id; });
    var from = ids.indexOf(fieldId);
    if (from < 0) return;
    var rowNum = parseInt(newOrder, 10);
    if (!rowNum || rowNum < 1) rowNum = 1;
    if (rowNum > ids.length) rowNum = ids.length;
    ids.splice(from, 1);
    ids.splice(rowNum - 1, 0, fieldId);
    reindexOrders(tabId, ids);
    saveState();
    logOp("انتقال فیلد به ردیف " + rowNum);
    applyFullFormLayout(tabId);
    renderColFieldList();
    refreshEntityLists(tabId);
  }

  function nudgeAnyField(tabId, fieldId, dir) {
    var list = getUnifiedFieldList(tabId);
    var ids = list.map(function (f) { return f.id; });
    var from = ids.indexOf(fieldId);
    var to = from + dir;
    if (from < 0 || to < 0 || to >= ids.length) return;
    ids.splice(from, 1);
    ids.splice(to, 0, fieldId);
    reindexOrders(tabId, ids);
    saveState();
    logOp("جابجایی فیلد به ردیف " + (to + 1));
    applyFullFormLayout(tabId);
    renderColFieldList();
    refreshEntityLists(tabId);
  }

  function deleteAnyField(tabId, fieldId) {
    var key = fieldKeyForTab(tabId);
    var custom = null;
    getFieldList(key).forEach(function (f) { if (f.id === fieldId) custom = f; });
    if (custom) {
      if (!confirm("فیلد «" + custom.label + "» از فرم تب «" + (tabId) + "» حذف شود؟")) return;
      state.customFields[key] = getFieldList(key).filter(function (f) { return f.id !== fieldId; });
      document.querySelectorAll('[data-custom-field-id="' + fieldId + '"]').forEach(function (inp) {
        var g = inp.closest(".form-group");
        if (g) g.remove();
        else inp.remove();
      });
      saveState();
      logOp("حذف فیلد «" + custom.label + "» از فرم تب");
      if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable();
      if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
      applyFullFormLayout(tabId);
      renderColDesignerPanel();
      renderColTabGrid();
      alert("فیلد از فرم تب اصلی هم حذف شد.");
      return;
    }
    var unified = getUnifiedFieldList(tabId);
    var field = unified.filter(function (f) { return f.id === fieldId; })[0];
    var label = field ? field.label : fieldId;
    if (!confirm("فیلد «" + label + "» کاملاً از فرم این تب حذف شود؟ (برگشت با دکمه بازگردانی پایین طراح)")) return;
    var meta = ensureMeta(key);
    if (!meta[fieldId]) meta[fieldId] = {};
    meta[fieldId].deleted = true;
    meta[fieldId].hidden = true;
    var live = document.getElementById(fieldId);
    if (live) {
      var grp = live.closest(".form-group, .col-widget-wrap");
      if (grp && grp.parentNode) grp.parentNode.removeChild(grp);
    }
    saveState();
    applyFullFormLayout(tabId);
    logOp("حذف کامل فیلد «" + label + "» از فرم تب");
    refreshEntityLists(tabId);
    renderColFieldList();
    renderColTabGrid();
    alert("فیلد «" + label + "» کاملاً حذف شد.");
  }

  window.isColShownInList = function (entity, fieldId) {
    var customs = (state.customFields && state.customFields[entity]) || [];
    var cf = null;
    customs.forEach(function (f) { if (f.id === fieldId) cf = f; });
    if (cf) return cf.showInList !== false;
    var meta = ((state.formFieldMeta || {})[entity] || {})[fieldId];
    if (meta && meta.showInList === false) return false;
    if (meta && meta.showInList === true) return true;
    return (DEFAULT_LIST_ON[entity] || []).indexOf(fieldId) !== -1;
  };

  window.builtinFieldValue = function (entity, fieldId, rec) {
    if (!rec) return "—";
    var map = {
      pharmacyDate: rec.dateAdded,
      pharmacyProvince: rec.province,
      pharmacyCity: rec.city,
      pharmacyDistrict: rec.district,
      pharmacyName: rec.name,
      pharmacyPhone: rec.phone,
      pharmacyManager: rec.manager,
      pharmacyManagerPhone: rec.managerPhone,
      pharmacyAddress: rec.address,
      pharmacyIsPercentage: rec.isPercentage ? "بله" : "خیر",
      phFileInput: rec.fileName,
      phMapSearchInput: (rec.lat && rec.lng) ? "ثبت شده" : "ثبت نشده",
      doctorDate: rec.dateAdded,
      doctorName: rec.name,
      doctorSpecialty: rec.specialty,
      doctorPhone: rec.phone,
      doctorProvince: [rec.province, rec.city, rec.district].filter(Boolean).join(" / "),
      doctorCity: rec.city,
      doctorDistrict: rec.district,
      doctorAddress: rec.address,
      doctorIsPercentage: rec.isPercentage ? "بله" : "خیر",
      docFileInput: rec.fileName,
      docMapSearchInput: (rec.lat && rec.lng) ? "ثبت شده" : "ثبت نشده",
      orderPharmacyName: rec.pharmacyName,
      orderProvince: [rec.province, rec.city].filter(Boolean).join(" / "),
      orderCity: rec.city,
      orderDistrict: rec.district,
      orderAddress: rec.address,
      orderRepName: rec.repName,
      orderDate: rec.orderDate,
      orderStatus: rec.status,
      orderNotes: rec.notes
    };
    var v = map[fieldId];
    return (v == null || v === "") ? "—" : v;
  };

  window.extraListColumns = function (entity) {
    var meta = ((state.formFieldMeta || {})[entity]) || {};
    var defs = DEFAULT_LIST_ON[entity] || [];
    var out = [];
    Object.keys(meta).forEach(function (id) {
      if (!meta[id] || meta[id].showInList !== true) return;
      if (defs.indexOf(id) !== -1) return;
      out.push({ id: id, label: meta[id].label || id });
    });
    return out;
  };

  function tabLabelOfPane(el) {
    var pane = el.closest(".tab-pane");
    if (!pane || !pane.id || typeof MENU_SECTIONS_LIST === "undefined") return "سایر";
    var sec = MENU_SECTIONS_LIST.filter(function (s) { return s.id === pane.id; })[0];
    return sec ? (sec.icon + " " + sec.label) : pane.id;
  }

  window.applySelectExtraOptions = function () {
    if (!state || !state.selectExtraOptions) return;
    Object.keys(state.selectExtraOptions).forEach(function (id) {
      var sel = document.getElementById(id);
      if (!sel || sel.tagName !== "SELECT") return;
      (state.selectExtraOptions[id] || []).forEach(function (opt) {
        var exists = false;
        Array.prototype.forEach.call(sel.options, function (o) { if (o.value === opt) exists = true; });
        if (!exists) {
          var o = document.createElement("option");
          o.value = opt;
          o.textContent = opt;
          sel.appendChild(o);
        }
      });
    });
  };

  window.renderAllSystemSelects = function () {
    var box = $("tableAllSelectsBody");
    if (!box) return;
    window.applySelectExtraOptions();
    var rows = [];
    document.querySelectorAll("select.form-select, select[id]").forEach(function (sel) {
      if (!sel.id) return;
      if (sel.closest("#jalaliCalendarPopup") || sel.closest("#columnsDesignerHost") || sel.closest(".modal-overlay")) return;
      if (sel.id.indexOf("jalali") === 0) return;
      var label = "";
      var lab = document.querySelector('label[for="' + sel.id + '"]');
      if (lab) label = lab.textContent.replace(/\s+/g, " ").trim();
      if (!label) {
        var g = sel.closest(".form-group");
        if (g) {
          var l2 = g.querySelector(".form-label, label");
          if (l2) label = l2.textContent.replace(/\s+/g, " ").trim();
        }
      }
      if (!label) label = sel.id;
      var opts = [];
      Array.prototype.forEach.call(sel.options, function (o) {
        if (o.value) opts.push(o.textContent || o.value);
      });
      rows.push({
        id: sel.id,
        tab: tabLabelOfPane(sel),
        label: label,
        opts: opts
      });
    });
    if (!rows.length) {
      box.innerHTML = "<tr><td colspan='5'>کشویی‌ای پیدا نشد.</td></tr>";
      return;
    }
    box.innerHTML = rows.map(function (r) {
      return "<tr><td>" + escHtml(r.tab) + "</td><td><strong>" + escHtml(r.label) + "</strong></td><td dir='ltr'>" + escHtml(r.id) + "</td><td>" + escHtml(r.opts.slice(0, 12).join("، ")) + (r.opts.length > 12 ? "…" : "") + "</td>" +
        "<td><button type='button' class='btn btn-outline btn-sm btn-add-sel-opt' data-sid='" + escHtml(r.id) + "' data-slabel='" + escHtml(r.label) + "'>➕ گزینه جدید</button></td></tr>";
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll(".btn-add-sel-opt"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-sid");
        var slabel = btn.getAttribute("data-slabel") || id;
        var val = prompt("گزینه جدید برای «" + slabel + "»:");
        if (!val || !String(val).trim()) return;
        val = String(val).trim();
        if (!state.selectExtraOptions) state.selectExtraOptions = {};
        if (!state.selectExtraOptions[id]) state.selectExtraOptions[id] = [];
        if (state.selectExtraOptions[id].indexOf(val) === -1) state.selectExtraOptions[id].push(val);
        saveState();
        window.applySelectExtraOptions();
        window.renderAllSystemSelects();
        logOp("افزودن گزینه «" + val + "» به کشویی " + slabel);
        alert("گزینه «" + val + "» به فیلد «" + slabel + "» اضافه شد.");
      });
    });
  };

  function applyFieldPermissions() {
    var role = sessionStorage.getItem("crmUserRole") || "";
    var name = sessionStorage.getItem("crmUserName") || "";
    var user = (state.users || []).find(function (u) { return u.fullName === name; });
    if (!user || !user.permissions) return;
    var p = user.permissions;
    var hideTab = function (id, key) {
      if (p[key] === false) {
        document.querySelectorAll('[data-target="' + id + '"],[data-side-target="' + id + '"]').forEach(function (b) { b.style.display = "none"; });
        var pane = $(id);
        if (pane) pane.style.display = "none";
      }
    };
    hideTab("tab-pharmacies", "ph_access");
    hideTab("tab-doctors", "doc_access");
    hideTab("tab-orders", "ord_access");
    hideTab("tab-snapp-corporate", "sys_snapp_access");
    hideTab("tab-users-permissions", "sys_users");
    hideTab("tab-backup", "sys_users");
    if (p.ph_percentage === false) {
      var el = document.querySelector("#pharmacyIsPercentage");
      if (el && el.closest(".form-group")) el.closest(".form-group").style.display = "none";
    }
    if (p.ph_create_loc === false) {
      var loc = $("phMapSearchInput");
      if (loc && loc.closest(".form-group")) loc.closest(".form-group").parentElement.style.display = "none";
    }
  }

  function renderDiagOps() {
    var box = $("diagnosticsOpsLog");
    if (!box) return;
    var logs = (state && state.diagLog) || [];
    try {
      if (!logs.length) logs = JSON.parse(localStorage.getItem("CRM_DIAG_LOG") || "[]");
    } catch (e) {}
    box.innerHTML = logs.slice(0, 80).map(function (l) {
      return '<div class="diag-row"><span class="diag-dot ok"></span><strong>' + (l.t || "") + "</strong><span>" + (l.user || "") + " — " + (l.msg || "") + "</span></div>";
    }).join("") || "<div class='diag-row'>هنوز عملیاتی ثبت نشده.</div>";
  }

  function enhanceOverviewSearch() {
    var btn = $("btnFocusMapRegion");
    if (!btn || btn.dataset.v11 === "1") return;
    btn.dataset.v11 = "1";
    btn.addEventListener("click", function () {
      var box = $("overviewResultsTableWrap");
      if (!box) return;
      var p = ($("mapFilterProvince") || {}).value;
      var c = ($("mapFilterCity") || {}).value;
      var d = ($("mapFilterDistrict") || {}).value;
      var iran = p === "ایران" || !p;
      var fac = (window.IRAN_FACILITIES || []).concat(state.pharmacies || []).concat(state.doctors || []).concat(state.hospitals || []);
      var rows = fac.filter(function (f) {
        if (iran) return true;
        if (p && f.province && f.province !== p) return false;
        if (c && f.city && f.city !== c) return false;
        if (d && f.district && f.district !== d) return false;
        return true;
      });
      box.innerHTML = "<table class='data-table'><thead><tr><th>ردیف</th><th>نوع</th><th>نام</th><th>تخصص/ساعت</th><th>شهر</th><th>آدرس</th></tr></thead><tbody>" +
        rows.slice(0, 80).map(function (r, i) {
          return "<tr><td>" + (i + 1) + "</td><td>" + (r.kind || r.type || "مرکز") + "</td><td>" + (r.name || "") + "</td><td>" + (r.specialty || r.hours || "") + "</td><td>" + (r.city || "") + "</td><td>" + (r.address || "") + "</td></tr>";
        }).join("") + "</tbody></table>";
    });
  }

  function preciseLocationInputs() {
    ["pharmacyLat", "pharmacyLng", "doctorLat", "doctorLng"].forEach(function (id) {
      var el = $(id);
      if (el) el.setAttribute("step", "0.000001");
    });
  }

  function boot() {
    try {
      if (state && !state.diagLog) {
        try { state.diagLog = JSON.parse(localStorage.getItem("CRM_DIAG_LOG") || "[]"); } catch (e) { state.diagLog = []; }
      }
    } catch (e) {}
    try { persistUsersToAuth(); } catch (e) {}
    try { patchUserCardsWithPasswordChange(); } catch (e) { console.error(e); }
    try { refreshAllDateBadges(); } catch (e) {}
    try { setupInstantAddAll(); } catch (e) {}
    try { realRowLists(); } catch (e) {}
    try { patchExcel(); } catch (e) {}
    try { setupVisitButtons(); } catch (e) {}
    try { renderActivityMapAndChart(); } catch (e) {}
    try {
      if (typeof deleteCustomField === "function" && !window._colDelPatched) {
        window._colDelPatched = true;
        var origDel = deleteCustomField;
        window.deleteCustomField = function (entity, fieldId) {
          origDel(entity, fieldId);
          if (typeof window.refreshColumnsDesigner === "function") window.refreshColumnsDesigner();
        };
      }
    } catch (e) {}
    try { setupColumnsDesigner(); } catch (e) {}
    try { if (typeof window.renderExtraTabCustomFields === "function") window.renderExtraTabCustomFields(); } catch (e) {}
    try {
      if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
      window.applyAllFormLayouts();
    } catch (e) {}
    try { if (typeof mergeCatalogIntoOrderItems === "function") mergeCatalogIntoOrderItems(); } catch (e) {}
    try { window.applySelectExtraOptions(); } catch (e) {}
    try { window.renderAllSystemSelects(); } catch (e) {}
    try { applyFieldPermissions(); } catch (e) {}
    try { renderDiagOps(); } catch (e) {}
    try { enhanceOverviewSearch(); } catch (e) {}
    try { preciseLocationInputs(); } catch (e) {}

    var origSw = window.switchTab;
    if (typeof origSw === "function") {
      window.switchTab = function (id) {
        origSw(id);
        setTimeout(function () {
          realRowLists();
          refreshAllDateBadges();
          if (id === "tab-activity-log") renderActivityMapAndChart();
          if (id === "tab-my-visit") { updateVisitUi(); drawVisitOnMaps(); if (visitMap) visitMap.invalidateSize(); }
          if (id === "tab-columns-products") setupColumnsDesigner();
          if (id === "tab-troubleshooting") renderDiagOps();
          if (id === "tab-users-permissions") patchUserCardsWithPasswordChange();
          if (id === "tab-custom-fields" && typeof window.renderAllSystemSelects === "function") window.renderAllSystemSelects();
          if (id === "tab-orders" && typeof mergeCatalogIntoOrderItems === "function") mergeCatalogIntoOrderItems();
          try { applyFullFormLayout(id); } catch (e) {}
        }, 120);
      };
    }

    ["tablePharmaciesBody", "tableDoctorsBody", "tableOrdersBody"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var obs = new MutationObserver(function () { realRowLists(); });
      obs.observe(el, { childList: true });
    });

    window.getUnifiedFieldList = getUnifiedFieldList;
    window.paintFieldBox = paintFieldBox;
    window.paintRequiredStar = paintRequiredStar;
    window.groupIsShared = groupIsShared;
    logOp("بارگذاری نسخه ۱۱.۱۴");
    console.log("v11.14 ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
