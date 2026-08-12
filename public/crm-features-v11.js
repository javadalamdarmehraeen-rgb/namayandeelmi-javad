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
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", month: "short", day: "numeric" }).formatToParts(new Date());
    var m = "AUG", d = "13";
    parts.forEach(function (p) {
      if (p.type === "month") m = p.value.toUpperCase();
      if (p.type === "day") d = p.value;
    });
    return { m: m, d: d };
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
      downloadExcelBordered(filename, hdrs, rws);
      try { orig(filename, hdrs, rws); } catch (e) {}
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

  function setupColumnsDesigner() {
    var host = $("columnsDesignerHost");
    if (!host || host.dataset.ready === "1") return;
    host.dataset.ready = "1";
    var tabs = [
      { id: "pharmacy", label: "داروخانه‌ها" },
      { id: "doctor", label: "پزشکان" },
      { id: "order", label: "سفارشات" },
      { id: "leave", label: "مرخصی" },
      { id: "target", label: "تارگت فروش" }
    ];
    host.innerHTML = '<div class="form-grid">' +
      '<div class="form-group"><label class="form-label">تب هدف</label><select id="colTabSelect" class="form-select">' +
      tabs.map(function (t) { return '<option value="' + t.id + '">' + t.label + "</option>"; }).join("") +
      '</select></div>' +
      '<div class="form-group"><label class="form-label">عنوان فیلد</label><input id="colFieldLabel" class="form-input" placeholder="مثلاً کد اقتصادی"></div>' +
      '<div class="form-group"><label class="form-label">نوع</label><select id="colFieldType" class="form-select"><option value="simple">ساده</option><option value="select">کشویی</option><option value="date">تاریخ</option><option value="number">عددی</option></select></div>' +
      '<div class="form-group"><label class="form-label">شماره ترتیب</label><input id="colFieldOrder" class="form-input" type="number" value="10"></div>' +
      '<div class="form-group"><label class="form-label">اندازه (px)</label><input id="colFieldSize" class="form-input" type="number" value="220"></div>' +
      '<div class="form-group"><label class="form-label">وابسته به فیلد</label><input id="colFieldDep" class="form-input" placeholder="شناسه فیلد والد (اختیاری)"></div>' +
      '<div class="form-group"><label class="form-label">گزینه‌های کشویی</label><input id="colFieldOpts" class="form-input" placeholder="با ویرگول"></div>' +
      '<div class="form-group"><label><input type="checkbox" id="colFieldFly" checked> افزودن لحظه‌ای</label></div>' +
      '</div><div style="margin-top:1rem;text-align:left"><button type="button" id="btnSaveColField" class="btn btn-primary" style="background:#0d9488">ثبت فیلد در تب</button></div>' +
      '<div id="colFieldList" class="table-responsive" style="margin-top:1rem"></div>';
    $("btnSaveColField").addEventListener("click", function () {
      if (!state.customFields) state.customFields = {};
      var tab = $("colTabSelect").value;
      if (!state.customFields[tab]) state.customFields[tab] = [];
      var type = $("colFieldType").value;
      var label = $("colFieldLabel").value.trim();
      if (!label) { alert("عنوان فیلد را بنویسید."); return; }
      var opts = ($("colFieldOpts").value || "").split(/[،,]/).map(function (s) { return s.trim(); }).filter(Boolean);
      var rec = {
        id: "cf-" + tab + "-" + Date.now(),
        label: label,
        type: type === "select" ? "select" : "simple",
        inputKind: type,
        options: opts,
        allowAddOption: $("colFieldFly").checked,
        showInForm: true,
        showInList: true,
        order: parseInt($("colFieldOrder").value, 10) || 10,
        size: parseInt($("colFieldSize").value, 10) || 220,
        dependsOn: $("colFieldDep").value.trim()
      };
      state.customFields[tab].push(rec);
      saveState();
      logOp("افزودن فیلد «" + label + "» به تب " + tab);
      if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable();
      if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
      renderColFieldList();
      alert("فیلد به تب مربوطه و بخش افزودن‌ها اضافه شد.");
    });
    renderColFieldList();
  }

  function renderColFieldList() {
    var box = $("colFieldList");
    if (!box || !state) return;
    var html = "<table class='data-table'><thead><tr><th>تب</th><th>عنوان</th><th>نوع</th><th>ترتیب</th><th>اندازه</th><th>حذف</th></tr></thead><tbody>";
    Object.keys(state.customFields || {}).forEach(function (tab) {
      (state.customFields[tab] || []).forEach(function (f) {
        html += "<tr><td>" + tab + "</td><td>" + f.label + "</td><td>" + (f.type === "select" ? "کشویی" : "ساده") + "</td><td>" + (f.order || "-") + "</td><td>" + (f.size || "-") + "</td>" +
          "<td><button class='btn btn-danger btn-sm' onclick=\"deleteCustomField('" + tab + "','" + f.id + "')\">حذف</button></td></tr>";
      });
    });
    html += "</tbody></table>";
    box.innerHTML = html;
  }

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
    try { setupColumnsDesigner(); } catch (e) {}
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
        }, 120);
      };
    }

    ["tablePharmaciesBody", "tableDoctorsBody", "tableOrdersBody"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var obs = new MutationObserver(function () { realRowLists(); });
      obs.observe(el, { childList: true });
    });

    logOp("بارگذاری نسخه ۱۱");
    console.log("v11 ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
