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
    { kind: "simple", label: "فیلد متنی", icon: "✏️", group: "field" },
    { kind: "number", label: "فیلد عددی", icon: "🔢", group: "field" },
    { kind: "date", label: "فیلد تاریخ", icon: "📅", group: "field" },
    { kind: "select", label: "فیلد کشویی", icon: "📑", group: "field" },
    { kind: "textarea", label: "متن بلند", icon: "📝", group: "field" },
    { kind: "phone", label: "شماره تماس", icon: "📞", group: "field" },
    { kind: "widget-file", label: "بارگذاری فایل", icon: "📎", group: "field" },
    { kind: "widget-map", label: "نقشه", icon: "🗺️", group: "tool" },
    { kind: "widget-myloc", label: "موقعیت کنونی من", icon: "📡", group: "tool" },
    { kind: "widget-getaddr", label: "دریافت آدرس این نقطه", icon: "🔍", group: "tool" },
    { kind: "widget-searchaddr", label: "جستجوی آدرس روی نقشه", icon: "🧭", group: "tool" },
    { kind: "widget-save", label: "ثبت / ذخیره", icon: "💾", group: "tool" },
    { kind: "widget-reset", label: "بازنشانی فرم", icon: "♻️", group: "tool" },
    { kind: "widget-edit", label: "ویرایش", icon: "✏️", group: "tool" },
    { kind: "widget-delete", label: "حذف", icon: "🗑️", group: "tool" },
    { kind: "widget-excel", label: "خروجی اکسل", icon: "⬇️", group: "tool" },
    { kind: "widget-search", label: "جستجو در لیست", icon: "🔎", group: "tool" },
    { kind: "widget-print", label: "چاپ", icon: "🖨️", group: "tool" },
    { kind: "widget-list", label: "لیست رکوردها", icon: "📋", group: "tool" }
  ];

  function tabKey(tabId) {
    var ut = ((state && state.userTabs) || []).filter(function (t) { return t.id === tabId; })[0];
    if (ut && ut.key) return ut.key;
    return String(tabId || "").replace(/^tab-/, "") || "misc";
  }

  function isUserTab(tabId) {
    return ((state && state.userTabs) || []).some(function (t) { return t.id === tabId; });
  }

  function stampWidgetField(wrap, fid, field) {
    if (!wrap) return wrap;
    wrap.setAttribute("data-col-fid", fid);
    if (field && field.actionScope) wrap.setAttribute("data-action-scope", field.actionScope);
    if (field && field.scopeId) wrap.setAttribute("data-scope-id", field.scopeId);
    if (!wrap.querySelector('[data-custom-field-id="' + fid + '"]')) {
      var hid = document.createElement("input");
      hid.type = "hidden";
      hid.setAttribute("data-custom-field-id", fid);
      wrap.appendChild(hid);
    }
    return wrap;
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
      return stampWidgetField(wrap, fid, field);
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
      return stampWidgetField(wrap, fid, field);
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
      return stampWidgetField(wrap, fid, field);
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
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "widget-file") {
      wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
        '<input type="file" class="form-input" data-custom-field-id="' + fid + '">';
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "widget-save") {
      wrap.innerHTML = '<button type="button" class="btn btn-primary" id="btn-' + fid + '" style="background:#0d9488">💾 ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () { saveUserTabRecord(tabId, wrap); });
        }
      }, 30);
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "widget-reset") {
      wrap.innerHTML = '<button type="button" class="btn btn-outline" id="btn-' + fid + '">♻️ ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () { resetUserTabForm(tabId, wrap); });
        }
      }, 30);
      return stampWidgetField(wrap, fid, field);
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
            var sid = wrap.getAttribute("data-scope-id");
            var rec = recs.filter(function (r) { return r.id === sid; })[0] || recs[recs.length - 1];
            loadUserTabRecord(tabId, rec.id);
          });
        }
      }, 30);
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "widget-delete") {
      wrap.innerHTML = '<button type="button" class="btn btn-danger btn-sm" id="btn-' + fid + '">🗑️ ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () {
            var hid = $("edit-" + tabKey(tabId));
            var id = (wrap.getAttribute("data-action-scope") === "row" && wrap.getAttribute("data-scope-id")) || (hid && hid.value);
            if (!id) { alert("ابتدا یک ردیف را برای حذف انتخاب کنید یا کلید را کنار همان ردیف بگذارید."); return; }
            deleteUserTabRecord(tabId, id);
          });
        }
      }, 30);
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "widget-excel") {
      wrap.innerHTML = '<button type="button" class="btn btn-success btn-sm" id="btn-' + fid + '">⬇️ ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () {
            if (typeof downloadCSVFile === "function") {
              var recs = ((state.customRecords || {})[tabKey(tabId)] || []);
              downloadCSVFile("tab-export.xls", ["ردیف", "داده"], recs.map(function (r, i) {
                return [i + 1, JSON.stringify(r.values || {})];
              }));
            } else alert("خروجی اکسل آماده است.");
          });
        }
      }, 30);
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "widget-search") {
      wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
        '<input type="text" class="form-input" data-custom-field-id="' + fid + '" placeholder="جستجو...">';
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "widget-print") {
      wrap.innerHTML = '<button type="button" class="btn btn-outline btn-sm" id="btn-' + fid + '">🖨️ ' + title + "</button>";
      setTimeout(function () {
        var b = $("btn-" + fid);
        if (b && !b.dataset.bound) {
          b.dataset.bound = "1";
          b.addEventListener("click", function () { window.print(); });
        }
      }, 30);
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "textarea") {
      wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
        '<textarea class="form-textarea" data-custom-field-id="' + fid + '" rows="3"></textarea>';
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "phone") {
      wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
        '<input type="tel" class="form-input" data-custom-field-id="' + fid + '" dir="ltr" placeholder="0912...">';
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "widget-list") {
      wrap.classList.add("full-width");
      wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
        '<div class="table-responsive"><table class="data-table"><thead><tr id="head-' + esc(tabKey(tabId)) + '"></tr></thead>' +
        '<tbody id="body-' + esc(tabKey(tabId)) + '"></tbody></table></div>';
      setTimeout(function () { renderUserTabList(tabId); }, 40);
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "select") {
      wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
        '<select class="form-select" data-custom-field-id="' + fid + '"><option value="">انتخاب کنید...</option>' +
        (field.options || ["گزینه ۱", "گزینه ۲"]).map(function (o) {
          return "<option>" + esc(o) + "</option>";
        }).join("") + "</select>";
      return stampWidgetField(wrap, fid, field);
    }
    if (kind === "date") {
      wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
        '<input type="text" class="form-input jalali-date-input" data-kind="date" data-custom-field-id="' + fid + '" placeholder="1405/05/22" inputmode="numeric">';
      setTimeout(function () {
        var inp = wrap.querySelector("input");
        if (inp && window.attachJalaliPicker) window.attachJalaliPicker(inp);
      }, 30);
      return stampWidgetField(wrap, fid, field);
    }
    var itype = kind === "number" ? "number" : "text";
    wrap.innerHTML = '<label class="form-label">' + title + "</label>" +
      '<input type="' + itype + '" class="form-input" data-custom-field-id="' + fid + '" placeholder="' + title + '...">';
    if (kind !== "number") {
      setTimeout(function () {
        var inp = wrap.querySelector("input");
        if (inp && window.attachInstantAdd) window.attachInstantAdd(inp);
      }, 30);
    }
    return stampWidgetField(wrap, fid, field);
  };
  window.WIDGET_PALETTE = WIDGET_PALETTE;

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

  function saveUserTabRecord(tabId, scopeEl) {
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
      '<div class="card user-blank-card">' +
        '<div class="card-header"><div class="card-title"><span>' + esc(tab.icon || "📋") + " " + esc(tab.label) + "</span></div>" +
        '<button type="button" class="btn btn-outline btn-sm" onclick="switchTab(\'tab-dashboard\')">🏠 صفحه اصلی</button></div>' +
        '<p class="col-help" style="margin:0 0 .75rem">صفحه خالی است. از «ستون‌ها و کالاها» یا «طراحی دستی تب‌ها» فیلد و کلید بگذارید.</p>' +
        '<form id="form-' + key + '" onsubmit="return false;">' +
          '<input type="hidden" id="edit-' + key + '" value="">' +
          '<div class="form-grid" id="grid-' + key + '"></div>' +
          '<div id="cfHost-' + key + '" class="form-group full-width form-grid extra-cf-host"></div>' +
        "</form></div>";
    main.appendChild(sec);
  }

  function stripDefaultUserChrome(tab) {
    if (!tab || !$(tab.id)) return;
    var key = tab.key || tabKey(tab.id);
    var pane = $(tab.id);
    ["btnSave-" + key, "btnReset-" + key].forEach(function (id) {
      var b = $(id);
      if (!b) return;
      var g = b.closest(".form-group") || b.parentNode;
      if (g && g.parentNode) g.parentNode.removeChild(g);
    });
    var head = $("head-" + key);
    if (head) {
      var card = head.closest(".card");
      if (card && card.parentNode && !card.querySelector("form")) card.parentNode.removeChild(card);
    }
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
    if (!state.tabOrder) state.tabOrder = {};
    var maxN = 0;
    Object.keys(state.tabOrder).forEach(function (k) {
      var n = Number(state.tabOrder[k]) || 0;
      if (n > maxN) maxN = n;
    });
    state.tabOrder[tab.id] = maxN + 1;
    state.userTabs.push(tab);
    if (!state.customFields) state.customFields = {};
    if (!state.customFields[tab.key]) state.customFields[tab.key] = [];
    if (!state.customRecords) state.customRecords = {};
    state.customRecords[tab.key] = [];
    saveState();
    ensureUserTabPane(tab);
    if (typeof setupNavigationMenu === "function") setupNavigationMenu();
    window._activeColTab = tab.id;
    window._activeManualTab = tab.id;
    if (typeof window.refreshColumnsDesigner === "function") window.refreshColumnsDesigner();
    alert("تب «" + label + "» خالی ساخته شد. همین‌جا از امکانات آماده روی آن بگذارید.");
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

  window.addWidgetToActiveTab = function (kind, label, opts) {
    opts = opts || {};
    var tabId = opts.tabId || window._activeManualTab || window._activeColTab;
    if (!tabId || tabId === "tab-manual-design") {
      alert("اول یک تب را از گرید بالا انتخاب کنید.");
      return null;
    }
    var key = fieldKeyOfTab(tabId);
    if (!state.customFields) state.customFields = {};
    if (!state.customFields[key]) state.customFields[key] = [];
    if (isUserTab(tabId)) {
      var ut = (state.userTabs || []).filter(function (t) { return t.id === tabId; })[0];
      if (ut) ensureUserTabPane(ut);
    }
    var isWidget = String(kind).indexOf("widget-") === 0;
    if (isWidget && !opts.allowDup) {
      var exists = state.customFields[key].filter(function (f) { return f.inputKind === kind; })[0];
      if (exists) {
        if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(tabId);
        if (typeof window.refreshManualCanvas === "function") window.refreshManualCanvas(tabId);
        var st = $("colAddStatus") || $("manAddStatus");
        if (st) st.textContent = "«" + label + "» از قبل روی این تب هست.";
        else alert("«" + label + "» از قبل روی این تب هست. می‌توانید جایش را در طراحی دستی عوض کنید.");
        return exists;
      }
    }
    var neu = {
      id: "cf-" + key + "-" + kind.replace(/\W/g, "") + "-" + Date.now(),
      label: label,
      type: kind === "select" ? "select" : "simple",
      inputKind: kind,
      options: kind === "select" ? ["گزینه ۱", "گزینه ۲"] : [],
      showInForm: true,
      showInList: !isWidget,
      order: (state.customFields[key].length || 0) + 1,
      size: kind === "widget-map" || kind === "textarea" || kind === "widget-list" ? 900 : 220,
      place: kind === "widget-map" || kind === "textarea" || kind === "widget-list" ? "under" : "beside",
      actionScope: opts.scope || "form",
      scopeId: opts.scopeId || ""
    };
    if (opts.x != null) neu._placeX = opts.x;
    if (opts.y != null) neu._placeY = opts.y;
    state.customFields[key].push(neu);
    saveState();
    var cid = (key === "pharmacy" ? "pharmacyCustomFieldsContainer" : key === "doctor" ? "doctorCustomFieldsContainer" : key === "order" ? "orderCustomFieldsContainer" : ("cfHost-" + key));
    if (!$(cid) && typeof window.applyFullFormLayout === "function") {
      /* host after layout */
    }
    if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(tabId);
    else if (typeof renderCustomFieldsInForm === "function" && $(cid)) renderCustomFieldsInForm(key, cid);
    if (opts.x != null && typeof window.placeFieldOnTab === "function") {
      window.placeFieldOnTab(tabId, neu.id, opts.x, opts.y, opts.scope, opts.scopeId);
    }
    if (typeof window.refreshColumnsDesigner === "function") window.refreshColumnsDesigner();
    if (typeof window.refreshManualCanvas === "function") window.refreshManualCanvas(tabId);
    var st2 = $("colAddStatus") || $("manAddStatus");
    if (st2) st2.textContent = "«" + label + "» به تب اضافه شد.";
    else alert("«" + label + "» به تب اضافه شد.");
    return neu;
  };
  function addWidgetToActiveTab(kind, label) {
    return window.addWidgetToActiveTab(kind, label);
  }

  function fieldKeyOfTab(tabId) {
    var ut = ((state.userTabs || []).filter(function (t) { return t.id === tabId; })[0]);
    if (ut && ut.key) return ut.key;
    var map = { "tab-pharmacies": "pharmacy", "tab-doctors": "doctor", "tab-orders": "order" };
    return map[tabId] || String(tabId || "").replace(/^tab-/, "") || "misc";
  }

  function createFieldOnTab(tabId, kind, label, boxId) {
    var key = fieldKeyOfTab(tabId);
    if (!state.customFields) state.customFields = {};
    if (!state.customFields[key]) state.customFields[key] = [];
    var isWidget = String(kind).indexOf("widget-") === 0;
    var neu = {
      id: "cf-" + key + "-" + Date.now() + "-" + Math.floor(Math.random() * 999),
      label: label,
      type: kind === "select" ? "select" : (kind === "number" ? "simple" : "simple"),
      inputKind: kind,
      options: kind === "select" ? ["گزینه ۱", "گزینه ۲"] : [],
      allowAddOption: kind === "select",
      showInForm: true,
      showInList: !isWidget,
      order: state.customFields[key].length + 1,
      size: kind === "widget-map" || kind === "textarea" ? 900 : 260,
      place: kind === "widget-map" || kind === "textarea" ? "under" : "beside",
      boxId: boxId || ""
    };
    state.customFields[key].push(neu);
    if (boxId) {
      if (!state.formBoxes) state.formBoxes = {};
      if (!state.formBoxes[key]) state.formBoxes[key] = [];
      state.formBoxes[key].forEach(function (bx) {
        if (bx.id === boxId) {
          if (!bx.fieldIds) bx.fieldIds = [];
          if (bx.fieldIds.indexOf(neu.id) === -1) bx.fieldIds.push(neu.id);
        }
      });
    }
    return neu;
  }

  function enhanceDesignerChrome() {
    var host = $("columnsDesignerHost");
    if (!host) return;
    var secs = typeof window.getAllMenuSections === "function" ? window.getAllMenuSections() : [];

    if (!$("colNewTabBar")) {
      var bar = document.createElement("div");
      bar.id = "colNewTabBar";
      bar.className = "col-newtab-bar";
      bar.innerHTML =
        "<strong>تب جدید مدیر:</strong>" +
        '<input id="colNewTabLabel" class="form-input" placeholder="مثلاً بازرسی انبار">' +
        '<input id="colNewTabOrder" class="form-input" type="number" min="1" placeholder="شماره تب" style="max-width:110px">' +
        '<button type="button" id="btnCreateUserTab" class="btn btn-primary btn-sm" style="background:#0d9488">➕ ساخت تب جدید</button>' +
        '<span class="col-help">تب به منوی اصلی و سایدبار هم اضافه می‌شود. شماره یعنی جای تب در منو.</span>';
      var grid = $("colTabGrid");
      if (grid && grid.parentNode) grid.parentNode.insertBefore(bar, grid);
      else host.insertBefore(bar, host.firstChild);
      var btn = $("btnCreateUserTab");
      if (btn) btn.addEventListener("click", function () {
        var id = window.createUserTab(($("colNewTabLabel") || {}).value);
        var ord = parseInt(($("colNewTabOrder") || {}).value, 10);
        if (id && ord > 0) {
          if (!state.tabOrder) state.tabOrder = {};
          state.tabOrder[id] = ord;
          saveState();
          if (typeof setupNavigationMenu === "function") setupNavigationMenu();
          if (typeof window.refreshColumnsDesigner === "function") window.refreshColumnsDesigner();
        }
        if ($("colNewTabLabel")) $("colNewTabLabel").value = "";
      });
    }

    var orderHost = $("colTabOrderBar");
    if (!orderHost) {
      orderHost = document.createElement("div");
      orderHost.id = "colTabOrderBar";
      orderHost.className = "col-tab-order-bar";
      var g2 = $("colTabGrid");
      if (g2 && g2.parentNode) g2.parentNode.insertBefore(orderHost, g2.nextSibling);
      else host.appendChild(orderHost);
    }
    if (!state.tabOrder) state.tabOrder = {};
    orderHost.innerHTML = "<strong>شماره تب‌ها در منوی اصلی</strong><div class='col-tab-order-list'>" +
      secs.map(function (sec, i) {
        var n = Number(state.tabOrder[sec.id]) || (i + 1);
        return "<label class='col-tab-order-row'><span>" + esc(sec.icon + " " + sec.label) +
          "</span><input type='number' min='1' class='form-input col-tab-ord' data-tid='" + esc(sec.id) + "' value='" + n + "'></label>";
      }).join("") + "</div>" +
      '<button type="button" id="btnSaveTabOrder" class="btn btn-primary btn-sm" style="background:#0d9488;margin-top:.45rem">ذخیره ترتیب تب‌ها</button>';
    var saveOrd = $("btnSaveTabOrder");
    if (saveOrd && !saveOrd.dataset.bound) {
      saveOrd.dataset.bound = "1";
      saveOrd.addEventListener("click", function () {
        orderHost.querySelectorAll(".col-tab-ord").forEach(function (inp) {
          state.tabOrder[inp.getAttribute("data-tid")] = parseInt(inp.value, 10) || 1;
        });
        saveState();
        if (typeof setupNavigationMenu === "function") setupNavigationMenu();
        if (typeof window.refreshColumnsDesigner === "function") window.refreshColumnsDesigner();
        alert("ترتیب تب‌ها در منوی اصلی ذخیره شد.");
      });
    }

    var panel = $("colDesignerPanel");
    if (panel && !panel.hidden && window._activeColTab) {
      var boxSel = $("colFieldBoxTarget");
      if (boxSel && boxSel.options.length <= 1) {
        var key0 = fieldKeyOfTab(window._activeColTab);
        ((state.formBoxes && state.formBoxes[key0]) || []).forEach(function (b) {
          var o = document.createElement("option");
          o.value = b.id;
          o.textContent = b.label;
          boxSel.appendChild(o);
        });
      }

      if (!$("colWidgetPalette")) {
        var pal = document.createElement("div");
        pal.id = "colWidgetPalette";
        pal.className = "col-widget-palette";
        pal.innerHTML = "<strong>امکانات آماده همین برنامه</strong>" +
          "<p class='col-help'>اول تب را از گرید بالا انتخاب کنید، بعد روی یک امکان بزنید. روی تب خالی ساخته می‌شود.</p>" +
          '<div id="colAddStatus" class="col-add-status">تب فعال: انتخاب نشده</div>' +
          '<div class="col-widget-btns">' +
          WIDGET_PALETTE.map(function (w) {
            return '<button type="button" class="btn btn-outline btn-sm col-add-widget" draggable="true" data-kind="' + w.kind + '" data-label="' + esc(w.label) + '">' + w.icon + " " + esc(w.label) + "</button>";
          }).join("") + "</div>";
        var boxMaker = panel.querySelector(".col-box-maker");
        if (boxMaker) boxMaker.parentNode.insertBefore(pal, boxMaker);
        else panel.insertBefore(pal, panel.firstChild.nextSibling);
      }

      var maker = panel.querySelector(".col-box-maker");
      if (maker && !maker.dataset.rich) {
        maker.dataset.rich = "1";
        var oldList = $("colBoxList");
        maker.innerHTML =
          "<strong>ساخت / ویرایش کادر</strong>" +
          '<div class="form-grid" style="margin-top:.5rem">' +
            '<div class="form-group"><label class="form-label">نام کادر</label><input id="colBoxLabel" class="form-input" placeholder="مثلاً اطلاعات تماس"></div>' +
            '<div class="form-group"><label class="form-label">این کادر در کدام تب باشد؟</label><select id="colBoxTab" class="form-select"></select></div>' +
            '<div class="form-group"><label class="form-label">شماره ترتیب کادر</label><input id="colBoxOrder" class="form-input" type="number" min="1" value="1"></div>' +
          "</div>" +
          "<p class='col-help' style='margin:.55rem 0 .35rem'>داخل این کادر چه چیزی ساخته شود؟ (چند مورد را می‌توانید روشن کنید)</p>" +
          '<div id="colBoxNewItems" class="col-widget-btns">' +
          WIDGET_PALETTE.map(function (w) {
            return "<label class='col-box-chk'><input type='checkbox' class='col-box-newitem' data-kind='" + w.kind + "' data-label='" + esc(w.label) + "'> " + w.icon + " " + esc(w.label) + "</label>";
          }).join("") + "</div>" +
          '<button type="button" id="btnAddColBox" class="btn btn-primary btn-sm" style="background:#0d9488;margin-top:.65rem">➕ ثبت کادر</button>' +
          '<div id="colBoxList"></div>';
        var tabSel = $("colBoxTab");
        if (tabSel) {
          secs.forEach(function (sec) {
            var o = document.createElement("option");
            o.value = sec.id;
            o.textContent = sec.icon + " " + sec.label;
            if (sec.id === window._activeColTab) o.selected = true;
            tabSel.appendChild(o);
          });
        }
        var addBtn = $("btnAddColBox");
        if (addBtn) {
          addBtn.addEventListener("click", function () {
            var name = (($("colBoxLabel") || {}).value || "").trim();
            if (!name) { alert("نام کادر را بنویسید."); return; }
            var destTab = (($("colBoxTab") || {}).value) || window._activeColTab;
            var destKey = fieldKeyOfTab(destTab);
            if (!state.formBoxes) state.formBoxes = {};
            if (!state.formBoxes[destKey]) state.formBoxes[destKey] = [];
            var box;
            if (window._editingBoxId) {
              box = state.formBoxes[destKey].filter(function (x) { return x.id === window._editingBoxId; })[0];
              if (!box) {
                box = { id: window._editingBoxId, label: name, fieldIds: [] };
                state.formBoxes[destKey].push(box);
              }
              box.label = name;
              window._editingBoxId = "";
              addBtn.textContent = "➕ ثبت کادر";
            } else {
              box = { id: "box-" + destKey + "-" + Date.now(), label: name, fieldIds: [], order: parseInt(($("colBoxOrder") || {}).value, 10) || 1 };
              state.formBoxes[destKey].push(box);
            }
            maker.querySelectorAll(".col-box-newitem:checked").forEach(function (chk) {
              createFieldOnTab(destTab, chk.getAttribute("data-kind"), chk.getAttribute("data-label"), box.id);
              chk.checked = false;
            });
            saveState();
            if ($("colBoxLabel")) $("colBoxLabel").value = "";
            if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(destTab);
            if (typeof window.refreshColumnsDesigner === "function") window.refreshColumnsDesigner();
            alert("کادر «" + name + "» در تب انتخاب‌شده ثبت شد و موارد تیک‌خورده داخلش قرار گرفت.");
          });
        }
        var destKeyNow = fieldKeyOfTab(window._activeColTab);
        if (typeof window.renderColBoxList === "function") {
          try { window.renderColBoxList(window._activeColTab, destKeyNow); } catch (e) {}
        }
      }

      var stBar = $("colAddStatus");
      if (stBar) {
        var secN = (secs.filter(function (s) { return s.id === window._activeColTab; })[0] || {});
        stBar.textContent = "تب فعال: " + (secN.icon || "") + " " + (secN.label || window._activeColTab);
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
          if (!$("btnEditUserTab")) {
            var ed = document.createElement("button");
            ed.type = "button";
            ed.id = "btnEditUserTab";
            ed.className = "btn btn-outline btn-sm";
            ed.textContent = "✏️ ویرایش این تب";
            ed.addEventListener("click", function () {
              if (typeof window.editUserTab === "function") window.editUserTab(window._activeColTab);
            });
            actions.appendChild(ed);
          }
          actions.appendChild(del);
        }
      }
    }
  }

  var origApplyOrder = window.applyCustomFieldOrderInForm;
  if (typeof origApplyOrder === "function" && !window._v12OrderWrap) {
    window._v12OrderWrap = true;
    window.applyCustomFieldOrderInForm = function (entityType, containerId) {
      if (window._layoutBusy) return;
      try { origApplyOrder(entityType, containerId); } catch (e) {}
    };
  }

  function boot() {
    try {
      if (state && !state.userTabs) state.userTabs = [];
      if (state && !state.customRecords) state.customRecords = {};
      (state.userTabs || []).forEach(function (t) {
        ensureUserTabPane(t);
        stripDefaultUserChrome(t);
      });
      if ((state.userTabs || []).length && typeof setupNavigationMenu === "function") setupNavigationMenu();
    } catch (e) { console.error("v12 tabs", e); }

    try { enhanceDesignerChrome(); } catch (e) {}

    if (!window._palDelegate) {
      window._palDelegate = true;
      document.addEventListener("click", function (e) {
        var b = e.target.closest(".col-add-widget");
        if (!b) return;
        if (b.closest("#manualDesignCanvas")) return;
        e.preventDefault();
        addWidgetToActiveTab(b.getAttribute("data-kind"), b.getAttribute("data-label"));
      });
    }

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
