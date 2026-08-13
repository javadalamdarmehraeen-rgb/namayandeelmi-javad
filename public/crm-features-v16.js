// v16 — کشویی قابل تایپ/جستجو، افزودن شهر بعد از استان، نام داروخانه سراسری، فریز سرستون، قفل طراح دستی
(function () {
  "use strict";

  var VER = "11.14.0";
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function norm(s) {
    return String(s || "")
      .replace(/ي/g, "ی").replace(/ك/g, "ک")
      .replace(/‌/g, "")
      .trim();
  }

  /* ---------- geo extras (شهر/منطقه اضافه‌شده مدیر) ---------- */
  function geoStore() {
    if (!window.state) return {};
    if (!state.geoExtras) state.geoExtras = {};
    return state.geoExtras;
  }

  function applyGeoExtrasToData() {
    if (typeof IRAN_GEO_DATA === "undefined") return;
    var extras = geoStore();
    Object.keys(extras).forEach(function (prov) {
      if (!IRAN_GEO_DATA[prov]) IRAN_GEO_DATA[prov] = {};
      var cities = extras[prov] || {};
      Object.keys(cities).forEach(function (city) {
        if (!IRAN_GEO_DATA[prov][city]) IRAN_GEO_DATA[prov][city] = [];
        (cities[city] || []).forEach(function (d) {
          if (d && IRAN_GEO_DATA[prov][city].indexOf(d) === -1) IRAN_GEO_DATA[prov][city].push(d);
        });
      });
    });
  }

  function addExtraCity(prov, city) {
    prov = String(prov || "").trim();
    city = String(city || "").trim();
    if (!prov || !city) return false;
    var extras = geoStore();
    if (!extras[prov]) extras[prov] = {};
    if (!extras[prov][city]) extras[prov][city] = [];
    if (typeof IRAN_GEO_DATA !== "undefined") {
      if (!IRAN_GEO_DATA[prov]) IRAN_GEO_DATA[prov] = {};
      if (!IRAN_GEO_DATA[prov][city]) IRAN_GEO_DATA[prov][city] = [];
    }
    if (typeof saveState === "function") saveState();
    applyGeoExtrasToData();
    return true;
  }

  function addExtraDistrict(prov, city, dist) {
    prov = String(prov || "").trim();
    city = String(city || "").trim();
    dist = String(dist || "").trim();
    if (!prov || !city || !dist) return false;
    addExtraCity(prov, city);
    var extras = geoStore();
    if (extras[prov][city].indexOf(dist) === -1) extras[prov][city].push(dist);
    if (typeof IRAN_GEO_DATA !== "undefined" && IRAN_GEO_DATA[prov] && IRAN_GEO_DATA[prov][city]) {
      if (IRAN_GEO_DATA[prov][city].indexOf(dist) === -1) IRAN_GEO_DATA[prov][city].push(dist);
    }
    if (typeof saveState === "function") saveState();
    return true;
  }

  function wrapPopulateGeo() {
    if (window._v16geoWrap) return;
    window._v16geoWrap = true;
    if (typeof window.populateProvinces === "function") {
      var op = window.populateProvinces;
      window.populateProvinces = function (sel, selected) {
        applyGeoExtrasToData();
        op(sel, selected);
        refreshCombo(sel);
      };
    }
    if (typeof window.populateCities === "function") {
      var oc = window.populateCities;
      window.populateCities = function (prov, sel, selected) {
        applyGeoExtrasToData();
        oc(prov, sel, selected);
        refreshCombo(sel);
      };
    }
    if (typeof window.populateDistricts === "function") {
      var od = window.populateDistricts;
      window.populateDistricts = function (prov, city, sel, selected) {
        applyGeoExtrasToData();
        od(prov, city, sel, selected);
        refreshCombo(sel);
      };
    }
  }

  /* ---------- کشویی قابل تایپ و جستجوی لحظه‌ای ---------- */
  function skipCombo(sel) {
    if (!sel || sel.tagName !== "SELECT") return true;
    if (sel.dataset.nocombo === "1") return true;
    if (sel.closest("#jalaliCalendarPopup") || sel.closest(".modal-overlay")) return true;
    if (sel.closest("#columnsDesignerHost") || sel.closest("#colDesignerPanel")) return true;
    if (sel.closest("#manualDesignCanvas") || sel.closest(".man-inspector")) return true;
    if (sel.id && sel.id.indexOf("jalali") === 0) return true;
    if (sel.classList.contains("crm-combo-src")) return true;
    return false;
  }

  function optionList(sel) {
    var out = [];
    Array.prototype.forEach.call(sel.options || [], function (o) {
      out.push({ value: o.value, text: (o.textContent || o.value || "").trim() });
    });
    return out;
  }

  function filterOpts(opts, q) {
    q = norm(q);
    if (!q) return opts;
    var start = [];
    var mid = [];
    opts.forEach(function (o) {
      if (!o.value && !o.text) return;
      var t = norm(o.text || o.value);
      if (t.indexOf(q) === 0) start.push(o);
      else if (t.indexOf(q) !== -1) mid.push(o);
    });
    return start.concat(mid);
  }

  function enhanceSelect(sel) {
    if (skipCombo(sel)) return;
    if (sel.closest(".crm-combo")) {
      refreshCombo(sel);
      return;
    }
    var parent = sel.parentNode;
    if (!parent) return;
    var wrap = document.createElement("div");
    wrap.className = "crm-combo";
    parent.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add("crm-combo-src");
    sel.setAttribute("tabindex", "-1");
    sel.style.position = "absolute";
    sel.style.opacity = "0";
    sel.style.pointerEvents = "none";
    sel.style.width = "1px";
    sel.style.height = "1px";
    var inp = document.createElement("input");
    inp.type = "text";
    inp.className = "form-input crm-combo-input";
    inp.setAttribute("autocomplete", "off");
    inp.setAttribute("autocorrect", "off");
    inp.placeholder = sel.options[0] && !sel.options[0].value ? (sel.options[0].textContent || "جستجو یا انتخاب...") : "تایپ کنید تا جستجو شود...";
    var caret = document.createElement("button");
    caret.type = "button";
    caret.className = "crm-combo-caret";
    caret.tabIndex = -1;
    caret.textContent = "▾";
    var list = document.createElement("div");
    list.className = "crm-combo-list";
    list.hidden = true;
    wrap.appendChild(inp);
    wrap.appendChild(caret);
    wrap.appendChild(list);
    var selected = sel.options[sel.selectedIndex];
    inp.value = selected && selected.value ? (selected.textContent || selected.value) : "";

    function paint(q) {
      var opts = filterOpts(optionList(sel), q);
      if (!opts.length) {
        list.innerHTML = "<div class='crm-combo-empty'>موردی نیست</div>";
        list.hidden = false;
        return;
      }
      list.innerHTML = opts.slice(0, 80).map(function (o) {
        var on = o.value === sel.value ? " on" : "";
        return "<button type='button' class='crm-combo-item" + on + "' data-val='" + esc(o.value) + "'>" + esc(o.text || "—") + "</button>";
      }).join("");
      list.hidden = false;
      Array.prototype.forEach.call(list.querySelectorAll(".crm-combo-item"), function (btn) {
        btn.addEventListener("mousedown", function (e) { e.preventDefault(); });
        btn.addEventListener("click", function () {
          pick(btn.getAttribute("data-val"));
        });
      });
    }

    function pick(val) {
      sel.value = val || "";
      var lab = "";
      Array.prototype.forEach.call(sel.options, function (o) {
        if (o.value === sel.value) lab = o.textContent || o.value;
      });
      inp.value = lab;
      list.hidden = true;
      try { sel.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
    }

    function openAll() { paint(""); }

    inp.addEventListener("focus", function () { openAll(); });
    inp.addEventListener("click", function () { openAll(); });
    caret.addEventListener("click", function (e) {
      e.preventDefault();
      if (list.hidden) { inp.focus(); openAll(); }
      else list.hidden = true;
    });
    inp.addEventListener("input", function () { paint(inp.value); });
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { list.hidden = true; return; }
      if (e.key === "Enter") {
        e.preventDefault();
        var first = list.querySelector(".crm-combo-item");
        if (first) pick(first.getAttribute("data-val"));
      }
    });
    wrap._crmRefresh = function () {
      var cur = sel.options[sel.selectedIndex];
      if (!inp.matches(":focus")) inp.value = cur && cur.value ? (cur.textContent || cur.value) : "";
    };
  }

  function refreshCombo(sel) {
    if (!sel) return;
    var wrap = sel.closest && sel.closest(".crm-combo");
    if (wrap && typeof wrap._crmRefresh === "function") wrap._crmRefresh();
  }

  function enhanceAllSelects(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll("select.form-select, select[id]"), function (sel) {
      try { enhanceSelect(sel); } catch (e) {}
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".crm-combo")) return;
    document.querySelectorAll(".crm-combo-list").forEach(function (l) { l.hidden = true; });
  });

  /* ---------- نام داروخانه سراسری ---------- */
  function rememberPharmacyName(name, extra) {
    name = String(name || "").trim();
    if (!name || !window.state) return null;
    if (!state.knownPharmacyNames) state.knownPharmacyNames = [];
    if (state.knownPharmacyNames.indexOf(name) === -1) state.knownPharmacyNames.push(name);
    if (!state.pharmacies) state.pharmacies = [];
    var rec = state.pharmacies.filter(function (p) { return p.name === name; })[0];
    if (!rec) {
      rec = {
        id: "ph-name-" + Date.now(),
        name: name,
        dateAdded: (typeof jalaliTodayEnglish === "function" ? jalaliTodayEnglish() : ""),
        province: (extra && extra.province) || "",
        city: (extra && extra.city) || "",
        district: (extra && extra.district) || "",
        address: (extra && extra.address) || "",
        phone: (extra && extra.phone) || "",
        stub: true,
        customFields: {}
      };
      state.pharmacies.push(rec);
    }
    try { if (typeof saveState === "function") saveState(false); } catch (e) {}
    try { if (typeof populatePharmacyDatalistInOrders === "function") populatePharmacyDatalistInOrders(); } catch (e) {}
    try { if (typeof updateNavBadges === "function") updateNavBadges(); } catch (e) {}
    return rec;
  }

  function isKnownPharmacy(name, exceptId) {
    name = String(name || "").trim();
    if (!name || !window.state) return false;
    if ((state.pharmacies || []).some(function (p) { return p.name === name && p.id !== exceptId; })) return true;
    return (state.knownPharmacyNames || []).indexOf(name) !== -1;
  }

  window.rememberPharmacyName = rememberPharmacyName;
  window.isKnownPharmacy = isKnownPharmacy;

  function hookPharmacyNameField() {
    var inp = $("pharmacyName");
    if (!inp || inp.dataset.v16ph === "1") return;
    inp.dataset.v16ph = "1";
    var host = $("pharmacyNamePickBox");
    if (!host) {
      host = document.createElement("div");
      host.id = "pharmacyNamePickBox";
      host.className = "ph-pick-box ph-pick-overlay";
      host.hidden = true;
      var g = inp.closest(".form-group") || inp.parentNode;
      if (g) {
        if (getComputedStyle(g).position === "static") g.style.position = "relative";
        g.appendChild(host);
      }
    }
    function show(q) {
      q = String(q || "").trim();
      var ql = norm(q).toLowerCase();
      var hits = (state.pharmacies || []).filter(function (p) {
        if (!p.name) return false;
        if (!ql) return true;
        return norm(p.name).toLowerCase().indexOf(ql) !== -1;
      });
      if (!hits.length) {
        host.hidden = !q;
        host.innerHTML = q ? "<div class='ph-pick-empty'>این نام هنوز ثبت نشده. با ثبت فرم یا افزودن لحظه‌ای ذخیره می‌شود.</div>" : "";
        return;
      }
      host.hidden = false;
      host.innerHTML = "<div class='ph-pick-hint'>" + hits.length + " داروخانه ذخیره‌شده</div>" +
        hits.slice(0, 25).map(function (p) {
          return "<button type='button' class='ph-pick-card' data-pid='" + esc(p.id) + "'>" +
            "<strong>🏥 " + esc(p.name) + "</strong>" +
            "<span>" + esc([p.province, p.city, p.district].filter(Boolean).join(" / ")) + "</span></button>";
        }).join("");
      Array.prototype.forEach.call(host.querySelectorAll(".ph-pick-card"), function (btn) {
        btn.addEventListener("click", function () {
          var rec = (state.pharmacies || []).filter(function (p) { return p.id === btn.getAttribute("data-pid"); })[0];
          if (!rec) return;
          inp.value = rec.name || "";
          host.hidden = true;
          if (typeof editPharmacy === "function" && rec.id && !rec.stub) {
            /* فقط نام را می‌نشاند؛ ویرایش کامل با دکمه ویرایش لیست */
          }
        });
      });
    }
    inp.addEventListener("input", function () { show(inp.value); });
    inp.addEventListener("focus", function () { show(inp.value); });
    document.addEventListener("click", function (e) {
      if (host.hidden) return;
      if (host.contains(e.target) || e.target === inp) return;
      host.hidden = true;
    });
  }

  function wrapInstantAddPharmacy() {
    if (typeof window.attachInstantAdd !== "function" || window._v16fly) return;
    window._v16fly = true;
    var orig = window.attachInstantAdd;
    window.attachInstantAdd = function (inp) {
      orig(inp);
      if (!inp || inp.id !== "pharmacyName") return;
      var row = inp.closest(".instant-add-row");
      var btn = row && row.querySelector(".btn-instant-add");
      if (!btn || btn.dataset.v16ph === "1") return;
      btn.dataset.v16ph = "1";
      btn.addEventListener("click", function () {
        var v = (inp.value || "").trim();
        if (!v) return;
        if (isKnownPharmacy(v)) {
          alert("داروخانه «" + v + "» قبلاً در برنامه ذخیره شده (تکراری).");
          return;
        }
        rememberPharmacyName(v);
        alert("نام داروخانه «" + v + "» در کل برنامه ذخیره شد و در سفارشات هم می‌آید.");
      });
    };
  }

  function wrapPharmacySaveDup() {
    var form = $("formPharmacy");
    if (!form || form.dataset.v16dup === "1") return;
    form.dataset.v16dup = "1";
    form.addEventListener("submit", function () {
      var name = (($("pharmacyName") || {}).value || "").trim();
      var existing = name && (state.pharmacies || []).filter(function (p) { return p.name === name; })[0];
      if (existing && $("pharmacyEditId") && !$("pharmacyEditId").value) {
        $("pharmacyEditId").value = existing.id;
      }
      if (name) rememberPharmacyName(name, {
        province: (($("pharmacyProvince") || {}).value) || "",
        city: (($("pharmacyCity") || {}).value) || "",
        district: (($("pharmacyDistrict") || {}).value) || "",
        address: (($("pharmacyAddress") || {}).value) || "",
        phone: (($("pharmacyPhone") || {}).value) || ""
      });
    }, true);
  }

  /* ---------- فریز سرستون + اسکرول افقی زیر سرستون ---------- */
  function undoOldFreeze() {
    document.querySelectorAll(".tbl-freeze-shell").forEach(function (shell) {
      var body = shell.querySelector(".tbl-freeze-body");
      var wrap = body && (body.querySelector(".table-responsive") || body.firstElementChild);
      if (wrap && shell.parentNode) {
        shell.parentNode.insertBefore(wrap, shell);
        wrap.dataset.v15freeze = "";
        var t = wrap.querySelector("table");
        if (t) t.classList.remove("tbl-freeze-src");
      }
      if (shell.parentNode) shell.parentNode.removeChild(shell);
    });
  }

  function refreshFrozenTable(box) {
    if (!box) return;
    var table = box.querySelector("table");
    if (!table || !table.tHead) return;
    box.classList.add("tbl-fz-box");
    var old = table.querySelector("tr.tbl-x-row");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var colCount = table.tHead.rows[0] ? table.tHead.rows[0].cells.length : 8;
    var tr = document.createElement("tr");
    tr.className = "tbl-x-row";
    var th = document.createElement("th");
    th.colSpan = colCount;
    th.className = "tbl-x-cell";
    var bar = document.createElement("div");
    bar.className = "tbl-top-x";
    var inner = document.createElement("div");
    inner.className = "tbl-top-x-inner";
    bar.appendChild(inner);
    th.appendChild(bar);
    tr.appendChild(th);
    table.tHead.appendChild(tr);
    function syncW() {
      var headH = 0;
      if (table.tHead.rows[0]) headH = Math.ceil(table.tHead.rows[0].getBoundingClientRect().height) || 38;
      th.style.top = headH + "px";
      inner.style.width = Math.max(table.scrollWidth, box.scrollWidth, 400) + "px";
    }
    var lock = false;
    bar.addEventListener("scroll", function () {
      if (lock) return;
      lock = true;
      box.scrollLeft = bar.scrollLeft;
      lock = false;
    });
    box.addEventListener("scroll", function () {
      if (lock) return;
      lock = true;
      bar.scrollLeft = box.scrollLeft;
      lock = false;
    });
    setTimeout(syncW, 30);
    setTimeout(syncW, 200);
    box._fzSync = syncW;
  }
  window.refreshFrozenTable = refreshFrozenTable;

  function freezeKnownTables() {
    undoOldFreeze();
    ["colFieldList", "tablePharmacies", "tableDoctors", "tableOrders"].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var box = el.classList && el.classList.contains("table-responsive")
        ? el
        : (el.closest(".table-responsive") || el.parentElement);
      if (box) refreshFrozenTable(box);
    });
  }

  window.applyFieldPixelSize = function (tabId, fieldId, size) {
    size = parseInt(size, 10);
    if (!(size > 40) || !fieldId) return;
    var el = document.getElementById(fieldId);
    var group = el && el.closest(".form-group");
    var keepUnder = !!(group && group.classList.contains("col-place-under"));
    try {
      var key = tabId === "tab-pharmacies" ? "pharmacy" : tabId === "tab-doctors" ? "doctor" : tabId === "tab-orders" ? "order" : "";
      var meta = key && window.state && state.formFieldMeta && state.formFieldMeta[key] && state.formFieldMeta[key][fieldId];
      if (meta && meta.place === "under") keepUnder = true;
      ((state.customFields && key && state.customFields[key]) || []).forEach(function (f) {
        if (f.id === fieldId && f.place === "under") keepUnder = true;
      });
    } catch (eK) {}
    if (group && !keepUnder) {
      group.classList.add("col-place-beside");
      group.style.setProperty("flex", "0 0 " + size + "px", "important");
      group.style.setProperty("width", size + "px", "important");
      group.style.setProperty("max-width", size + "px", "important");
    }
    if (el) {
      el.style.setProperty("width", size + "px", "important");
      el.style.setProperty("max-width", size + "px", "important");
    }
    var combo = el && el.closest(".crm-combo");
    if (combo) {
      combo.style.setProperty("width", size + "px", "important");
      combo.style.setProperty("max-width", size + "px", "important");
    }
  };

  /* ---------- قفل طراح دستی: فیلدها فعال نباشند ---------- */
  window.lockManualDesigner = function () {
    var host = $("manualDesignCanvas");
    if (!host) return;
    host.classList.add("man-design-mode");
    var clone = host.querySelector(".man-clone") || host;
    clone.classList.add("man-design-mode");
    Array.prototype.forEach.call(clone.querySelectorAll("input, select, textarea, button.btn, .btn-toggle-option"), function (el) {
      if (el.closest(".man-handle") || el.closest(".man-resize") || el.closest(".man-inspector") || el.closest(".man-toolbar")) return;
      el.setAttribute("readonly", "readonly");
      el.setAttribute("tabindex", "-1");
      if (el.tagName === "BUTTON" || el.tagName === "SELECT") el.setAttribute("disabled", "disabled");
      el.style.pointerEvents = "none";
    });
    Array.prototype.forEach.call(clone.querySelectorAll(".man-item"), function (item) {
      if (getComputedStyle(item).position === "static") item.style.position = "relative";
      var lock = item.querySelector(":scope > .man-lock");
      if (!lock) {
        lock = document.createElement("div");
        lock.className = "man-lock";
        item.appendChild(lock);
      }
      lock.onmousedown = function (e) {
        if (e.target.closest(".man-handle") || e.target.closest(".man-resize")) return;
        e.preventDefault();
        e.stopPropagation();
      };
      lock.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(".man-item.man-selected").forEach(function (n) { n.classList.remove("man-selected"); });
        item.classList.add("man-selected");
        if (typeof window._manPick === "function") window._manPick(item);
        var insp = $("manInspector");
        if (insp) {
          insp.hidden = false;
          var lab = item.querySelector(".form-label, label, h4, .card-title, .col-user-box-title");
          if ($("manPropName")) $("manPropName").value = lab ? String(lab.textContent || "").replace(/\s+/g, " ").trim() : "";
          if ($("manPropW")) $("manPropW").value = String(Math.round(item.getBoundingClientRect().width));
          if ($("manPropH")) $("manPropH").value = String(Math.round(item.getBoundingClientRect().height));
          window._manSelected = item;
        }
      };
    });
  };

  /* ---------- تب افزودن: فشرده + استان→شهر→منطقه ---------- */
  function fillSel(sel, items, placeholder) {
    if (!sel) return;
    sel.innerHTML = "<option value=''>" + (placeholder || "انتخاب...") + "</option>";
    (items || []).forEach(function (v) {
      var o = document.createElement("option");
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
    enhanceSelect(sel);
  }

  function provinceNames() {
    applyGeoExtrasToData();
    var names = typeof IRAN_GEO_DATA !== "undefined" ? Object.keys(IRAN_GEO_DATA) : [];
    Object.keys(geoStore()).forEach(function (p) {
      if (names.indexOf(p) === -1) names.push(p);
    });
    return names.sort(function (a, b) { return a.localeCompare(b, "fa"); });
  }

  function cityNames(prov) {
    applyGeoExtrasToData();
    var names = [];
    if (typeof IRAN_GEO_DATA !== "undefined" && IRAN_GEO_DATA[prov]) {
      names = Object.keys(IRAN_GEO_DATA[prov]);
    }
    var extra = geoStore()[prov] || {};
    Object.keys(extra).forEach(function (c) {
      if (names.indexOf(c) === -1) names.push(c);
    });
    return names.sort(function (a, b) { return a.localeCompare(b, "fa"); });
  }

  function districtNames(prov, city) {
    applyGeoExtrasToData();
    var names = [];
    if (typeof IRAN_GEO_DATA !== "undefined" && IRAN_GEO_DATA[prov] && IRAN_GEO_DATA[prov][city]) {
      names = IRAN_GEO_DATA[prov][city].slice();
    }
    var extra = ((geoStore()[prov] || {})[city]) || [];
    extra.forEach(function (d) {
      if (names.indexOf(d) === -1) names.push(d);
    });
    return names;
  }

  function mountGeoEditor(panel) {
    if (!panel || $("geoAddEditor")) return;
    var box = document.createElement("div");
    box.id = "geoAddEditor";
    box.className = "geo-add-editor";
    box.innerHTML =
      "<strong>استان ← شهر ← منطقه</strong>" +
      "<p class='col-help'>اول استان را انتخاب کنید تا شهرهای همان استان بیاید. بعد می‌توانید شهر یا منطقه اضافه کنید.</p>" +
      "<div class='geo-add-row'>" +
        "<label>استان</label>" +
        "<select id='geoEdProv' class='form-select' data-nocombo='0'></select>" +
        "<input id='geoEdNewProv' class='form-input' placeholder='استان جدید'>" +
        "<button type='button' id='geoEdAddProv' class='btn btn-primary btn-sm' style='background:#0d9488'>➕ استان</button>" +
      "</div>" +
      "<div class='geo-add-row'>" +
        "<label>شهر این استان</label>" +
        "<select id='geoEdCity' class='form-select'></select>" +
        "<input id='geoEdNewCity' class='form-input' placeholder='شهر جدید برای استان انتخاب‌شده'>" +
        "<button type='button' id='geoEdAddCity' class='btn btn-primary btn-sm' style='background:#0d9488'>➕ شهر</button>" +
      "</div>" +
      "<div class='geo-add-row'>" +
        "<label>منطقه این شهر</label>" +
        "<select id='geoEdDist' class='form-select'></select>" +
        "<input id='geoEdNewDist' class='form-input' placeholder='منطقه جدید برای شهر انتخاب‌شده'>" +
        "<button type='button' id='geoEdAddDist' class='btn btn-primary btn-sm' style='background:#0d9488'>➕ منطقه</button>" +
      "</div>" +
      "<div id='geoEdList' class='geo-ed-list'></div>";
    var head = panel.querySelector(".add-panel-head");
    if (head && head.nextSibling) panel.insertBefore(box, head.nextSibling);
    else panel.insertBefore(box, panel.firstChild);

    function reloadProv() {
      fillSel($("geoEdProv"), provinceNames(), "انتخاب استان...");
      reloadCities();
    }
    function reloadCities() {
      var p = ($("geoEdProv") || {}).value || "";
      fillSel($("geoEdCity"), p ? cityNames(p) : [], p ? "شهرهای «" + p + "»" : "اول استان را انتخاب کنید");
      reloadDists();
      paintList();
    }
    function reloadDists() {
      var p = ($("geoEdProv") || {}).value || "";
      var c = ($("geoEdCity") || {}).value || "";
      fillSel($("geoEdDist"), (p && c) ? districtNames(p, c) : [], (p && c) ? "مناطق «" + c + "»" : "اول شهر را انتخاب کنید");
    }
    function paintList() {
      var host = $("geoEdList");
      if (!host) return;
      var p = ($("geoEdProv") || {}).value || "";
      if (!p) { host.innerHTML = "<span class='col-help'>استان را انتخاب کنید تا زیرمجموعه دیده شود.</span>"; return; }
      var cities = cityNames(p);
      var html = "<div class='geo-ed-now'>استان انتخاب‌شده: <strong>" + esc(p) + "</strong> — " + cities.length + " شهر</div>";
      cities.forEach(function (c) {
        var ds = districtNames(p, c);
        html += "<div class='geo-ed-city'><strong>" + esc(c) + "</strong>";
        html += "<span class='geo-ed-chips'>" + (ds.length ? ds.map(function (d) {
          return "<em>" + esc(d) + "</em>";
        }).join("") : "<em class='muted'>منطقه ثبت نشده</em>") + "</span></div>";
      });
      host.innerHTML = html;
    }

    reloadProv();
    if ($("geoEdProv")) $("geoEdProv").addEventListener("change", reloadCities);
    if ($("geoEdCity")) $("geoEdCity").addEventListener("change", function () { reloadDists(); paintList(); });

    if ($("geoEdAddProv")) $("geoEdAddProv").onclick = function () {
      var n = (($("geoEdNewProv") || {}).value || "").trim();
      if (!n) { alert("نام استان را بنویسید."); return; }
      if (typeof IRAN_GEO_DATA !== "undefined" && !IRAN_GEO_DATA[n]) IRAN_GEO_DATA[n] = {};
      var extras = geoStore();
      if (!extras[n]) extras[n] = {};
      if (typeof saveState === "function") saveState();
      if ($("geoEdNewProv")) $("geoEdNewProv").value = "";
      reloadProv();
      if ($("geoEdProv")) { $("geoEdProv").value = n; reloadCities(); }
      alert("استان «" + n + "» اضافه شد.");
    };
    if ($("geoEdAddCity")) $("geoEdAddCity").onclick = function () {
      var p = (($("geoEdProv") || {}).value || "").trim();
      var n = (($("geoEdNewCity") || {}).value || "").trim();
      if (!p) { alert("اول استان را از لیست انتخاب کنید."); return; }
      if (!n) { alert("نام شهر را بنویسید."); return; }
      addExtraCity(p, n);
      if ($("geoEdNewCity")) $("geoEdNewCity").value = "";
      reloadCities();
      if ($("geoEdCity")) $("geoEdCity").value = n;
      reloadDists();
      if (typeof populateCities === "function") {
        ["pharmacyCity", "doctorCity", "orderCity"].forEach(function (id) {
          var s = $(id); var prov = $((id.indexOf("pharmacy") === 0 ? "pharmacy" : id.indexOf("doctor") === 0 ? "doctor" : "order") + "Province");
          if (s && prov && prov.value === p) populateCities(p, s, s.value);
        });
      }
      alert("شهر «" + n + "» زیر استان «" + p + "» ذخیره شد.");
    };
    if ($("geoEdAddDist")) $("geoEdAddDist").onclick = function () {
      var p = (($("geoEdProv") || {}).value || "").trim();
      var c = (($("geoEdCity") || {}).value || "").trim();
      var n = (($("geoEdNewDist") || {}).value || "").trim();
      if (!p) { alert("اول استان را انتخاب کنید."); return; }
      if (!c) { alert("اول شهر را انتخاب کنید."); return; }
      if (!n) { alert("نام منطقه را بنویسید."); return; }
      addExtraDistrict(p, c, n);
      if ($("geoEdNewDist")) $("geoEdNewDist").value = "";
      reloadDists();
      paintList();
      if (typeof populateDistricts === "function") {
        ["pharmacyDistrict", "doctorDistrict", "orderDistrict"].forEach(function (id) {
          var s = $(id);
          var pref = id.indexOf("pharmacy") === 0 ? "pharmacy" : id.indexOf("doctor") === 0 ? "doctor" : "order";
          var pv = $(pref + "Province"); var cv = $(pref + "City");
          if (s && pv && cv && pv.value === p && cv.value === c) populateDistricts(p, c, s, s.value);
        });
      }
      alert("منطقه «" + n + "» زیر شهر «" + c + "» ذخیره شد.");
    };
  }

  function tightenAddPanel() {
    var panel = $("addTabPanel");
    if (!panel) return;
    panel.classList.add("add-compact");
    var tabId = window._activeAddTab || "";
    if (/pharmac|doctor|order/i.test(tabId)) mountGeoEditor(panel);
    Array.prototype.forEach.call(panel.querySelectorAll(".add-opt-list li"), function (li) {
      li.classList.add("add-opt-tight");
    });
  }

  function watchAddPanel() {
    var panel = $("addTabPanel");
    if (!panel || panel.dataset.v16obs === "1") return;
    panel.dataset.v16obs = "1";
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(tightenAddPanel, 40);
    }).observe(panel, { childList: true, subtree: true });
  }

  function wrapListRenders() {
    ["renderPharmaciesList", "renderDoctorsList", "renderOrdersList"].forEach(function (name) {
      if (typeof window[name] !== "function" || window["_v16" + name]) return;
      window["_v16" + name] = true;
      var orig = window[name];
      window[name] = function () {
        var r = orig.apply(this, arguments);
        setTimeout(freezeKnownTables, 40);
        return r;
      };
    });
  }

  function boot() {
    try { applyGeoExtrasToData(); } catch (e) {}
    try { wrapPopulateGeo(); } catch (e) {}
    try { wrapInstantAddPharmacy(); } catch (e) {}
    try { hookPharmacyNameField(); } catch (e) {}
    try { wrapPharmacySaveDup(); } catch (e) {}
    try { enhanceAllSelects(document); } catch (e) {}
    try { undoOldFreeze(); } catch (e) {}
    try { freezeKnownTables(); } catch (e) {}
    try { wrapListRenders(); } catch (e) {}
    try { watchAddPanel(); tightenAddPanel(); } catch (e) {}

    var host = $("columnsDesignerHost");
    if (host && !host.dataset.v16fz) {
      host.dataset.v16fz = "1";
      var t;
      new MutationObserver(function () {
        clearTimeout(t);
        t = setTimeout(function () {
          if ($("colFieldList")) refreshFrozenTable($("colFieldList"));
        }, 50);
      }).observe(host, { childList: true, subtree: true });
    }

    var origSw = window.switchTab;
    if (typeof origSw === "function" && !window._v16Sw) {
      window._v16Sw = true;
      window.switchTab = function (id) {
        origSw(id);
        setTimeout(function () {
          try { enhanceAllSelects(document.getElementById(id) || document); } catch (e) {}
          if (id === "tab-columns-products") freezeKnownTables();
          if (id === "tab-pharmacies" || id === "tab-doctors" || id === "tab-orders") {
            hookPharmacyNameField();
            freezeKnownTables();
          }
          if (id === "tab-custom-fields") { watchAddPanel(); tightenAddPanel(); }
          if (id === "tab-manual-design" && typeof window.lockManualDesigner === "function") {
            window.lockManualDesigner();
          }
        }, 200);
      };
    }
    console.log("v16 ready", VER);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
