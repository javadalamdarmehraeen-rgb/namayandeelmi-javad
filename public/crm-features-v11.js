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
  var KEY_TO_TAB = {};
  Object.keys(COL_TAB_KEYS).forEach(function (tab) { KEY_TO_TAB[COL_TAB_KEYS[tab]] = tab; });

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

  function ensureMeta(key) {
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

  function scanBuiltinFields(tabId) {
    var grid = getMainGrid(tabId);
    if (!grid) return [];
    var fields = [];
    var idx = 0;
    Array.prototype.forEach.call(grid.children, function (ch) {
      if (!ch.classList || !ch.classList.contains("form-group")) return;
      if (isHostGroup(ch)) return;
      if (ch.querySelector("[data-custom-field-id]")) return;
      idx += 1;
      var input = ch.querySelector("input:not([type=hidden]), select, textarea");
      var label = ch.querySelector(".form-label, label, h4");
      var id = (input && input.id) || ch.id || ("builtin-" + tabId + "-" + idx);
      var labelText = "";
      if (label) labelText = String(label.textContent || "").replace(/\s+/g, " ").trim();
      if (!labelText && ch.querySelector("span")) {
        labelText = String(ch.querySelector("span").textContent || "").replace(/\s+/g, " ").trim();
      }
      if (!labelText) labelText = id;
      if (labelText.length > 70) labelText = labelText.slice(0, 67) + "…";
      var type = "block";
      if (input) {
        if (input.tagName === "SELECT") type = "select";
        else if (input.type === "number") type = "number";
        else if ((input.id || "").toLowerCase().indexOf("date") !== -1) type = "date";
        else type = "simple";
      }
      fields.push({ id: id, label: labelText, type: type, scanOrder: idx, el: ch });
    });
    return fields;
  }

  function getUnifiedFieldList(tabId) {
    var key = fieldKeyForTab(tabId);
    var meta = ensureMeta(key);
    var list = [];
    scanBuiltinFields(tabId).forEach(function (b) {
      if (!meta[b.id]) meta[b.id] = {};
      if (meta[b.id].order == null || meta[b.id].order === "") meta[b.id].order = b.scanOrder;
      list.push({
        id: b.id,
        builtin: true,
        label: meta[b.id].label || b.label,
        type: b.type,
        order: Number(meta[b.id].order) || b.scanOrder,
        size: meta[b.id].size,
        hidden: meta[b.id].hidden === true,
        showInForm: meta[b.id].hidden !== true,
        showInList: false
      });
    });
    sortedFields(key).forEach(function (c) {
      list.push({
        id: c.id,
        builtin: false,
        label: c.label,
        type: c.inputKind || c.type || "simple",
        order: Number(c.order) || 999,
        size: c.size,
        hidden: c.showInForm === false,
        showInForm: c.showInForm !== false,
        showInList: c.showInList !== false,
        options: c.options,
        allowAddOption: c.allowAddOption,
        dependsOn: c.dependsOn,
        inputKind: c.inputKind
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
      var g = inp.closest(".form-group");
      if (!g || g === container) return;
      if (!valid[id] || removeValidOutside) g.remove();
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
    var el = document.getElementById(field.id);
    if (!el) return null;
    var g = el.closest(".form-group");
    if (grid && g && g.parentNode !== grid) {
      var p = g.parentNode;
      while (p && p !== grid) {
        if (p.classList && p.classList.contains("form-group") && p.parentNode === grid) return p;
        p = p.parentNode;
      }
    }
    return g;
  }

  function applyFullFormLayout(tabId) {
    if (!tabId) return;
    var key = fieldKeyForTab(tabId);
    ensureFieldHost(tabId, key);
    var grid = getMainGrid(tabId);
    var container = $(containerIdForKey(key));
    var unified = getUnifiedFieldList(tabId);
    var meta = ensureMeta(key);
    unified.forEach(function (f) {
      var group = findFieldGroup(tabId, f);
      if (!group) return;
      if (f.hidden || f.showInForm === false) {
        group.style.display = "none";
        group.setAttribute("data-col-hidden", "1");
      } else {
        group.style.display = "";
        group.removeAttribute("data-col-hidden");
      }
      var size = parseInt(f.size, 10);
      if (size > 40) {
        group.style.maxWidth = size + "px";
        group.style.width = "100%";
      } else {
        group.style.maxWidth = "";
      }
      if (f.builtin && meta[f.id] && meta[f.id].label) {
        var lab = group.querySelector(".form-label, label");
        if (lab) lab.textContent = meta[f.id].label;
      }
    });
    if (!grid) return;
    unified.forEach(function (f) {
      var group = findFieldGroup(tabId, f);
      if (!group) return;
      if (group.parentNode !== grid && group.parentNode) {
        grid.appendChild(group);
      } else if (group.parentNode === grid) {
        grid.appendChild(group);
      }
    });
    if (container && container.parentNode === grid) grid.appendChild(container);
    try {
      if (tabId === "tab-pharmacies" && typeof mapPharmacyForm !== "undefined" && mapPharmacyForm) {
        setTimeout(function () { mapPharmacyForm.invalidateSize(); }, 160);
      }
      if (tabId === "tab-doctors" && typeof mapDoctorForm !== "undefined" && mapDoctorForm) {
        setTimeout(function () { mapDoctorForm.invalidateSize(); }, 160);
      }
    } catch (e) {}
  }

  window.applyAllFormLayouts = function () {
    Object.keys(COL_TAB_KEYS).forEach(function (tabId) {
      applyFullFormLayout(tabId);
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
    if (host.dataset.v112 !== "1") {
      host.dataset.v112 = "1";
      host.dataset.v111 = "1";
      host.dataset.ready = "1";
      host.innerHTML =
        '<p class="col-tab-hint">همه تب‌ها مثل داشبورد اینجاست. روی یک تب بزنید تا <strong>همه فیلدهای همان فرم</strong> (ثابت + اضافه‌شده) را ببینید، ویرایش یا حذف کنید.</p>' +
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
      var n = getUnifiedFieldList(sec.id).length;
      var active = window._activeColTab === sec.id ? " active" : "";
      html += '<button type="button" class="col-tab-card' + active + '" data-col-tab="' + sec.id + '">' +
        '<span class="col-tab-icon">' + sec.icon + "</span>" +
        '<span class="col-tab-meta"><span class="col-tab-label">' + escHtml(sec.label) + "</span>" +
        '<span class="col-tab-count">' + n + " فیلد</span></span></button>";
    });
    grid.innerHTML = html;
    Array.prototype.forEach.call(grid.querySelectorAll(".col-tab-card"), function (btn) {
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
    $("colFieldSize").value = field && field.size ? field.size : 220;
    $("colFieldOpts").value = field && field.options ? field.options.join("، ") : "";
    $("colFieldDep").value = field && field.dependsOn ? field.dependsOn : "";
    $("colFieldFly").checked = !field || field.allowAddOption !== false;
    $("colFieldInForm").checked = !field || field.showInForm !== false;
    $("colFieldInList").checked = !field || field.showInList !== false;
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
    var sec = ((typeof MENU_SECTIONS_LIST !== "undefined" ? MENU_SECTIONS_LIST : []).filter(function (s) {
      return s.id === tabId;
    })[0]) || { label: tabId, icon: "🧱" };
    var key = fieldKeyForTab(tabId);
    ensureFieldHost(tabId, key);
    var list = getUnifiedFieldList(tabId);
    panel.hidden = false;
    panel.innerHTML =
      '<div class="col-panel-head">' +
        "<div><strong>" + sec.icon + " " + escHtml(sec.label) + "</strong>" +
        '<div class="col-panel-sub">همه فیلدهای فرم این تب اینجاست — هم فیلدهای بالای کادر درصد و هم پایین. حذف از اینجا فیلد را از خود فرم تب هم برمی‌دارد.</div></div>' +
        '<div class="col-panel-actions">' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnColOpenTab" style="background:#0d9488">باز کردن فرم این تب</button>' +
          '<button type="button" class="btn btn-outline btn-sm" id="btnColBackToGrid">بازگشت به لیست تب‌ها</button>' +
        "</div>" +
      "</div>" +
      '<div class="form-grid col-add-grid">' +
        '<div class="form-group"><label class="form-label">عنوان فیلد</label><input id="colFieldLabel" class="form-input" placeholder="مثلاً کد اقتصادی"></div>' +
        '<div class="form-group"><label class="form-label">نوع</label><select id="colFieldType" class="form-select"><option value="simple">ساده (متنی)</option><option value="select">کشویی</option><option value="date">تاریخ</option><option value="number">عددی</option></select></div>' +
        '<div class="form-group"><label class="form-label">شماره ترتیب در فرم</label><input id="colFieldOrder" class="form-input" type="number" min="1" value="' + (list.length + 1) + '"><small class="col-help">۱ یعنی اولین فیلد فرم این تب</small></div>' +
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
  }

  function saveDesignerField(tabId, key, sec) {
    var label = ($("colFieldLabel").value || "").trim();
    if (!label) { alert("عنوان فیلد را بنویسید."); return; }
    var type = $("colFieldType").value;
    var opts = ($("colFieldOpts").value || "").split(/[،,]/).map(function (s) { return s.trim(); }).filter(Boolean);
    var order = parseInt($("colFieldOrder").value, 10);
    if (!order || order < 1) order = getUnifiedFieldList(tabId).length + 1;
    var size = parseInt($("colFieldSize").value, 10) || 220;
    var editing = window._editingColField;

    if (editing && editing.builtin) {
      var meta = ensureMeta(key);
      if (!meta[editing.id]) meta[editing.id] = {};
      meta[editing.id].label = label;
      meta[editing.id].order = order;
      meta[editing.id].size = size;
      meta[editing.id].hidden = !$("colFieldInForm").checked;
      saveState();
      logOp("ویرایش فیلد ثابت «" + label + "» در تب " + sec.label);
      applyFullFormLayout(tabId);
      window._editingColField = null;
      renderColDesignerPanel();
      renderColTabGrid();
      alert("تغییرات فیلد «" + label + "» روی فرم تب «" + sec.label + "» اعمال شد.");
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
        rec.order = order;
        rec.size = size;
        rec.dependsOn = ($("colFieldDep").value || "").trim();
        saveState();
        logOp("ویرایش فیلد «" + label + "» در تب " + sec.label);
        document.querySelectorAll('[data-custom-field-id="' + rec.id + '"]').forEach(function (inp) {
          var g = inp.closest(".form-group");
          if (g) g.remove();
        });
        if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable();
        if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
        applyFullFormLayout(tabId);
        window._editingColField = null;
        renderColDesignerPanel();
        renderColTabGrid();
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
      size: size,
      dependsOn: ($("colFieldDep").value || "").trim()
    };
    getFieldList(key).push(neu);
    saveState();
    logOp("افزودن فیلد «" + label + "» به تب " + sec.label + " با ترتیب " + order);
    if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable();
    if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
    applyFullFormLayout(tabId);
    renderColDesignerPanel();
    renderColTabGrid();
    alert("فیلد «" + label + "» در تب «" + sec.label + "» ثبت شد و در جایگاه " + order + " فرم قرار گرفت.");
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
        ? ("<strong>همه فیلدهای فرم این تب (" + list.length + "):</strong> " + list.map(function (f) {
          return (f.order || "—") + ". " + escHtml(f.label) + (f.hidden ? " (مخفی)" : "");
        }).join("  ←  "))
        : "فیلدی در این تب پیدا نشد.";
    }
    if (!box) return;
    if (!list.length) {
      box.innerHTML = "<div class='col-empty'>فیلدی در فرم این تب نیست.</div>";
      return;
    }
    var html = "<table class='data-table'><thead><tr><th>ترتیب</th><th>عنوان</th><th>منبع</th><th>نوع</th><th>جابجایی</th><th>عملیات</th></tr></thead><tbody>";
    list.forEach(function (f) {
      var kind = f.inputKind || f.type || "simple";
      var kindFa = kind === "select" ? "کشویی" : kind === "date" ? "تاریخ" : kind === "number" ? "عددی" : kind === "block" ? "کادر" : "ساده";
      var src = f.builtin ? "ثابت فرم" : "اضافه‌شده";
      var hid = f.hidden ? " col-row-hidden" : "";
      html += "<tr class='" + hid + "'>" +
        "<td><input type='number' min='1' class='form-input col-order-input' data-fid='" + escHtml(f.id) + "' data-builtin='" + (f.builtin ? "1" : "0") + "' value='" + (f.order || "") + "'></td>" +
        "<td><strong>" + escHtml(f.label) + "</strong>" + (f.hidden ? " <span class='col-hidden-badge'>مخفی</span>" : "") + "</td>" +
        "<td>" + src + "</td>" +
        "<td>" + kindFa + "</td>" +
        "<td><button type='button' class='btn btn-outline btn-sm col-move-up' data-fid='" + escHtml(f.id) + "'>▲</button> " +
        "<button type='button' class='btn btn-outline btn-sm col-move-down' data-fid='" + escHtml(f.id) + "'>▼</button></td>" +
        "<td class='col-ops'>";
      html += "<button type='button' class='btn btn-outline btn-sm col-edit-field' data-fid='" + escHtml(f.id) + "'>✏️ ویرایش</button> ";
      if (f.hidden && f.builtin) {
        html += "<button type='button' class='btn btn-primary btn-sm col-restore-field' data-fid='" + escHtml(f.id) + "' style='background:#0d9488'>نمایش مجدد</button>";
      } else {
        html += "<button type='button' class='btn btn-danger btn-sm col-del-field' data-fid='" + escHtml(f.id) + "'>حذف</button>";
      }
      html += "</td></tr>";
    });
    html += "</tbody></table>";
    box.innerHTML = html;

    Array.prototype.forEach.call(box.querySelectorAll(".col-order-input"), function (inp) {
      inp.addEventListener("change", function () {
        setAnyFieldOrder(tabId, inp.getAttribute("data-fid"), parseInt(inp.value, 10));
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

  function setAnyFieldOrder(tabId, fieldId, newOrder) {
    if (!newOrder || newOrder < 1) newOrder = 1;
    writeFieldOrder(tabId, fieldId, newOrder);
    saveState();
    logOp("تغییر ترتیب فیلد به " + newOrder);
    if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
    applyFullFormLayout(tabId);
    renderColFieldList();
  }

  function nudgeAnyField(tabId, fieldId, dir) {
    var list = getUnifiedFieldList(tabId);
    var idx = -1;
    list.forEach(function (f, i) { if (f.id === fieldId) idx = i; });
    var swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    var a = list[idx];
    var b = list[swap];
    var ao = Number(a.order) || (idx + 1);
    var bo = Number(b.order) || (swap + 1);
    if (ao === bo) {
      writeFieldOrder(tabId, a.id, idx + 1 + dir);
      writeFieldOrder(tabId, b.id, idx + 1);
    } else {
      writeFieldOrder(tabId, a.id, bo);
      writeFieldOrder(tabId, b.id, ao);
    }
    saveState();
    logOp("جابجایی فیلد «" + a.label + "»");
    if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
    applyFullFormLayout(tabId);
    renderColFieldList();
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
    if (!confirm("فیلد «" + label + "» از فرم این تب حذف/مخفی شود؟")) return;
    var meta = ensureMeta(key);
    if (!meta[fieldId]) meta[fieldId] = {};
    meta[fieldId].hidden = true;
    saveState();
    applyFullFormLayout(tabId);
    logOp("حذف/مخفی‌سازی فیلد «" + label + "» از فرم تب");
    renderColFieldList();
    renderColTabGrid();
    alert("فیلد «" + label + "» از فرم تب اصلی برداشته شد.");
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
    try {
      if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
      window.applyAllFormLayouts();
    } catch (e) {}
    try { if (typeof mergeCatalogIntoOrderItems === "function") mergeCatalogIntoOrderItems(); } catch (e) {}
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
          if (id === "tab-orders" && typeof mergeCatalogIntoOrderItems === "function") mergeCatalogIntoOrderItems();
          if (typeof applyFullFormLayout === "function") applyFullFormLayout(id);
          else if (typeof window.applyAllFormLayouts === "function" && id && id.indexOf("tab-") === 0) {
            try { applyFullFormLayout(id); } catch (e) {}
          }
        }, 120);
      };
    }

    ["tablePharmaciesBody", "tableDoctorsBody", "tableOrdersBody"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var obs = new MutationObserver(function () { realRowLists(); });
      obs.observe(el, { childList: true });
    });

    logOp("بارگذاری نسخه ۱۱.۲");
    console.log("v11.2 ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
