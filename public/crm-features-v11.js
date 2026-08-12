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

  var COL_TAB_KEYS = {
    "tab-dashboard": "dashboard",
    "tab-pharmacies": "pharmacy",
    "tab-doctors": "doctor",
    "tab-orders": "order",
    "tab-activity-log": "activity",
    "tab-overview-map": "overview",
    "tab-live-location": "live",
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

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fieldKeyForTab(tabId) {
    return COL_TAB_KEYS[tabId] || String(tabId || "").replace(/^tab-/, "") || "misc";
  }

  function containerIdForKey(key) {
    return COL_KNOWN_HOSTS[key] || ("cfHost-" + key);
  }

  function getFieldList(key) {
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

  window.applyCustomFieldOrderInForm = function (entityType, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var form = container.closest("form");
    var grid = form ? form.querySelector(".form-grid") : null;
    if (grid === container) grid = null;
    var fields = ((state.customFields || {})[entityType] || []).slice()
      .filter(function (f) { return f.showInForm !== false; })
      .sort(function (a, b) {
        return (Number(a.order) || 999) - (Number(b.order) || 999);
      });
    var items = [];
    fields.forEach(function (field) {
      var root = grid || container;
      var input = root.querySelector('[data-custom-field-id="' + field.id + '"]') ||
        container.querySelector('[data-custom-field-id="' + field.id + '"]');
      if (!input) return;
      var group = input.closest(".form-group");
      if (!group) return;
      var size = parseInt(field.size, 10);
      if (size > 40) {
        group.style.maxWidth = size + "px";
        group.style.width = "100%";
      } else {
        group.style.maxWidth = "";
      }
      group.setAttribute("data-cf-order", String(field.order || ""));
      items.push({ field: field, group: group });
      if (group.parentNode) group.parentNode.removeChild(group);
    });
    if (!grid) {
      items.forEach(function (it) { container.appendChild(it.group); });
      bindFieldDependencies(entityType, containerId);
      return;
    }
    items.forEach(function (it) {
      var order = parseInt(it.field.order, 10);
      var kids = Array.prototype.filter.call(grid.children, function (ch) {
        return ch !== container && ch.nodeType === 1;
      });
      if (!order || order < 1) {
        grid.insertBefore(it.group, container);
        return;
      }
      var idx = Math.min(order - 1, kids.length);
      if (kids[idx]) grid.insertBefore(it.group, kids[idx]);
      else grid.insertBefore(it.group, container);
    });
    bindFieldDependencies(entityType, containerId);
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
    if (typeof MENU_SECTIONS_LIST === "undefined") return;
    MENU_SECTIONS_LIST.forEach(function (sec) {
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
    if (host.dataset.v111 !== "1") {
      host.dataset.v111 = "1";
      host.dataset.ready = "1";
      host.innerHTML =
        '<p class="col-tab-hint">همه تب‌های برنامه مثل داشبورد اینجاست. روی یک تب بزنید تا فقط فیلدهای همان تب را اضافه یا حذف کنید.</p>' +
        '<div class="col-tab-grid" id="colTabGrid"></div>' +
        '<div class="col-designer-panel" id="colDesignerPanel" hidden></div>';
    }
    renderColTabGrid();
    if (window._activeColTab) renderColDesignerPanel();
  }

  function renderColTabGrid() {
    var grid = $("colTabGrid");
    if (!grid || typeof MENU_SECTIONS_LIST === "undefined") return;
    var html = "";
    MENU_SECTIONS_LIST.forEach(function (sec) {
      var key = fieldKeyForTab(sec.id);
      var n = ((state && state.customFields && state.customFields[key]) || []).length;
      var active = window._activeColTab === sec.id ? " active" : "";
      html += '<button type="button" class="col-tab-card' + active + '" data-col-tab="' + sec.id + '">' +
        '<span class="col-tab-icon">' + sec.icon + '</span>' +
        '<span class="col-tab-meta"><span class="col-tab-label">' + escHtml(sec.label) + '</span>' +
        '<span class="col-tab-count">' + n + " فیلد</span></span></button>";
    });
    grid.innerHTML = html;
    Array.prototype.forEach.call(grid.querySelectorAll(".col-tab-card"), function (btn) {
      btn.addEventListener("click", function () {
        window._activeColTab = btn.getAttribute("data-col-tab");
        renderColTabGrid();
        renderColDesignerPanel();
        var panel = $("colDesignerPanel");
        if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
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
    var sec = ((typeof MENU_SECTIONS_LIST !== "undefined" ? MENU_SECTIONS_LIST : []).filter(function (s) {
      return s.id === tabId;
    })[0]) || { label: tabId, icon: "🧱" };
    var key = fieldKeyForTab(tabId);
    ensureFieldHost(tabId, key);
    var rawList = getFieldList(key);
    var maxOrd = 0;
    rawList.forEach(function (f) {
      if (Number(f.order) > maxOrd) maxOrd = Number(f.order);
    });
    var filled = false;
    rawList.forEach(function (f) {
      if (f.order == null || f.order === "" || isNaN(Number(f.order))) {
        maxOrd += 1;
        f.order = maxOrd;
        filled = true;
      }
    });
    if (filled) { try { saveState(false); } catch (e) {} }
    var list = sortedFields(key);
    panel.hidden = false;
    panel.innerHTML =
      '<div class="col-panel-head">' +
        "<div><strong>" + sec.icon + " " + escHtml(sec.label) + "</strong>" +
        '<div class="col-panel-sub">حذف و اضافه فقط برای همین تب. شماره ترتیب، جای فیلد را در فرم همین تب عوض می‌کند (۱ = اولین فیلد فرم).</div></div>' +
        '<div class="col-panel-actions">' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnColOpenTab" style="background:#0d9488">باز کردن فرم این تب</button>' +
          '<button type="button" class="btn btn-outline btn-sm" id="btnColBackToGrid">بازگشت به لیست تب‌ها</button>' +
        "</div>" +
      "</div>" +
      '<div class="form-grid col-add-grid">' +
        '<div class="form-group"><label class="form-label">عنوان فیلد</label><input id="colFieldLabel" class="form-input" placeholder="مثلاً کد اقتصادی"></div>' +
        '<div class="form-group"><label class="form-label">نوع</label><select id="colFieldType" class="form-select"><option value="simple">ساده (متنی)</option><option value="select">کشویی</option><option value="date">تاریخ</option><option value="number">عددی</option></select></div>' +
        '<div class="form-group"><label class="form-label">شماره ترتیب در فرم</label><input id="colFieldOrder" class="form-input" type="number" min="1" value="' + (list.length + 1) + '"><small class="col-help">۱ یعنی اولین فیلد فرم این تب، ۲ یعنی دوم</small></div>' +
        '<div class="form-group"><label class="form-label">اندازه (پیکسل)</label><input id="colFieldSize" class="form-input" type="number" min="80" value="220"></div>' +
        '<div class="form-group" id="colFieldOptsWrap"><label class="form-label">گزینه‌های کشویی</label><input id="colFieldOpts" class="form-input" placeholder="با ویرگول جدا کنید"></div>' +
        '<div class="form-group"><label class="form-label">وابسته به فیلد (شناسه اختیاری)</label><input id="colFieldDep" class="form-input" placeholder="خالی بماند اگر مستقل است"></div>' +
        '<div class="form-group"><label><input type="checkbox" id="colFieldFly" checked> افزودن لحظه‌ای گزینه</label></div>' +
        '<div class="form-group"><label><input type="checkbox" id="colFieldInForm" checked> نمایش در فرم</label></div>' +
        '<div class="form-group"><label><input type="checkbox" id="colFieldInList" checked> نمایش در لیست</label></div>' +
      "</div>" +
      '<div class="col-add-actions"><button type="button" id="btnSaveColField" class="btn btn-primary" style="background:#0d9488">ثبت فیلد در تب «' + escHtml(sec.label) + "»</button></div>" +
      '<div class="col-preview" id="colOrderPreview"></div>' +
      '<div id="colFieldList" class="table-responsive" style="margin-top:1rem"></div>';

    var typeSel = $("colFieldType");
    var optsWrap = $("colFieldOptsWrap");
    function toggleOpts() {
      if (optsWrap) optsWrap.style.display = typeSel && typeSel.value === "select" ? "" : "none";
    }
    if (typeSel) typeSel.addEventListener("change", toggleOpts);
    toggleOpts();

    if ($("btnColBackToGrid")) {
      $("btnColBackToGrid").addEventListener("click", function () {
        window._activeColTab = "";
        renderColTabGrid();
        renderColDesignerPanel();
      });
    }
    if ($("btnColOpenTab")) {
      $("btnColOpenTab").addEventListener("click", function () {
        if (typeof switchTab === "function") switchTab(tabId);
      });
    }

    if ($("btnSaveColField")) {
      $("btnSaveColField").addEventListener("click", function () {
        var label = ($("colFieldLabel").value || "").trim();
        if (!label) { alert("عنوان فیلد را بنویسید."); return; }
        var type = $("colFieldType").value;
        var opts = ($("colFieldOpts").value || "").split(/[،,]/).map(function (s) { return s.trim(); }).filter(Boolean);
        var order = parseInt($("colFieldOrder").value, 10);
        if (!order || order < 1) order = getFieldList(key).length + 1;
        var rec = {
          id: "cf-" + key + "-" + Date.now(),
          label: label,
          type: type === "select" ? "select" : "simple",
          inputKind: type,
          options: opts,
          allowAddOption: $("colFieldFly").checked,
          showInForm: $("colFieldInForm").checked,
          showInList: $("colFieldInList").checked,
          order: order,
          size: parseInt($("colFieldSize").value, 10) || 220,
          dependsOn: ($("colFieldDep").value || "").trim()
        };
        getFieldList(key).push(rec);
        saveState();
        logOp("افزودن فیلد «" + label + "» به تب " + sec.label + " با ترتیب " + order);
        if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable();
        if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
        renderColDesignerPanel();
        renderColTabGrid();
        alert("فیلد «" + label + "» در تب «" + sec.label + "» ثبت شد و در جایگاه " + order + " فرم قرار گرفت.");
      });
    }

    renderColFieldList();
  }

  function renderColFieldList() {
    var box = $("colFieldList");
    var preview = $("colOrderPreview");
    if (!window._activeColTab) return;
    var key = fieldKeyForTab(window._activeColTab);
    var list = sortedFields(key);
    if (preview) {
      preview.innerHTML = list.length
        ? ("<strong>ترتیب فعلی در فرم:</strong> " + list.map(function (f, i) {
          return (f.order || (i + 1)) + ". " + escHtml(f.label);
        }).join("  ←  "))
        : "هنوز فیلدی برای این تب نیست.";
    }
    if (!box) return;
    if (!list.length) {
      box.innerHTML = "<div class='col-empty'>فیلدی در این تب نیست. از فرم بالا اضافه کنید.</div>";
      return;
    }
    var html = "<table class='data-table'><thead><tr><th>ترتیب</th><th>عنوان</th><th>نوع</th><th>اندازه</th><th>جابجایی</th><th>حذف</th></tr></thead><tbody>";
    list.forEach(function (f, i) {
      var kind = f.inputKind || (f.type === "select" ? "select" : "simple");
      var kindFa = kind === "select" ? "کشویی" : kind === "date" ? "تاریخ" : kind === "number" ? "عددی" : "ساده";
      html += "<tr>" +
        "<td><input type='number' min='1' class='form-input col-order-input' data-fid='" + escHtml(f.id) + "' value='" + (f.order || i + 1) + "'></td>" +
        "<td><strong>" + escHtml(f.label) + "</strong></td>" +
        "<td>" + kindFa + "</td>" +
        "<td>" + (f.size || "—") + "</td>" +
        "<td><button type='button' class='btn btn-outline btn-sm col-move-up' data-fid='" + escHtml(f.id) + "'>▲ بالاتر</button> " +
        "<button type='button' class='btn btn-outline btn-sm col-move-down' data-fid='" + escHtml(f.id) + "'>▼ پایین‌تر</button></td>" +
        "<td><button type='button' class='btn btn-danger btn-sm col-del-field' data-fid='" + escHtml(f.id) + "'>حذف</button></td></tr>";
    });
    html += "</tbody></table>";
    box.innerHTML = html;

    Array.prototype.forEach.call(box.querySelectorAll(".col-order-input"), function (inp) {
      inp.addEventListener("change", function () {
        setColFieldOrder(key, inp.getAttribute("data-fid"), parseInt(inp.value, 10));
      });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-move-up"), function (btn) {
      btn.addEventListener("click", function () { nudgeColField(key, btn.getAttribute("data-fid"), -1); });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-move-down"), function (btn) {
      btn.addEventListener("click", function () { nudgeColField(key, btn.getAttribute("data-fid"), 1); });
    });
    Array.prototype.forEach.call(box.querySelectorAll(".col-del-field"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-fid");
        if (typeof deleteCustomField === "function") deleteCustomField(key, id);
        else {
          state.customFields[key] = getFieldList(key).filter(function (f) { return f.id !== id; });
          saveState();
          if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
        }
        renderColDesignerPanel();
        renderColTabGrid();
      });
    });
  }

  function setColFieldOrder(key, fieldId, newOrder) {
    var list = getFieldList(key);
    var field = null;
    list.forEach(function (f) { if (f.id === fieldId) field = f; });
    if (!field) return;
    if (!newOrder || newOrder < 1) newOrder = 1;
    field.order = newOrder;
    saveState();
    logOp("تغییر ترتیب فیلد «" + field.label + "» به " + newOrder);
    if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
    renderColFieldList();
  }

  function nudgeColField(key, fieldId, dir) {
    var list = sortedFields(key);
    var idx = -1;
    list.forEach(function (f, i) { if (f.id === fieldId) idx = i; });
    var swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    var a = list[idx];
    var b = list[swap];
    var ao = Number(a.order) || (idx + 1);
    var bo = Number(b.order) || (swap + 1);
    if (ao === bo) {
      a.order = idx + 1 + dir;
      b.order = idx + 1;
    } else {
      a.order = bo;
      b.order = ao;
    }
    saveState();
    logOp("جابجایی فیلد «" + a.label + "»");
    if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
    renderColFieldList();
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

    logOp("بارگذاری نسخه ۱۱.۱");
    console.log("v11.1 ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
