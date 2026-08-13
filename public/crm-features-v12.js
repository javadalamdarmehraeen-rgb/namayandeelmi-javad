// v12 — نشستن فیلد روی تب اصلی، ویرایش کادر، کلیدهای اصلی در طراح، تب ساز مدیر
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  window.iconFromTabLabel = function (label) {
    var s = String(label || "");
    var rules = [
      [/داروخان|دارو/, "🏥"], [/پزشک|مطب|دکتر/, "👨‍⚕️"], [/سفارش|فروش/, "📦"],
      [/نقشه|لوکیشن|موقعیت/, "🗺️"], [/ویزیت/, "▶️"], [/مرخصی/, "📝"],
      [/کاربر|دسترسی/, "👤"], [/گزارش/, "📈"], [/تارگت/, "🎯"],
      [/کالا|محصول/, "💊"], [/اعلان|پیام/, "🔔"], [/پشتیبان/, "💾"],
      [/عیب/, "🛠️"], [/جستجو/, "🔍"], [/خانه|منزل/, "🏠"],
      [/تردد|مسیر/, "🛣️"], [/بازرسی|انبار/, "📋"], [/بیمارستان/, "🏨"]
    ];
    for (var i = 0; i < rules.length; i++) if (rules[i][0].test(s)) return rules[i][1];
    var icons = ["📋", "📌", "📁", "🗂️", "⭐", "🟢", "📘", "🧩", "📎", "📝"];
    var h = 0;
    for (var j = 0; j < s.length; j++) h = (h + s.charCodeAt(j)) % icons.length;
    return icons[h];
  };

  var WIDGET_PALETTE = [
    { kind: "widget-map", label: "نقشه", icon: "🗺️" },
    { kind: "widget-myloc", label: "موقعیت کنونی من", icon: "📡" },
    { kind: "widget-getaddr", label: "دریافت آدرس این نقطه", icon: "🔍" },
    { kind: "widget-searchaddr", label: "جستجوی آدرس روی نقشه", icon: "🧭" },
    { kind: "widget-file", label: "بارگذاری فایل", icon: "📎" },
    { kind: "widget-save", label: "ثبت / ذخیره", icon: "💾" },
    { kind: "widget-reset", label: "بازنشانی فرم", icon: "♻️" },
    { kind: "widget-edit", label: "ویرایش", icon: "✏️" },
    { kind: "widget-delete", label: "حذف", icon: "🗑️" }
  ];

  function tabKey(tabId) {
    var ut = ((state && state.userTabs) || []).filter(function (t) { return t.id === tabId; })[0];
    if (ut && ut.key) return ut.key;
    return String(tabId || "").replace(/^tab-/, "") || "misc";
  }

  function isUserTab(tabId) {
    return ((state && state.userTabs) || []).some(function (t) { return t.id === tabId; });
  }

  window.buildDesignerWidget = function (field, tabId) {
    var kind = field.inputKind || field.type || "";
    var wrap = document.createElement("div");
    wrap.className = "form-group col-widget-wrap";
    wrap.setAttribute("data-col-fid", field.id);
    wrap.setAttribute("data-widget-kind", kind);
    var fid = field.id;
    var title = esc(field.label || "امکان");

    if (kind === "widget-map") {
      wrap.classList.add("full-width");
      wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
        '<div class="map-container" id="map-' + fid + '" style="height:280px"></div>' +
        '<input type="hidden" data-custom-field-id="' + fid + '" value="">' +
        '<input type="hidden" id="' + fid + '-lat" data-widget-lat="' + fid + '">' +
        '<input type="hidden" id="' + fid + '-lng" data-widget-lng="' + fid + '">';
      setTimeout(function () { initUserMap(fid, tabId); }, 80);
      return wrap;
    }
    if (kind === "widget-myloc") {
      wrap.innerHTML = '<button type="button" class="btn btn-primary btn-sm" id="btn-' + fid + '">📡 ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () { runMyLocation(tabId); });
        }
      }, 30);
      return wrap;
    }
    if (kind === "widget-getaddr") {
      wrap.innerHTML = '<button type="button" class="btn btn-success btn-sm" id="btn-' + fid + '">🔍 ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () { runGetAddress(tabId); });
        }
      }, 30);
      return wrap;
    }
    if (kind === "widget-searchaddr") {
      wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
        '<div style="display:flex;gap:.4rem">' +
        '<input type="text" class="form-input" data-custom-field-id="' + fid + '" placeholder="آدرس را بنویسید...">' +
        '<button type="button" class="btn btn-outline btn-sm" id="btn-' + fid + '">جستجو</button></div>';
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () {
            var inp = wrap.querySelector("input");
            runSearchAddress(tabId, inp ? inp.value : "");
          });
        }
      }, 30);
      return wrap;
    }
    if (kind === "widget-file") {
      wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
        '<input type="file" class="form-input" data-custom-field-id="' + fid + '">';
      return wrap;
    }
    if (kind === "widget-save") {
      wrap.innerHTML = '<button type="button" class="btn btn-primary" id="btn-' + fid + '" style="background:#0d9488">💾 ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () { saveUserTabRecord(tabId); });
        }
      }, 30);
      return wrap;
    }
    if (kind === "widget-reset") {
      wrap.innerHTML = '<button type="button" class="btn btn-outline" id="btn-' + fid + '">♻️ ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () { resetUserTabForm(tabId); });
        }
      }, 30);
      return wrap;
    }
    if (kind === "widget-edit") {
      wrap.innerHTML = '<button type="button" class="btn btn-outline btn-sm" id="btn-' + fid + '">✏️ ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () {
            var recs = ((state.customRecords || {})[tabKey(tabId)] || []);
            if (!recs.length) { alert("هنوز رکوردی برای ویرایش نیست."); return; }
            loadUserTabRecord(tabId, recs[recs.length - 1].id);
          });
        }
      }, 30);
      return wrap;
    }
    if (kind === "widget-delete") {
      wrap.innerHTML = '<button type="button" class="btn btn-danger btn-sm" id="btn-' + fid + '">🗑️ ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () {
            var hid = $("edit-" + tabKey(tabId));
            var id = hid && hid.value;
            if (!id) { alert("ابتدا یک ردیف را برای حذف انتخاب/ویرایش کنید."); return; }
            deleteUserTabRecord(tabId, id);
          });
        }
      }, 30);
      return wrap;
    }
    return null;
  };

  var userMaps = {};
  function initUserMap(fid, tabId) {
    if (typeof L === "undefined") return;
    var el = $("map-" + fid);
    if (!el || el._leaflet_id) return;
    var map = L.map("map-" + fid).setView([35.72, 51.42], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OSM" }).addTo(map);
    var marker = L.marker([35.72, 51.42]).addTo(map);
    userMaps[fid] = { map: map, marker: marker };
    map.on("click", function (e) {
      setTabCoords(tabId, e.latlng.lat, e.latlng.lng, fid);
    });
    setTimeout(function () { map.invalidateSize(); }, 200);
  }

  function setTabCoords(tabId, lat, lng, preferFid) {
    var pane = $(tabId);
    if (!pane) return;
    var latEl = pane.querySelector("[data-widget-lat]") || (preferFid && $(preferFid + "-lat"));
    var lngEl = pane.querySelector("[data-widget-lng]") || (preferFid && $(preferFid + "-lng"));
    if (latEl) latEl.value = Number(lat).toFixed(6);
    if (lngEl) lngEl.value = Number(lng).toFixed(6);
    var store = pane.querySelector("[data-custom-field-id][type=hidden]");
    if (store) store.value = Number(lat).toFixed(6) + "," + Number(lng).toFixed(6);
    Object.keys(userMaps).forEach(function (fid) {
      var um = userMaps[fid];
      if (!um || !um.map) return;
      um.marker.setLatLng([lat, lng]);
      um.map.setView([lat, lng], 15);
    });
  }

  function runMyLocation(tabId) {
    var apply = function (lat, lng) {
      setTabCoords(tabId, lat, lng);
      if (typeof reverseGeocodeCoordinates === "function") {
        reverseGeocodeCoordinates(lat, lng).then(function (addr) {
          fillAddressOnTab(tabId, addr);
          alert("موقعیت نشست:\n" + addr);
        });
      }
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (pos) { apply(pos.coords.latitude, pos.coords.longitude); },
        function () { apply(35.72, 51.42); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else apply(35.72, 51.42);
  }

  function runGetAddress(tabId) {
    var pane = $(tabId);
    if (!pane) return;
    var latEl = pane.querySelector("[data-widget-lat]");
    var lngEl = pane.querySelector("[data-widget-lng]");
    var lat = latEl ? parseFloat(latEl.value) : NaN;
    var lng = lngEl ? parseFloat(lngEl.value) : NaN;
    if (!isFinite(lat) || !isFinite(lng)) { alert("اول روی نقشه نقطه بگذارید یا موقعیت فعلی را بگیرید."); return; }
    if (typeof reverseGeocodeCoordinates !== "function") return;
    reverseGeocodeCoordinates(lat, lng).then(function (addr) {
      fillAddressOnTab(tabId, addr);
      alert("آدرس این نقطه:\n" + addr);
    });
  }

  function runSearchAddress(tabId, q) {
    if (!q || !String(q).trim()) { alert("آدرس را بنویسید."); return; }
    if (typeof searchAddressOnMap !== "function") return;
    searchAddressOnMap(String(q).trim(), function (lat, lng) {
      setTabCoords(tabId, lat, lng);
    });
  }

  function fillAddressOnTab(tabId, addr) {
    var pane = $(tabId);
    if (!pane) return;
    var cand = pane.querySelector("input[data-custom-field-id][placeholder*='آدرس'], input[id*='ddress'], input[id*='location']");
    if (!cand) {
      var inputs = pane.querySelectorAll("input.form-input[type='text'], input.form-input:not([type])");
      if (inputs.length) cand = inputs[inputs.length - 1];
    }
    if (cand) cand.value = addr;
  }

  function collectUserTabValues(tabId) {
    var pane = $(tabId);
    var key = tabKey(tabId);
    var vals = {};
    if (!pane) return vals;
    (pane.querySelectorAll("[data-custom-field-id]") || []).forEach(function (el) {
      var id = el.getAttribute("data-custom-field-id");
      if (!id) return;
      if (el.type === "file") vals[id] = el.files && el.files[0] ? el.files[0].name : "";
      else vals[id] = (el.value || "").trim();
    });
    var latEl = pane.querySelector("[data-widget-lat]");
    var lngEl = pane.querySelector("[data-widget-lng]");
    if (latEl) vals._lat = latEl.value;
    if (lngEl) vals._lng = lngEl.value;
    vals._tab = key;
    return vals;
  }

  function saveUserTabRecord(tabId) {
    if (!isUserTab(tabId)) {
      var form = $(tabId) && $(tabId).querySelector("form");
      if (form && typeof form.requestSubmit === "function") form.requestSubmit();
      else if (form) form.dispatchEvent(new Event("submit", { cancelable: true }));
      return;
    }
    if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields(tabId)) return;
    var key = tabKey(tabId);
    if (!state.customRecords) state.customRecords = {};
    if (!state.customRecords[key]) state.customRecords[key] = [];
    var vals = collectUserTabValues(tabId);
    var hid = $("edit-" + key);
    var editId = hid ? hid.value : "";
    if (editId) {
      var idx = state.customRecords[key].findIndex(function (r) { return r.id === editId; });
      if (idx !== -1) state.customRecords[key][idx] = Object.assign({}, state.customRecords[key][idx], { values: vals });
    } else {
      state.customRecords[key].push({
        id: "ur-" + Date.now(),
        createdAt: new Date().toLocaleString("fa-IR", { timeZone: "Asia/Tehran" }),
        values: vals
      });
    }
    saveState();
    if (hid) hid.value = "";
    renderUserTabList(tabId);
    resetUserTabForm(tabId);
    alert("رکورد در تب «" + (((state.userTabs || []).filter(function (t) { return t.id === tabId; })[0] || {}).label || tabId) + "» ذخیره شد.");
  }

  function resetUserTabForm(tabId) {
    var pane = $(tabId);
    if (!pane) return;
    pane.querySelectorAll("input.form-input, select.form-select, textarea").forEach(function (el) {
      if (el.type === "file") el.value = "";
      else if (el.type !== "hidden") el.value = "";
    });
    var hid = $("edit-" + tabKey(tabId));
    if (hid) hid.value = "";
  }

  function loadUserTabRecord(tabId, recId) {
    var key = tabKey(tabId);
    var rec = ((state.customRecords || {})[key] || []).filter(function (r) { return r.id === recId; })[0];
    if (!rec) return;
    var pane = $(tabId);
    if (!pane) return;
    var hid = $("edit-" + key);
    if (hid) hid.value = recId;
    Object.keys(rec.values || {}).forEach(function (id) {
      if (id.charAt(0) === "_") return;
      var el = pane.querySelector('[data-custom-field-id="' + id + '"]');
      if (el && el.type !== "file") el.value = rec.values[id];
    });
    if (rec.values._lat && rec.values._lng) setTabCoords(tabId, rec.values._lat, rec.values._lng);
    if (typeof switchTab === "function") switchTab(tabId);
  }

  function deleteUserTabRecord(tabId, recId) {
    if (!confirm("این ردیف حذف شود؟")) return;
    var key = tabKey(tabId);
    state.customRecords[key] = ((state.customRecords || {})[key] || []).filter(function (r) { return r.id !== recId; });
    saveState();
    renderUserTabList(tabId);
    resetUserTabForm(tabId);
  }

  function renderUserTabList(tabId) {
    var key = tabKey(tabId);
    var head = $("head-" + key);
    var body = $("body-" + key);
    if (!head || !body) return;
    var fields = ((state.customFields || {})[key] || []).filter(function (f) {
      return f.showInList !== false && String(f.inputKind || "").indexOf("widget-") !== 0;
    });
    head.innerHTML = "<th>ردیف</th><th>تاریخ</th>" + fields.map(function (f) {
      return "<th>" + esc(f.label) + "</th>";
    }).join("") + "<th>عملیات</th>";
    var rows = ((state.customRecords || {})[key] || []);
    body.innerHTML = rows.map(function (r, i) {
      var tds = fields.map(function (f) {
        var v = (r.values || {})[f.id];
        return "<td>" + esc(v == null || v === "" ? "—" : v) + "</td>";
      }).join("");
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(r.createdAt || "") + "</td>" + tds +
        '<td><button type="button" class="btn btn-outline btn-sm" data-edit="' + esc(r.id) + '">✏️ ویرایش</button> ' +
        '<button type="button" class="btn btn-danger btn-sm" data-del="' + esc(r.id) + '">🗑️ حذف</button></td></tr>';
    }).join("") || "<tr><td colspan='" + (fields.length + 3) + "'>رکوردی نیست</td></tr>";
    body.querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { loadUserTabRecord(tabId, b.getAttribute("data-edit")); });
    });
    body.querySelectorAll("[data-del]").forEach(function (b) {
      b.addEventListener("click", function () { deleteUserTabRecord(tabId, b.getAttribute("data-del")); });
    });
  }

  function ensureUserTabPane(tab) {
    if (!tab || !tab.id) return;
    if ($(tab.id)) {
      renderUserTabList(tab.id);
      return;
    }
    var main = document.querySelector("main.main-content");
    if (!main) return;
    var key = tab.key || tabKey(tab.id);
    var sec = document.createElement("section");
    sec.id = tab.id;
    sec.className = "tab-pane user-made-tab";
    sec.innerHTML =
      '<div class="card">' +
        '<div class="card-header"><div class="card-title"><span>' + esc(tab.icon || "📋") + " " + esc(tab.label) + "</span></div>" +
        '<button type="button" class="btn btn-outline btn-sm" onclick="switchTab(\'tab-dashboard\')">🏠 صفحه اصلی</button></div>' +
        '<form id="form-' + key + '" onsubmit="return false;">' +
          '<input type="hidden" id="edit-' + key + '" value="">' +
          '<div class="form-grid" id="grid-' + key + '"></div>' +
          '<div id="cfHost-' + key + '" class="form-group full-width form-grid extra-cf-host"></div>' +
          '<div class="form-group full-width" style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap">' +
            '<button type="button" class="btn btn-primary" id="btnSave-' + key + '" style="background:#0d9488">ثبت</button>' +
            '<button type="button" class="btn btn-outline" id="btnReset-' + key + '">بازنشانی</button>' +
          "</div></form></div>" +
      '<div class="card"><div class="card-header"><div class="card-title"><span>لیست ' + esc(tab.label) + "</span></div></div>" +
        '<div class="table-responsive"><table class="data-table"><thead><tr id="head-' + key + '"></tr></thead>' +
        '<tbody id="body-' + key + '"></tbody></table></div></div>';
    main.appendChild(sec);
    var bs = $("btnSave-" + key);
    var br = $("btnReset-" + key);
    if (bs) bs.addEventListener("click", function () { saveUserTabRecord(tab.id); });
    if (br) br.addEventListener("click", function () { resetUserTabForm(tab.id); });
    renderUserTabList(tab.id);
  }

  window.createUserTab = function (label) {
    label = String(label || "").trim();
    if (!label) { alert("نام تب را بنویسید."); return null; }
    if (!state.userTabs) state.userTabs = [];
    var stamp = Date.now();
    var tab = {
      id: "tab-user-" + stamp,
      label: label,
      icon: window.iconFromTabLabel(label),
      key: "usertab-" + stamp,
      userMade: true
    };
    state.userTabs.push(tab);
    if (!state.customFields) state.customFields = {};
    if (!state.customFields[tab.key]) state.customFields[tab.key] = [];
    if (!state.customRecords) state.customRecords = {};
    state.customRecords[tab.key] = [];
    saveState();
    ensureUserTabPane(tab);
    if (typeof setupNavigationMenu === "function") setupNavigationMenu();
    window._activeColTab = tab.id;
    if (typeof window.refreshColumnsDesigner === "function") window.refreshColumnsDesigner();
    if (typeof switchTab === "function") switchTab(tab.id);
    alert("تب «" + label + "» با آیکون " + tab.icon + " ساخته شد. از امکانات آماده و فیلدها برای طراحی‌اش استفاده کنید.");
    return tab.id;
  };

  window.deleteUserTab = function (tabId) {
    var tab = ((state.userTabs || []).filter(function (t) { return t.id === tabId; })[0]);
    if (!tab) return;
    if (!confirm("تب «" + tab.label + "» و همه فیلدها و رکوردهایش حذف شود؟")) return;
    state.userTabs = state.userTabs.filter(function (t) { return t.id !== tabId; });
    if (state.customFields) delete state.customFields[tab.key];
    if (state.customRecords) delete state.customRecords[tab.key];
    if (state.formBoxes) delete state.formBoxes[tab.key];
    if (state.formFieldMeta) delete state.formFieldMeta[tab.key];
    var pane = $(tabId);
    if (pane && pane.parentNode) pane.parentNode.removeChild(pane);
    saveState();
    window._activeColTab = "";
    if (typeof setupNavigationMenu === "function") setupNavigationMenu();
    if (typeof window.refreshColumnsDesigner === "function") window.refreshColumnsDesigner();
    if (typeof switchTab === "function") switchTab("tab-dashboard");
  };

  function addWidgetToActiveTab(kind, label) {
    var tabId = window._activeColTab;
    if (!tabId) { alert("اول یک تب را از گرید بالا انتخاب کنید."); return; }
    var key = tabKey(tabId);
    if (!state.customFields) state.customFields = {};
    if (!state.customFields[key]) state.customFields[key] = [];
    var exists = state.customFields[key].filter(function (f) { return f.inputKind === kind; })[0];
    if (exists) {
      alert("این امکان از قبل در این تب هست. از جدول پایین داخل کادر تیک بزنید.");
      return;
    }
    var neu = {
      id: "cf-" + key + "-" + kind.replace(/\W/g, "") + "-" + Date.now(),
      label: label,
      type: "simple",
      inputKind: kind,
      showInForm: true,
      showInList: kind.indexOf("widget-") !== 0,
      order: (state.customFields[key].length || 0) + 1,
      size: kind === "widget-map" ? 900 : 260,
      place: kind === "widget-map" ? "under" : "beside"
    };
    state.customFields[key].push(neu);
    saveState();
    if (typeof renderCustomFieldsInForm === "function") {
      var cid = (key === "pharmacy" ? "pharmacyCustomFieldsContainer" : key === "doctor" ? "doctorCustomFieldsContainer" : key === "order" ? "orderCustomFieldsContainer" : ("cfHost-" + key));
      if ($(cid)) renderCustomFieldsInForm(key, cid);
    }
    if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(tabId);
    if (typeof window.refreshColumnsDesigner === "function") window.refreshColumnsDesigner();
    alert("«" + label + "» به تب اضافه شد. اگر کادر دارید از تیک‌های کادر داخلش بگذارید.");
  }

  function enhanceDesignerChrome() {
    var host = $("columnsDesignerHost");
    if (!host) return;

    if (!$("colNewTabBar")) {
      var bar = document.createElement("div");
      bar.id = "colNewTabBar";
      bar.className = "col-newtab-bar";
      bar.innerHTML =
        '<strong>تب جدید مدیر:</strong>' +
        '<input id="colNewTabLabel" class="form-input" placeholder="مثلاً بازرسی انبار">' +
        '<button type="button" id="btnCreateUserTab" class="btn btn-primary btn-sm" style="background:#0d9488">➕ ساخت تب جدید</button>' +
        '<span class="col-help">آیکون از روی اسم به‌صورت خودکار می‌آید. اندازه و فونت مثل تب‌های فعلی است.</span>';
      var grid = $("colTabGrid");
      if (grid && grid.parentNode) grid.parentNode.insertBefore(bar, grid);
      else host.insertBefore(bar, host.firstChild);
      var btn = $("btnCreateUserTab");
      if (btn) btn.addEventListener("click", function () {
        window.createUserTab(($("colNewTabLabel") || {}).value);
        if ($("colNewTabLabel")) $("colNewTabLabel").value = "";
      });
    }

    var panel = $("colDesignerPanel");
    if (panel && !panel.hidden && window._activeColTab) {
      if (!$("colWidgetPalette")) {
        var pal = document.createElement("div");
        pal.id = "colWidgetPalette";
        pal.className = "col-widget-palette";
        pal.innerHTML = "<strong>امکانات آماده همین برنامه</strong>" +
          "<p class='col-help'>نقشه، موقعیت فعلی، دریافت آدرس، جستجو، فایل، ثبت، بازنشانی، ویرایش و حذف را به تب/کادر اضافه کنید. روی تب‌های فعلی، کلیدهای اصلی در جدول پایین هم هستند.</p>" +
          '<div class="col-widget-btns">' +
          WIDGET_PALETTE.map(function (w) {
            return '<button type="button" class="btn btn-outline btn-sm col-add-widget" data-kind="' + w.kind + '" data-label="' + esc(w.label) + '">' + w.icon + " " + esc(w.label) + "</button>";
          }).join("") + "</div>";
        var boxMaker = panel.querySelector(".col-box-maker");
        if (boxMaker) boxMaker.parentNode.insertBefore(pal, boxMaker);
        else panel.insertBefore(pal, panel.firstChild.nextSibling);
        pal.querySelectorAll(".col-add-widget").forEach(function (b) {
          b.addEventListener("click", function () {
            addWidgetToActiveTab(b.getAttribute("data-kind"), b.getAttribute("data-label"));
          });
        });
      }
      if (isUserTab(window._activeColTab) && !$("btnDeleteUserTab")) {
        var actions = panel.querySelector(".col-panel-actions");
        if (actions) {
          var del = document.createElement("button");
          del.type = "button";
          del.id = "btnDeleteUserTab";
          del.className = "btn btn-danger btn-sm";
          del.textContent = "حذف این تب";
          del.addEventListener("click", function () { window.deleteUserTab(window._activeColTab); });
          actions.appendChild(del);
        }
      }
    }
  }

  var origApplyOrder = window.applyCustomFieldOrderInForm;
  if (typeof origApplyOrder === "function") {
    window.applyCustomFieldOrderInForm = function (entityType, containerId) {
      var tabId = "tab-" + entityType;
      ((state && state.userTabs) || []).forEach(function (t) {
        if (t.key === entityType) tabId = t.id;
      });
      if (typeof origApplyOrder === "function") {
        try { origApplyOrder(entityType, containerId); } catch (e) {}
      }
      if (typeof window.applyFullFormLayout === "function") {
        try { window.applyFullFormLayout(tabId); } catch (e) {}
      }
    };
  }

  function boot() {
    try {
      if (state && !state.userTabs) state.userTabs = [];
      if (state && !state.customRecords) state.customRecords = {};
      (state.userTabs || []).forEach(ensureUserTabPane);
      if ((state.userTabs || []).length && typeof setupNavigationMenu === "function") setupNavigationMenu();
    } catch (e) { console.error("v12 tabs", e); }

    try { enhanceDesignerChrome(); } catch (e) {}

    var origRefresh = window.refreshColumnsDesigner;
    if (typeof origRefresh === "function") {
      window.refreshColumnsDesigner = function () {
        origRefresh();
        setTimeout(enhanceDesignerChrome, 40);
      };
    }

    document.addEventListener("click", function (e) {
      if (e.target.closest(".col-designer-tab") || e.target.id === "btnSaveColField" || e.target.id === "btnAddColBox" || e.target.id === "btnColBackToGrid") {
        setTimeout(enhanceDesignerChrome, 60);
      }
    });

    var origSw = window.switchTab;
    if (typeof origSw === "function" && !window._v12Sw) {
      window._v12Sw = true;
      window.switchTab = function (id) {
        origSw(id);
        setTimeout(function () {
          if (id === "tab-columns-products") enhanceDesignerChrome();
          if (isUserTab(id)) {
            renderUserTabList(id);
            Object.keys(userMaps).forEach(function (fid) {
              try { if (userMaps[fid].map) userMaps[fid].map.invalidateSize(); } catch (e) {}
            });
          }
        }, 140);
      };
    }

    console.log("v12 ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
